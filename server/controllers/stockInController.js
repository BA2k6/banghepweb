// server/controllers/stockInController.js

const stockInModel = require('../models/stockInModel');

const stockInController = {
    // 1. Lấy danh sách các phiếu nhập (Header)
    listStockInReceipts: async (req, res) => {
        try {
            const receipts = await stockInModel.getAllStockInReceipts();
            res.status(200).json(receipts);
        } catch (error) {
            console.error("Lỗi listStockInReceipts:", error);
            res.status(500).json({ message: 'Lỗi khi tải danh sách phiếu nhập.' });
        }
    },

    // 2. Lấy danh sách chi tiết hàng hóa đã nhập
    listStockInItems: async (req, res) => {
        try {
            const items = await stockInModel.getAllStockInItems();
            res.status(200).json(items);
        } catch (error) {
            console.error("Lỗi listStockInItems:", error);
            res.status(500).json({ message: 'Lỗi khi tải chi tiết nhập kho.' });
        }
    },

    // 3. Tạo mới dòng nhập kho (Master + Detail + Update Stock)
    createStockInItem: async (req, res) => {
        try {
            const { variantId, quantity, priceImport, note, stockInId } = req.body;
            
            // Validate dữ liệu cơ bản
            if (!variantId || !quantity || quantity <= 0) {
                return res.status(400).json({ message: 'Vui lòng chọn biến thể và số lượng hợp lệ.' });
            }
            if (priceImport === undefined || priceImport === null || priceImport < 0) {
                return res.status(400).json({ message: 'Giá nhập không hợp lệ.' });
            }

            const result = await stockInModel.createStockInItem({
                variantId,
                quantity,
                priceImport,
                note,
                stockInId,
                // Nếu bạn có middleware xác thực, có thể lấy ID nhân viên từ req.user.id
                userId: 'WH01' // Mặc định hoặc lấy từ token
            });

            res.status(201).json({ 
                message: 'Nhập kho thành công.', 
                data: result 
            });

        } catch (error) {
            console.error("Lỗi createStockInItem:", error);
            res.status(500).json({ message: 'Lỗi server khi nhập kho: ' + error.message });
        }
    },

    // 4. Xóa dòng nhập kho
    deleteStockInItem: async (req, res) => {
        try {
            const { id } = req.params; // ID dạng composite: SI001_V001_1
            
            if (!id || !id.includes('_')) {
                return res.status(400).json({ message: 'ID không hợp lệ.' });
            }

            // Tách ID: Phần đầu là stockInId, phần còn lại nối lại là variantId
            // Ví dụ: SI2024_VAR_01 -> stockInId="SI2024", variantId="VAR_01"
            const parts = id.split('_');
            const stockInId = parts[0];
            const variantId = parts.slice(1).join('_'); 
            
            if (!stockInId || !variantId) {
                return res.status(400).json({ message: 'Không xác định được phiếu nhập hoặc biến thể.' });
            }

            await stockInModel.deleteStockInItem(stockInId, variantId);
            
            res.status(200).json({ message: 'Đã xóa chi tiết nhập kho và cập nhật lại tồn kho.' });

        } catch (error) {
            console.error("Lỗi deleteStockInItem:", error);
            // Kiểm tra thông điệp lỗi từ Model để trả về status code phù hợp
            if (error.message === "Chi tiết phiếu nhập không tồn tại") {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: 'Lỗi server khi xóa: ' + error.message });
        }
    }
};

module.exports = stockInController;