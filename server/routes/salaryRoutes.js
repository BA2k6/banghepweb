// /server/routes/salaryRoutes.js
const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/', salaryController.listSalaries); // Endpoint GET /api/salaries

module.exports = router;