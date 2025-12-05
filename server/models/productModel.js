const db = require('../config/db.config');

const productModel = {
    // 1. Lấy danh sách sản phẩm (Màn hình chính)
    getAllProducts: async (options = {}) => {
        const params = [];
        let whereClause = 'WHERE 1=1'; 

        if (options.categoryId && options.categoryId !== 'all') {
            whereClause += ' AND p.category_id = ?';
            params.push(options.categoryId);
        }

        const query = `
            SELECT 
                p.product_id as id,
                p.name,
                p.base_price as price,
                p.cost_price as costPrice,
                p.is_active as isActive,
                p.category_id as categoryId,
                c.category_name as categoryName,
                p.brand,
                p.created_at,
                -- Tổng tồn kho từ bảng biến thể
                (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.product_id) as stockQuantity,
                -- Gom nhóm Size/Màu
                (SELECT GROUP_CONCAT(DISTINCT size ORDER BY size ASC SEPARATOR ', ') FROM product_variants WHERE product_id = p.product_id) as sizes,
                (SELECT GROUP_CONCAT(DISTINCT color SEPARATOR ', ') FROM product_variants WHERE product_id = p.product_id) as colors
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ${whereClause}
            ORDER BY p.created_at DESC
        `;

        const [rows] = await db.query(query, params);
        return rows;
    },

    // 2. Lấy chi tiết sản phẩm + Biến thể
    getProductById: async (id) => {
        try {
            // Query 1: Thông tin chung
            const queryProduct = `
                SELECT 
                    p.product_id as id,
                    p.name,
                    p.description,
                    p.base_price as price,
                    p.cost_price as costPrice,
                    p.is_active as isActive,
                    p.category_id as categoryId,
                    c.category_name as categoryName,
                    p.brand,
                    p.created_at,
                    p.avg_rating as avgRating,
                    p.review_count as reviewCount
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE p.product_id = ?
            `;
            
            // Query 2: Danh sách biến thể
            const queryVariants = `
                SELECT variant_id, color, size, stock_quantity 
                FROM product_variants 
                WHERE product_id = ?
                ORDER BY color, size
            `;

            const [productRows] = await db.query(queryProduct, [id]);
            const [variantRows] = await db.query(queryVariants, [id]);

            if (productRows.length === 0) return null;

            const product = productRows[0];
            product.variants = variantRows; 
            
            // Tính toán lại tổng tồn kho & size/color list
            product.stockQuantity = variantRows.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
            product.sizes = [...new Set(variantRows.map(v => v.size))].join(', ');
            product.colors = [...new Set(variantRows.map(v => v.color))].join(', ');

            return product;
        } catch (error) {
            console.error("SQL Error getProductById:", error);
            throw error;
        }
    },

    // 3. Lấy danh sách TẤT CẢ biến thể (Phục vụ màn hình Nhập kho)
    getAllVariants: async () => {
        const query = `
            SELECT 
                pv.variant_id, 
                pv.product_id, 
                pv.color, 
                pv.size, 
                pv.stock_quantity, 
                p.name AS product_name,
                p.cost_price 
            FROM product_variants pv
            JOIN products p ON pv.product_id = p.product_id
            ORDER BY p.created_at DESC, pv.variant_id ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // 4. Sinh mã sản phẩm tự động (P001, P002...)
    generateNextId: async () => {
        // Tìm mã có số lớn nhất (Pxxx)
        // Dùng REGEXP để chỉ lấy các mã đúng định dạng P + số
        const query = `
            SELECT product_id 
            FROM products 
            WHERE product_id REGEXP '^P[0-9]+$' 
            ORDER BY CAST(SUBSTRING(product_id, 2) AS UNSIGNED) DESC 
            LIMIT 1
        `;
        const [rows] = await db.query(query);
        
        let nextId = 'P001';
        if (rows.length > 0) {
            const lastId = rows[0].product_id; 
            const numberPart = parseInt(lastId.substring(1), 10); 
            const nextNumber = numberPart + 1; 
            nextId = 'P' + String(nextNumber).padStart(3, '0');
        }
        return nextId;
    },

    // 5. Tạo Header (Bảng products)
    createProductHeader: async (product, conn) => {
        const { id, name, categoryId, price, costPrice, isActive, brand, description } = product;
        const query = `
            INSERT INTO products (product_id, name, category_id, base_price, cost_price, is_active, brand, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Hỗ trợ cả transaction (conn) và non-transaction (db)
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [id, name, categoryId || null, price, costPrice, isActive ? 1 : 0, brand || null, description || null]);
    },

    // 6.1 Tạo biến thể Đơn (Mặc định)
    createSingleVariant: async ({ productId, stock }, conn) => {
        // ID biến thể: P001_DEFAULT
        const variantId = `${productId}_DEF`.substring(0, 25);
        const query = `
            INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
            VALUES (?, ?, 'Default', 'Free', ?)
        `;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [variantId, productId, stock]);
    },

    // 6.2 Tạo biến thể Hàng loạt (Size/Màu)
    createVariantsBulk: async (productId, sizeStr, colorStr, conn) => {
        if (!sizeStr && !colorStr) return;

        // Tách chuỗi thành mảng và loại bỏ phần tử rỗng
        let sizes = sizeStr ? sizeStr.split(',').map(s => s.trim()).filter(Boolean) : ['Free'];
        let colors = colorStr ? colorStr.split(',').map(c => c.trim()).filter(Boolean) : ['Default'];
        
        // Nếu mảng rỗng thì gán mặc định
        if (sizes.length === 0) sizes = ['Free'];
        if (colors.length === 0) colors = ['Default'];

        const executor = conn ? conn.query.bind(conn) : db.query;

        let index = 1;
        for (const color of colors) {
            for (const size of sizes) {
                // Tạo ID biến thể thông minh: P001_1, P001_2... để tránh trùng lặp và ngắn gọn
                // Cách cũ của bạn dùng tên màu/size làm ID rất dễ lỗi nếu tên dài hoặc có dấu tiếng Việt
                const variantId = `${productId}_${index}`; 
                
                const sql = `
                    INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
                    VALUES (?, ?, ?, ?, 0) 
                `;
                
                try {
                    await executor(sql, [variantId, productId, color, size]);
                    index++;
                } catch (err) {
                    console.error(`Lỗi tạo biến thể ${variantId}:`, err.message);
                    // Không throw lỗi để các biến thể khác vẫn được tạo (hoặc throw tùy logic của bạn)
                    throw err; 
                }
            }
        }
    },

    // 7. Cập nhật sản phẩm
    updateProductHeader: async (id, product) => {
        const { name, categoryId, price, costPrice, isActive, brand, description } = product;
        const query = `
            UPDATE products 
            SET name=?, category_id=?, base_price=?, cost_price=?, is_active=?, brand=?, description=?
            WHERE product_id=?
        `;
        const [result] = await db.query(query, [name, categoryId, price, costPrice, isActive ? 1 : 0, brand, description, id]);
        return result;
    },

    // 8. Xóa sản phẩm
    deleteProduct: async (id) => {
        // Lưu ý: Do có Foreign Key CASCADE nên xóa bảng cha (products) sẽ tự xóa bảng con (variants)
        const query = `DELETE FROM products WHERE product_id = ?`;
        const [result] = await db.query(query, [id]);
        return result;
    }
};

module.exports = productModel;