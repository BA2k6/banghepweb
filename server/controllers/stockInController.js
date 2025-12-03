// /server/controllers/stockInController.js
const stockInModel = require('../models/stockInModel');

const stockInController = {
    listStockInReceipts: async (req, res) => {
        try {
            const receipts = await stockInModel.getAllStockInReceipts();
            res.status(200).json(receipts);
        } catch (error) {
            console.error("Error listing stock in receipts:", error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách phiếu nhập kho.' });
        }
    },
};
module.exports = stockInController;