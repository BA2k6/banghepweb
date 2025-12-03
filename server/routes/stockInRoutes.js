// /server/routes/stockInRoutes.js

const express = require('express');
const router = express.Router();
const stockInController = require('../controllers/stockInController');

router.get('/', stockInController.listStockInReceipts); 

module.exports = router;