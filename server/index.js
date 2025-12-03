// /server/index.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');

require('./config/db.config'); 

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const userRoutes = require('./routes/userRoutes'); // File chứa các chức năng Admin
const stockInRoutes = require('./routes/stockInRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

// ============================================================
// ĐỊNH NGHĨA ROUTES (API)
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);

// [QUAN TRỌNG - ĐÃ SỬA]: 
// Sửa '/api/users' thành '/api' 
// Vì bên trong userRoutes.js ta đã viết sẵn '/admin/users' và '/users/create'
// Kết quả ghép lại sẽ là: /api/admin/users/... (Đúng chuẩn Frontend)
app.use('/api', userRoutes); 

app.use('/api/stockin', stockInRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/employees', employeeRoutes);

app.get('/', (req, res) => res.send(`Store Management API is running on port ${PORT}`));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));