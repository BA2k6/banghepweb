// /server/models/customerModel.js
const db = require('../config/db.config');
const customerModel = {
    getAllCustomers: async () => {
        const query = `
            SELECT 
                customer_id as id, full_name as fullName, phone, email, address, dob_year as dob
            FROM customers 
            ORDER BY customer_id
        `;
        const [rows] = await db.query(query);
        return rows;
    }
};
module.exports = customerModel;