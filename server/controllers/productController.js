// server/controllers/productController.js
const productModel = require('../models/productModel');
const db = require('../config/db.config');

const productController = {
    // 1. GET List
    listProducts: async (req, res) => {
        try {
            const { category_id } = req.query;
            const options = {};
            if (category_id && category_id !== 'all' && category_id !== 'null') {
                options.categoryId = category_id;
            }
            const products = await productModel.getAllProducts(options);
            res.status(200).json(products);
        } catch (error) {
            console.error('List Products Error:', error);
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 2. GET Detail
    getProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const product = await productModel.getProductById(id);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server.' });
        }
    },

    // 3. CREATE (Đã fix logic sinh mã & bỏ material)
    createProduct: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Lấy dữ liệu (Đã xóa 'material')
            let { id, name, categoryId, price, costPrice, isActive, sizes, colors, brand, description, stockQuantity } = req.body;
            const initialStock = Number(stockQuantity) || 0;

            // [LOGIC SINH MÃ TỰ ĐỘNG]
            if (!id || id.trim() === '') {
                id = await productModel.generateNextId();
                console.log(">> Auto-generated ID:", id);
            }

            if (!name) throw new Error('Tên sản phẩm là bắt buộc.');

            // 1. Tạo Header
            await productModel.createProductHeader({
                id, name, categoryId, price, costPrice, isActive, brand, description
            }, conn);

            // 2. Tạo Variants
            const hasOptions = (sizes && sizes.trim()) || (colors && colors.trim());

            if (hasOptions) {
                // Tạo nhiều biến thể (Stock = 0)
                await productModel.createVariantsBulk(id, sizes, colors, conn);
            } else {
                // Tạo 1 biến thể mặc định (Stock = input)
                await productModel.createSingleVariant({
                    productId: id,
                    stock: initialStock
                }, conn);
            }

            await conn.commit();

            // Trả về ID mới để Frontend biết
            if (hasOptions && initialStock > 0) {
                res.status(201).json({ 
                    message: `Đã tạo sản phẩm [${id}]. Lưu ý: Tồn kho biến thể đang là 0, vui lòng nhập kho chi tiết.`,
                    productId: id
                });
            } else {
                res.status(201).json({ 
                    message: `Tạo sản phẩm [${id}] thành công.`,
                    productId: id 
                });
            }

        } catch (error) {
            await conn.rollback();
            console.error('Create Error:', error);
            if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Mã sản phẩm đã tồn tại.' });
            res.status(500).json({ message: error.message });
        } finally {
            conn.release();
        }
    },

    // 4. UPDATE
    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, categoryId, price, costPrice, isActive, brand, description } = req.body;
            
            const result = await productModel.updateProductHeader(id, {
                name, categoryId, price, costPrice, isActive, brand, description
            });
            
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            res.status(200).json({ message: 'Cập nhật thành công.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. DELETE
    deleteProduct: async (req, res) => {
        try {
            await productModel.deleteProduct(req.params.id);
            res.status(200).json({ message: 'Đã xóa sản phẩm.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = productController;