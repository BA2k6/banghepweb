// /server/models/productModel.js
const db = require('../config/db.config');

const productModel = {
    // options: { categoryId }
    getAllProducts: async (options = {}) => {
        const params = [];
        let where = '';
        if (options.categoryId) {
            where = 'WHERE p.category_id = ?';
            params.push(options.categoryId);
        }

        const query = `
            SELECT
                p.product_id as id,
                p.name,
                p.sizes,
                p.colors,
                p.material,
                p.price,
                p.cost_price as costPrice,
                p.stock_quantity as stockQuantity,
                p.is_active as isActive,
                p.category_id as categoryId,
                c.category_name as categoryName
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            ${where}
            ORDER BY p.product_id
        `;

        const [rows] = await db.query(query, params);
        return rows;
    },

    createProduct: async (product) => {
        const { id, name, categoryId = null, price = 0, costPrice = 0, stockQuantity = 0, isActive = true, sizes = null, colors = null, material = null } = product;
        const query = `
            INSERT INTO products (product_id, name, category_id, price, cost_price, stock_quantity, is_active, sizes, colors, material)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [id, name, categoryId, price, costPrice, stockQuantity, isActive ? 1 : 0, sizes, colors, material];
        const [result] = await db.query(query, params);
        return result;
    }
    ,
    updateProduct: async (id, product) => {
        const { name, categoryId = null, price = 0, costPrice = 0, stockQuantity = 0, isActive = true, sizes = null, colors = null, material = null } = product;
        const query = `
            UPDATE products
            SET name = ?, category_id = ?, price = ?, cost_price = ?, stock_quantity = ?, is_active = ?, sizes = ?, colors = ?, material = ?
            WHERE product_id = ?
        `;
        const params = [name, categoryId, price, costPrice, stockQuantity, isActive ? 1 : 0, sizes, colors, material, id];
        const [result] = await db.query(query, params);
        return result;
    },

    deleteProduct: async (id) => {
        const query = `DELETE FROM products WHERE product_id = ?`;
        const [result] = await db.query(query, [id]);
        return result;
    }
,
    getProductById: async (id) => {
        const query = `
            SELECT
                p.product_id as id,
                p.name,
                p.sizes,
                p.colors,
                p.material,
                p.price,
                p.cost_price as costPrice,
                p.stock_quantity as stockQuantity,
                p.is_active as isActive,
                p.category_id as categoryId,
                c.category_name as categoryName,
                p.description
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.product_id = ?
            LIMIT 1
        `;
        const [rows] = await db.query(query, [id]);
        return rows.length ? rows[0] : null;
    }
};

module.exports = productModel;