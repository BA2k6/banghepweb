// /server/controllers/customerController.js
const customerModel = require('../models/customerModel');
const customerController = {
    listCustomers: async (req, res) => {
        // TODO: Cần middleware kiểm tra Auth/Permission
        try {
            const customers = await customerModel.getAllCustomers();
            res.status(200).json(customers);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy danh sách khách hàng.' });
        }
    }
};
module.exports = customerController;