// /server/controllers/salaryController.js
const salaryModel = require('../models/salaryModel');

const salaryController = {
    listSalaries: async (req, res) => {
        // TODO: Cần middleware kiểm tra quyền Owner/Admin
        try {
            const salaries = await salaryModel.getAllSalaries(); // Gọi Model
            res.status(200).json(salaries);
        } catch (error) {
            console.error("Error listing salaries:", error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách bảng lương.' });
        }
    }
};

module.exports = salaryController;