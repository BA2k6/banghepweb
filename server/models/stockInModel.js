const db = require('../config/db.config');

const stockInModel = {
    // 1. Lấy danh sách phiếu nhập (Master)
    getAllStockInReceipts: async () => {
        const query = `
            SELECT 
                si.stock_in_id AS id, 
                si.supplier_name AS supplierName, 
                DATE_FORMAT(si.import_date, '%Y-%m-%d %H:%i') AS importDate, 
                si.total_cost AS totalCost, 
                u.full_name AS staffName
            FROM stock_in si
            LEFT JOIN users u ON si.user_id = u.user_id
            ORDER BY si.import_date DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 2. Lấy chi tiết nhập kho (Details)
    getAllStockInItems: async () => {
        const query = `
            SELECT 
                sid.stock_in_id AS stockInId,
                sid.variant_id AS variantId,
                sid.quantity,
                sid.cost_price AS priceImport,
                p.name AS productName,
                pv.color,
                pv.size,
                si.import_date
            FROM stock_in_details sid
            JOIN stock_in si ON sid.stock_in_id = si.stock_in_id
            JOIN product_variants pv ON sid.variant_id = pv.variant_id
            JOIN products p ON pv.product_id = p.product_id
            ORDER BY si.import_date DESC, sid.stock_in_id DESC
        `;
        const [rows] = await db.query(query);
        return rows.map(row => ({
            _id: `${row.stockInId}_${row.variantId}`,
            stockInId: row.stockInId,
            variantId: row.variantId,
            productName: row.productName,
            color: row.color,
            size: row.size,
            quantity: row.quantity,
            priceImport: parseFloat(row.priceImport || 0),
        }));
    },

    // 3. Tạo chi tiết nhập kho mới (QUAN TRỌNG: CÓ TÍNH GIÁ BÌNH QUÂN)
    createStockInItem: async (item) => {
        const { variantId, quantity, priceImport, stockInId: providedId, supplierName = 'Nhà cung cấp mặc định', userId = 'WH01' } = item;
        
        const qtyImport = parseInt(quantity, 10);
        const priceImportFloat = parseFloat(priceImport);
        const connection = await db.getConnection(); // Bắt đầu Transaction

        try {
            await connection.beginTransaction();

            // A. Xử lý Mã Phiếu Nhập (stockInId)
            let stockInId = providedId;
            if (!stockInId) {
                 // Tìm mã phiếu cuối cùng, nếu không có thì tạo SI + timestamp ngắn
                 const [lastRows] = await connection.query('SELECT stock_in_id FROM stock_in ORDER BY import_date DESC LIMIT 1');
                 if(lastRows.length > 0) {
                     // Logic này dùng lại phiếu nhập gần nhất nếu muốn gộp, hoặc bạn có thể luôn tạo mới tùy nghiệp vụ
                     stockInId = lastRows[0].stock_in_id; 
                 } else {
                     stockInId = `SI${Date.now().toString().slice(-6)}`;
                 }
            }
            
            // B. Tạo hoặc Cập nhật Phiếu Nhập (Master)
            const [existingReceipt] = await connection.query('SELECT stock_in_id FROM stock_in WHERE stock_in_id = ?', [stockInId]);
            const totalItemCost = qtyImport * priceImportFloat;

            if (existingReceipt.length === 0) {
                await connection.query(
                    `INSERT INTO stock_in (stock_in_id, supplier_name, import_date, total_cost, user_id)
                     VALUES (?, ?, NOW(), ?, ?)`,
                    [stockInId, supplierName, totalItemCost, userId]
                );
            } else {
                await connection.query(
                    'UPDATE stock_in SET total_cost = total_cost + ? WHERE stock_in_id = ?',
                    [totalItemCost, stockInId]
                );
            }

            // C. Insert vào chi tiết nhập (History)
            // Dùng ON DUPLICATE KEY UPDATE để cộng dồn nếu lỡ thêm trùng sản phẩm trong cùng 1 phiếu
            await connection.query(
                `INSERT INTO stock_in_details (stock_in_id, variant_id, quantity, cost_price)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 quantity = quantity + VALUES(quantity),
                 cost_price = VALUES(cost_price)`, 
                [stockInId, variantId, qtyImport, priceImportFloat]
            );

            // =================================================================================
            // D. TÍNH TOÁN GIÁ VỐN BÌNH QUÂN (WEIGHTED AVERAGE COST) & CẬP NHẬT TỒN KHO
            // =================================================================================
            

            // D1. Lấy thông tin hiện tại của Sản phẩm cha và Biến thể
            const [productInfo] = await connection.query(`
                SELECT p.product_id, p.cost_price AS current_cost, pv.stock_quantity AS current_stock
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.product_id
                WHERE pv.variant_id = ?
            `, [variantId]);

            if (productInfo.length > 0) {
                const { product_id, current_cost, current_stock } = productInfo[0];
                
                // Chuyển đổi số liệu an toàn
                const oldStock = parseInt(current_stock || 0);
                const oldCost = parseFloat(current_cost || 0);

                // D2. Cập nhật Tồn kho Biến thể
                const newStock = oldStock + qtyImport;
                await connection.query(
                    `UPDATE product_variants SET stock_quantity = ? WHERE variant_id = ?`,
                    [newStock, variantId]
                );

                // D3. Tính giá bình quân mới cho Sản phẩm cha (Products)
                // Công thức: ((Giá cũ * Tồn cũ) + (Giá nhập * SL nhập)) / (Tồn cũ + SL nhập)
                let newAvgCost = priceImportFloat;
                if (newStock > 0) { // Tránh chia cho 0
                    const totalOldValue = oldStock * oldCost;
                    const totalImportValue = qtyImport * priceImportFloat;
                    newAvgCost = (totalOldValue + totalImportValue) / newStock;
                }

                // D4. Cập nhật giá vốn mới vào bảng Products
                await connection.query(
                    `UPDATE products SET cost_price = ? WHERE product_id = ?`,
                    [newAvgCost, product_id] 
                );
            }

            await connection.commit();
            return { success: true, stockInId };

        } catch (error) {
            await connection.rollback();
            console.error("Transaction Error:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    // 4. Xóa chi tiết nhập kho
    deleteStockInItem: async (stockInId, variantId) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Lấy thông tin cũ để trừ tiền/kho
            const [rows] = await connection.query(
                'SELECT quantity, cost_price FROM stock_in_details WHERE stock_in_id = ? AND variant_id = ?',
                [stockInId, variantId]
            );

            if (rows.length === 0) throw new Error("Chi tiết phiếu nhập không tồn tại");
            
            const { quantity, cost_price } = rows[0];
            const qtyToDelete = parseInt(quantity);
            const totalCostToDelete = qtyToDelete * parseFloat(cost_price);

            // Xóa detail
            await connection.query('DELETE FROM stock_in_details WHERE stock_in_id = ? AND variant_id = ?', [stockInId, variantId]);

            // Trừ tổng tiền phiếu nhập
            await connection.query('UPDATE stock_in SET total_cost = total_cost - ? WHERE stock_in_id = ?', [totalCostToDelete, stockInId]);

            // Trừ tồn kho (Rollback kho)
            // Lưu ý: Khi xóa phiếu nhập, ta thường KHÔNG tính lại giá vốn (Average Cost) ngược lại vì rất phức tạp
            // Ta chỉ trừ số lượng tồn kho thôi.
            await connection.query('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE variant_id = ?', [qtyToDelete, variantId]);

            // Nếu phiếu nhập rỗng thì xóa luôn Master
            const [remain] = await connection.query('SELECT count(*) as c FROM stock_in_details WHERE stock_in_id = ?', [stockInId]);
            if (remain[0].c === 0) {
                await connection.query('DELETE FROM stock_in WHERE stock_in_id = ?', [stockInId]);
            }

            await connection.commit();
            return { success: true };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = stockInModel;