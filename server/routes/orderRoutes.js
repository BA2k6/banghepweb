// /server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.listOrders); // Endpoint GET /api/orders

module.exports = router;