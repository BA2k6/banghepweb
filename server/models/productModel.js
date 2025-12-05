// server/models/productModel.js
const db = require('../config/db.config');

const productModel = {
    // 1. Lấy danh sách (Cho màn hình chính) - Dùng Subquery để tránh lỗi GROUP BY
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
                -- Tính tổng tồn kho bằng subquery (An toàn tuyệt đối)
                (SELECT COALESCE(SUM(stock_quantity), 0) FROM product_variants WHERE product_id = p.product_id) as stockQuantity,
                -- Gom nhóm Size/Màu để hiển thị
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

    // 2. Lấy chi tiết (Dùng 2 query song song để tránh lỗi 500)
    getProductById: async (id) => {
        try {
            // Query 1: Thông tin cơ bản
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
            
            // Query 2: Danh sách biến thể chi tiết
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
            product.variants = variantRows; // Gắn mảng variants vào
            
            // Tính toán lại tổng tồn kho bằng JS
            product.stockQuantity = variantRows.reduce((sum, v) => sum + (v.stock_quantity || 0), 0);
            product.sizes = [...new Set(variantRows.map(v => v.size))].join(', ');
            product.colors = [...new Set(variantRows.map(v => v.color))].join(', ');

            return product;
        } catch (error) {
            console.error("SQL Error:", error);
            throw error;
        }
    },

    // 3. Sinh mã tự động (P001, P002...)
    generateNextId: async () => {
        // Tìm mã lớn nhất hiện tại (dạng P + số)
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
            const numberPart = parseInt(lastId.substring(1)); 
            const nextNumber = numberPart + 1; 
            // Pad số 0 (3 chữ số)
            nextId = 'P' + String(nextNumber).padStart(3, '0');
        }
        return nextId;
    },

    // 4. Tạo Header (Đã bỏ cột material)
    createProductHeader: async (product, conn) => {
        const { id, name, categoryId, price, costPrice, isActive, brand, description } = product;
        const query = `
            INSERT INTO products (product_id, name, category_id, base_price, cost_price, is_active, brand, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [id, name, categoryId || null, price, costPrice, isActive ? 1 : 0, brand || null, description || null]);
    },

    // 5.1 Tạo biến thể Đơn
    createSingleVariant: async ({ productId, stock }, conn) => {
        const variantId = `${productId}-DEFAULT`.substring(0, 25);
        const query = `
            INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
            VALUES (?, ?, 'Default', 'Free', ?)
        `;
        const executor = conn ? conn.query.bind(conn) : db.query;
        await executor(query, [variantId, productId, stock]);
    },

    // 5.2 Tạo biến thể Hàng loạt
    createVariantsBulk: async (productId, sizeStr, colorStr, conn) => {
        if (!sizeStr && !colorStr) return;

        let sizes = sizeStr ? sizeStr.split(',').map(s => s.trim()).filter(Boolean) : ['Free'];
        let colors = colorStr ? colorStr.split(',').map(c => c.trim()).filter(Boolean) : ['Default'];
        
        const executor = conn ? conn.query.bind(conn) : db.query;

        for (const color of colors) {
            for (const size of sizes) {
                // Tạo ID biến thể: PROD-RED-XL
                let suffix = '';
                if (color !== 'Default') suffix += `-${color.replace(/\s+/g, '').toUpperCase().substring(0,3)}`;
                if (size !== 'Free') suffix += `-${size.replace(/\s+/g, '').toUpperCase()}`;
                if (!suffix) suffix = '-DEF';

                let variantId = `${productId}${suffix}`.substring(0, 25);

                const sql = `
                    INSERT INTO product_variants (variant_id, product_id, color, size, stock_quantity)
                    VALUES (?, ?, ?, ?, 0) 
                    ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
                `;
                await executor(sql, [variantId, productId, color, size]); 
            }
        }
    },

    // 6. Update (Đã bỏ cột material)
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

    // 7. Delete
    deleteProduct: async (id) => {
        const query = `DELETE FROM products WHERE product_id = ?`;
        const [result] = await db.query(query, [id]);
        return result;
    }
};

module.exports = productModel;