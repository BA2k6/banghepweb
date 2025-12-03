//C:\Users\Admin\Downloads\DUANWEB(1)\server\controllers\employeeController.js
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
    // 2. Tạo nhân viên mới
    createEmployee: async (req, res) => {
        try {
            // Lấy dữ liệu từ Frontend gửi lên (đúng tên biến camelCase)
            const { 
                employeeId, fullName, email, phone, address, 
                roleName, baseSalary, username, password 
            } = req.body;

            // Map tên chức vụ (từ Frontend) sang ID (trong Database)
            const roleMap = { 
                'Warehouse': 3, 'Kho': 3,
                'Sales': 4, 'Bán hàng': 4,
                'Online Sales': 5, 'Sale Online': 5,
                'Shipper': 6, 'Giao hàng': 6 
            };
            const roleId = roleMap[roleName];

            if (!roleId) {
                return res.status(400).json({ message: 'Chức vụ không hợp lệ.' });
            }

            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Kiểm tra trùng username
                const [existingUser] = await connection.query("SELECT user_id FROM users WHERE username = ?", [username]);
                if (existingUser.length > 0) {
                    await connection.rollback(); // Quan trọng: rollback trước khi return
                    connection.release();
                    return res.status(409).json({ message: 'Tên đăng nhập đã tồn tại.' });
                }

                // --- BƯỚC 1: TẠO USER (SỬA LỖI 500 TẠI ĐÂY) ---
                // XÓA 'full_name' khỏi câu lệnh này vì bảng users không có cột đó
                const insertUserSql = `
                    INSERT INTO users (user_id, username, password_hash, role_id, status)
                    VALUES (?, ?, ?, ?, 'Active')
                `;
                // Lưu ý: Đang lưu password thường. Nếu cần bảo mật hãy dùng bcrypt.
                await connection.query(insertUserSql, [employeeId, username, password, roleId]);

                // --- BƯỚC 2: TẠO EMPLOYEE ---
                // full_name được lưu ở bảng này
                const insertEmpSql = `
                    INSERT INTO employees 
                    (employee_id, user_id, full_name, email, phone, address, start_date, employee_type, department, base_salary)
                    VALUES (?, ?, ?, ?, ?, ?, CURDATE(), 'Full-time', ?, ?)
                `;
                await connection.query(insertEmpSql, [employeeId, employeeId, fullName, email, phone, address, roleName, baseSalary]);

                await connection.commit();
                connection.release();
                
                res.status(201).json({ message: 'Thêm nhân viên thành công!' });

            } catch (err) {
                await connection.rollback();
                connection.release();
                throw err; // Ném lỗi ra catch bên ngoài để log
            }

        } catch (error) {
            console.error("CREATE EMPLOYEE ERROR:", error); // Xem lỗi chi tiết ở Terminal
            res.status(500).json({ 
                message: 'Lỗi hệ thống khi thêm nhân viên.', 
                details: error.sqlMessage || error.message 
            });
        }
    },
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