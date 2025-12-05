// /server/routes/stockInRoutes.js

const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');

// 1. Lấy danh sách phiếu nhập tổng quan (Master)
// Endpoint: GET /api/stockin/
router.get('/', stockInController.listStockInReceipts); 

// 2. Lấy danh sách chi tiết từng sản phẩm đã nhập (Details)
// Endpoint: GET /api/stockin/items
router.get('/items', stockInController.listStockInItems);

// 3. Tạo mới phiếu nhập hoặc thêm sản phẩm vào phiếu cũ
// Endpoint: POST /api/stockin/items
router.post('/items', stockInController.createStockInItem);

// 4. Xóa một dòng chi tiết nhập kho
// Endpoint: DELETE /api/stockin/items/:id
// Lưu ý: :id ở đây là chuỗi kết hợp (Composite Key), ví dụ: "SI241101_VAR001"
router.delete('/items/:id', stockInController.deleteStockInItem);

module.exports = router;