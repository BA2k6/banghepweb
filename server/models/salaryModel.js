// /server/models/salaryModel.js
const db = require('../config/db.config');

const salaryModel = {
    getAllSalaries: async () => {
        const query = `
    SELECT 
        s.salary_id as id, 
        s.month_year as monthYear, 
        s.base_salary, s.sales_commission, s.bonus, 
        s.deductions, s.net_salary,
        u.full_name as staffName, /* Tên nhân viên từ bảng users */
        s.user_id                 /* Mã nhân viên nhận lương */
    FROM salaries s
    JOIN users u ON s.user_id = u.user_id
    ORDER BY s.month_year DESC, s.salary_id
`;
        const [rows] = await db.query(query);
        return rows;
    }
};

module.exports = salaryModel;