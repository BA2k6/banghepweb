// /server/models/stockInModel.js (VERSION CUỐI CÙNG)

const db = require('../config/db.config');

const stockInModel = {
    getAllStockInReceipts: async () => {
        const query = `
            SELECT 
                si.stock_in_id AS id, 
                si.supplier_name AS supplierName, 
                /* Lấy ngày nhập và định dạng */
                DATE_FORMAT(si.import_date, '%Y-%m-%d') AS importDate, 
                si.total_cost AS totalCost, 
                /* Lấy tên nhân viên từ bảng users */
                u.full_name AS staffName
            FROM stock_in si
            /* JOIN bằng user_id của nhân viên */
            JOIN users u ON si.user_id = u.user_id
            ORDER BY si.import_date DESC
        `;
        try {
            const [rows] = await db.query(query);
            return rows;
        } catch (error) {
            console.error("❌ Database Error listing stock in receipts:", error);
            // Quan trọng: Báo lỗi chi tiết để dễ debug
            throw new Error(`Database Query Failed for Stock In: ${error.message}`);
        }
    },
};

module.exports = stockInModel;