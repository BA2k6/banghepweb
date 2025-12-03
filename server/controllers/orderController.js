// /server/controllers/orderController.js (KHÔNG CẦN SỬA, CHỈ TỐI ƯU LOG)

const orderModel = require('../models/orderModel');

const orderController = {
    listOrders: async (req, res) => {
        try {
            const orders = await orderModel.getAllOrders(); 
            // PHẢI trả về mảng trực tiếp
            // Thêm || [] để đảm bảo nếu model trả về null thì vẫn gửi mảng rỗng
            res.status(200).json(orders || []); 
        } catch (error) {
            // Log lỗi chi tiết ra màn hình console của Server để bạn debug
            console.error("Error listing orders:", error);
            
            // Trả về thông báo lỗi cho Frontend
            res.status(500).json({ message: 'Lỗi SQL khi truy vấn đơn hàng.', details: error.message });
        }
    }
};

module.exports = orderController;