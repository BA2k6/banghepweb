const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const db = require('../config/db.config'); 
const bcrypt = require('bcrypt'); // 🟢 [QUAN TRỌNG] Import thư viện mã hóa

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const authController = {
    // ============================================================
    // 1. ĐĂNG NHẬP (LOGIN) - Hỗ trợ cả mật khẩu cũ và mới
    // ============================================================
    login: async (req, res) => {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu.' });
        }

        try {
            const user = await userModel.findByUsername(username);

            if (!user) {
                return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
            }
            
            // 🟢 [SỬA LẠI]: So sánh mật khẩu thông minh
            let isMatch = false;
            
            // Nếu mật khẩu trong DB bắt đầu bằng $2b$ hoặc $2a$ -> Là mật khẩu đã mã hóa
            if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
                isMatch = await bcrypt.compare(password, user.password_hash);
            } else {
                // Ngược lại -> Là mật khẩu cũ (plaintext), so sánh bình thường
                isMatch = (user.password_hash === password);
            }

            if (!isMatch) {
                return res.status(401).json({ message: 'Mật khẩu không chính xác.' });
            }

            // Kiểm tra trạng thái khóa
            const currentStatus = (user.status || '').toLowerCase();
            if (currentStatus === 'locked' || currentStatus === 'khoa') {
                return res.status(403).json({ message: 'Tài khoản đã bị KHÓA. Vui lòng liên hệ Admin.' });
            }

            // Tạo Token
            const token = jwt.sign(
                { 
                    userId: user.user_id, 
                    roleId: user.role_id,
                    tokenVersion: user.token_version 
                }, 
                JWT_SECRET, 
                { expiresIn: '1d' }
            );
            
            res.status(200).json({
                message: 'Đăng nhập thành công',
                token,
                user: {
                    userId: user.user_id,
                    fullName: user.full_name || user.username,
                    roleId: user.role_id,
                    roleName: user.roleName,
                    mustChangePassword: user.must_change_password
                }
            });

        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
        }
    },

    // ============================================================
    // 2. ĐĂNG KÝ (REGISTER) - Mã hóa mật khẩu
    // ============================================================
    register: async (req, res) => {
        const { fullName, phone, password } = req.body;

        if (!fullName || !phone || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        let connection;
        try {
            // 🟢 Mã hóa trước khi lưu
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            connection = await db.getConnection();
            await connection.beginTransaction();

            const [existing] = await connection.query("SELECT user_id FROM users WHERE username = ?", [phone]);
            if (existing.length > 0) {
                await connection.release();
                return res.status(409).json({ message: 'Số điện thoại này đã được đăng ký.' });
            }

            const insertUserQuery = `
                INSERT INTO users 
                (user_id, username, password_hash, role_id, status, must_change_password, token_version)
                VALUES (?, ?, ?, 2, 'Active', FALSE, 0)
            `;
            // Lưu hashedPassword
            await connection.query(insertUserQuery, [phone, phone, hashedPassword]);

            const newCustomerId = `CUS_${phone}`; 
            const insertCustomerQuery = `
                INSERT INTO customers 
                (customer_id, user_id, full_name, phone)
                VALUES (?, ?, ?, ?)
            `;
            await connection.query(insertCustomerQuery, [newCustomerId, phone, fullName, phone]);

            await connection.commit();
            connection.release();

            res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });

        } catch (error) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            console.error("Register error:", error);
            res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký.', details: error.message });
        }
    },

    // ============================================================
    // 3. ĐỔI MẬT KHẨU (CHỦ ĐỘNG) - Mã hóa & Thoát vòng lặp
    // ============================================================
    changePassword: async (req, res) => {
        const { userId, oldPassword, newPassword } = req.body;
        
        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Thiếu thông tin.' });
        }

        try {
            const user = await userModel.findById(userId);
            if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại.' });

            // Kiểm tra mật khẩu cũ (Hỗ trợ cả mã hóa và không mã hóa)
            let isMatch = false;
            if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
                isMatch = await bcrypt.compare(oldPassword, user.password_hash);
            } else {
                isMatch = (user.password_hash === oldPassword);
            }

            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu cũ không chính xác.' });
            }

            // 🟢 Mã hóa mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);

            // 🟢 Gọi Model (2 tham số) -> Model sẽ tự set must_change = 0
            await userModel.updatePassword(userId, hashedNewPassword); 
            
            res.status(200).json({ message: 'Đổi mật khẩu thành công.' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // ============================================================
    // 4. ADMIN RESET MẬT KHẨU (Force Logout & Fix Tràn Số)
    // ============================================================
    resetPassword: async (req, res) => {
        try {
            const userId = req.body.userId || req.body.user_id || req.body.targetUserId;
            const newPassword = req.body.newPassword || req.body.password;

            if (!userId || !newPassword) {
                return res.status(400).json({ message: 'Thiếu ID người dùng hoặc mật khẩu mới.' });
            }

            // 🟢 Mã hóa
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // 🟢 Truyền null để tránh lỗi tràn số
            const newTokenVersion = null; 

            const result = await userModel.adminResetPassword(userId, hashedPassword, newTokenVersion);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            }

            res.status(200).json({ message: 'Cấp lại mật khẩu thành công. User đã bị đăng xuất khỏi thiết bị cũ.' });

        } catch (error) {
            console.error("Reset Password Error:", error);
            res.status(500).json({ message: 'Lỗi server khi reset mật khẩu.' });
        }
    },

    // ============================================================
    // 5. ADMIN KHÓA / MỞ KHÓA TÀI KHOẢN (Force Logout & Fix Tràn Số)
    // ============================================================
    updateUserStatus: async (req, res) => {
        try {
            const userId = req.body.userId || req.body.user_id;
            const status = req.body.status; 

            if (!userId || !status) {
                return res.status(400).json({ message: 'Thiếu User ID hoặc trạng thái.' });
            }

            // 🟢 Truyền null để tránh lỗi tràn số
            const newTokenVersion = null;

            const result = await userModel.updateStatus(userId, status, newTokenVersion);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            }

            res.status(200).json({ 
                message: `Cập nhật trạng thái thành ${status} thành công.`,
                status: status
            });

        } catch (error) {
            console.error("Update Status Error:", error);
            res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái.' });
        }
    }
};

module.exports = authController;