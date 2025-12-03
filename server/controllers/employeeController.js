const employeeModel = require('../models/employeeModel');
const db = require('../config/db.config');
const bcrypt = require('bcrypt'); // <--- Đã thêm thư viện bcrypt

const employeeController = {
    
    // 1. Lấy danh sách (Sử dụng Model)
    getAllEmployees: async (req, res) => { // Đổi tên thành getAllEmployees cho khớp với Route
        try {
            const employees = await employeeModel.getAllEmployees();
            res.status(200).json(employees);
        } catch (error) {
            console.error("List Employees Error:", error);
            res.status(500).json({ message: 'Lỗi tải danh sách nhân viên.' });
        }
    },

    // 2. Tạo nhân viên mới
    createEmployee: async (req, res) => {
        const { 
            employeeId, fullName, email, phone, address, 
            roleName, baseSalary, username, password 
        } = req.body;

        const roleMap = { 'Warehouse': 3, 'Sales': 4, 'Online Sales': 5, 'Shipper': 6 };
        const roleId = roleMap[roleName];

        if (!roleId) return res.status(400).json({ message: 'Chức vụ không hợp lệ.' });

        let connection;
        try {
            connection = await db.getConnection();
            await connection.beginTransaction();

            // Kiểm tra trùng username
            const [existingUser] = await connection.query("SELECT user_id FROM users WHERE username = ?", [username]);
            if (existingUser.length > 0) {
                await connection.release();
                return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
            }

            // B1: Tạo User
            // (Lưu ý: Mật khẩu nên được mã hóa bcrypt trước khi lưu, ở đây tạm lưu plain text theo code của bạn)
            // Nếu muốn mã hóa: const hashedPassword = await bcrypt.hash(password, 10);
            const insertUserSql = `
                INSERT INTO users (user_id, username, password_hash, role_id, full_name, status)
                VALUES (?, ?, ?, ?, ?, 'Active')
            `;
            await connection.query(insertUserSql, [employeeId, username, password, roleId, fullName]);

            // B2: Tạo Employee
            const insertEmpSql = `
                INSERT INTO employees 
                (employee_id, user_id, full_name, email, phone, address, start_date, employee_type, department, base_salary)
                VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Full-time', ?, ?)
            `;
            await connection.query(insertEmpSql, [employeeId, employeeId, fullName, email, phone, address, roleName, baseSalary]);

            await connection.commit();
            connection.release();
            res.status(201).json({ message: 'Thêm nhân viên thành công!' });

        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error("Create Employee Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống khi thêm nhân viên.', details: error.message });
        }
    }, // <--- Đã thêm dấu phẩy quan trọng ở đây

    // 3. XỬ LÝ SỬA NHÂN VIÊN
    updateEmployee: async (req, res) => {
        const employeeId = req.params.id;
        const data = req.body;

        try {
            let hashedPassword = null;
            if (data.password && data.password.trim() !== '') {
                hashedPassword = await bcrypt.hash(data.password, 10);
            }

            await employeeModel.update(employeeId, data, hashedPassword);

            res.status(200).json({ message: 'Cập nhật thành công!' });
        } catch (error) {
            console.error("Update Error:", error);
            res.status(500).json({ message: 'Lỗi khi cập nhật nhân viên.' });
        }
    },

    // 4. XỬ LÝ XÓA NHÂN VIÊN
    deleteEmployee: async (req, res) => {
        const employeeId = req.params.id;

        try {
            // Bước 1: Tìm user_id
            const userId = await employeeModel.getUserIdByEmpId(employeeId);
            
            if (!userId) {
                return res.status(404).json({ message: 'Không tìm thấy nhân viên này.' });
            }

            // Bước 2: Xóa User (Cascade xóa Employee)
            await employeeModel.deleteUser(userId);

            res.status(200).json({ message: 'Đã xóa nhân viên và tài khoản liên quan.' });
        } catch (error) {
            console.error("Delete Error:", error);
            res.status(500).json({ message: 'Lỗi khi xóa dữ liệu.' });
        }
    }
};

module.exports = employeeController;