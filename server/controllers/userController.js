const userModel = require('../models/userModel');
const db = require('../config/db.config');
const bcrypt = require('bcrypt'); // [BỔ SUNG QUAN TRỌNG]

const userController = {
    // ============================================================
    // 1. LẤY DANH SÁCH USER (Cho Admin)
    // ============================================================
    listUsers: async (req, res) => {
        try {
            const users = await userModel.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy danh sách nhân viên.' });
        }
    },

    // ============================================================
    // 2. TẠO USER MỚI (Đã thêm hash password)
    // ============================================================
    createUser: async (req, res) => {
        const requesterRole = req.user ? req.user.roleName : null; 
        const { userId, username, password, fullName, phone, roleName, email } = req.body;

        if (!userId || !username || !password || !fullName || !roleName) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        // Kiểm tra quyền
        if (requesterRole) {
            if (roleName !== 'Customer' && requesterRole !== 'Owner') return res.status(403).json({ message: 'Không đủ quyền.' });
            if (roleName === 'Customer' && !['Owner', 'Sales', 'Online Sales'].includes(requesterRole)) return res.status(403).json({ message: 'Không đủ quyền.' });
        }

        const roleMap = { 'Owner': 1, 'Customer': 2, 'Warehouse': 3, 'Sales': 4, 'Online Sales': 5, 'Shipper': 6 };
        const roleId = roleMap[roleName];
        if (!roleId) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });

        let connection;
        try {
            // Hash mật khẩu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            connection = await db.getConnection();
            await connection.beginTransaction();

            const [dupUser] = await connection.query("SELECT user_id FROM users WHERE username = ?", [username]);
            if (dupUser.length > 0) { await connection.release(); return res.status(409).json({ message: 'Username đã tồn tại.' }); }

            const [dupId] = await connection.query("SELECT user_id FROM users WHERE user_id = ?", [userId]);
            if (dupId.length > 0) { await connection.release(); return res.status(409).json({ message: 'User ID đã tồn tại.' }); }

            // Insert User (Status active, must change pass = true)
            await connection.query(
                "INSERT INTO users (user_id, username, password_hash, role_id, status, must_change_password) VALUES (?, ?, ?, ?, 'Active', TRUE)",
                [userId, username, hashedPassword, roleId]
            );

            // Insert Profile
            if (roleName === 'Customer') {
                await connection.query("INSERT INTO customers (customer_id, user_id, full_name, phone, email) VALUES (?, ?, ?, ?, ?)", [userId, userId, fullName, phone, email || null]);
            } else if (roleName !== 'Owner') {
                const empEmail = email || `${username}@store.com`;
                await connection.query("INSERT INTO employees (employee_id, user_id, full_name, email, phone, start_date, employee_type, department, base_salary) VALUES (?, ?, ?, ?, ?, CURDATE(), 'Full-time', ?, 5000000)", [userId, userId, fullName, empEmail, phone, roleName]);
            }

            await connection.commit();
            connection.release();
            res.status(201).json({ message: 'Tạo tài khoản thành công!' });

        } catch (error) {
            if (connection) { await connection.rollback(); connection.release(); }
            console.error("Create User Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống.' });
        }
    },

    // ============================================================
    // 3. ADMIN RESET MẬT KHẨU (Force Logout)
    // ============================================================
 adminResetPassword: async (req, res) => {
        const targetUserId = req.body.targetUserId || req.body.userId; 
        const { newPassword } = req.body;
        
        if (!targetUserId || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin.' });

        try {
            // 🟢 MÃ HÓA MẬT KHẨU MỚI
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // 🟢 Dùng null để tránh lỗi tràn số (Model sẽ tự +1)
            const newTokenVersion = null; 

            // Gọi model để lưu mật khẩu mã hóa
            await userModel.adminResetPassword(targetUserId, hashedPassword, newTokenVersion);
            
            res.status(200).json({ message: 'Đổi mật khẩu thành công. User sẽ bị đăng xuất.' });
        } catch (error) {
            console.error("Reset Pass Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống.' });
        }
    },

    // ============================================================
    // 4. ADMIN CẬP NHẬT TRẠNG THÁI (Khóa/Mở)
    // ============================================================
    updateUserStatus: async (req, res) => {
        const userId = req.params.id; 
        const { status } = req.body; 

        if (!userId || !status) return res.status(400).json({ message: 'Thiếu thông tin.' });

        const s = status.toString().toLowerCase();
        let dbStatus = status;
        if (s === 'hoạt động') dbStatus = 'Active';
        if (s === 'đã khóa' || s === 'locked') dbStatus = 'Locked';

        if (dbStatus !== 'Active' && dbStatus !== 'Locked') return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });

        try {
            // 🟢 [SỬA LỖI] Dùng null để tránh lỗi tràn số (Model sẽ tự +1)
            const newTokenVersion = null;

            await userModel.updateStatus(userId, dbStatus, newTokenVersion);
            res.status(200).json({ message: `Đã cập nhật trạng thái thành ${dbStatus}` });
        } catch (error) {
            console.error("Update Status Error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống.' });
        }
    },

    
    getUserProfile: async (req, res) => {
        try {
            // Lấy ID từ Token (đã qua middleware verifyToken)
            const userId = req.user.userId || req.user.id; 
            
            const user = await userModel.getProfileById(userId);
            
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy thông tin người dùng.' });
            }
            
            // Trả về dữ liệu sạch
            res.status(200).json(user);
        } catch (error) {
            console.error("Get Profile Error:", error);
            res.status(500).json({ message: 'Lỗi server khi lấy thông tin.' });
        }
    },

    // ============================================================
    // UPDATE PROFILE (Cập nhật thông tin)
    // ============================================================
    updateUserProfile: async (req, res) => {
        try {
            const userId = req.user.userId || req.user.id;
            const roleName = req.user.roleName; // Lấy role để biết update bảng nào
            const { full_name, phone, address, date_of_birth } = req.body;

            // Xử lý ngày tháng: Nếu rỗng thì gửi null để tránh lỗi SQL Incorrect Date
            const dobValue = date_of_birth ? date_of_birth : null;

            const data = { 
                full_name, 
                phone, 
                address, 
                date_of_birth: dobValue 
            };

            let result;
            
            // Danh sách các vai trò là Nhân viên (để update bảng employees)
            const employeeRoles = ['Owner', 'Store Manager', 'Sales Staff', 'Warehouse Staff', 'Shipper'];
            
            if (employeeRoles.includes(roleName)) {
                // Update bảng EMPLOYEES
                result = await userModel.updateEmployeeProfile(userId, data);
            } else {
                // Mặc định còn lại là CUSTOMERS
                result = await userModel.updateCustomerProfile(userId, data);
            }

            if (result.affectedRows === 0) {
                // Trường hợp này xảy ra nếu ID không khớp hoặc dữ liệu mới y hệt dữ liệu cũ
                return res.status(200).json({ message: 'Đã lưu (Không có thay đổi nào được thực hiện).' });
            }

            res.status(200).json({ message: 'Cập nhật hồ sơ thành công!' });

        } catch (error) {
            console.error("Update Profile Error:", error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ.' });
        }
    },
};

module.exports = userController;