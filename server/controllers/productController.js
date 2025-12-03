// /server/controllers/productController.js
const productModel = require('../models/productModel');

const productController = {
    listProducts: async (req, res) => {
        // TODO: Cần middleware kiểm tra Auth/Permission
        try {
            const { category_id } = req.query;
            const options = {};
            if (category_id) options.categoryId = category_id;
            const products = await productModel.getAllProducts(options);
            res.status(200).json(products);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm.' });
        }
    },

    getProduct: async (req, res) => {
        try {
            const id = req.params.id;
            if (!id) return res.status(400).json({ message: 'product id là bắt buộc.' });
            const product = await productModel.getProductById(id);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            return res.status(200).json(product);
        } catch (error) {
            console.error('Error getting product:', error);
            return res.status(500).json({ message: 'Lỗi khi lấy thông tin sản phẩm.' });
        }
    },

    createProduct: async (req, res) => {
        try {
            const { id, name, categoryId, price, costPrice, stockQuantity, isActive, sizes, colors, material } = req.body;
            if (!id || !name) {
                return res.status(400).json({ message: 'product id và name là bắt buộc.' });
            }
            await productModel.createProduct({ id, name, categoryId, price, costPrice, stockQuantity, isActive, sizes, colors, material });
            res.status(201).json({ message: 'Tạo sản phẩm thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi tạo sản phẩm.' });
        }
    }
    ,

    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, categoryId, price, costPrice, stockQuantity, isActive, sizes, colors, material } = req.body;
            if (!id || !name) return res.status(400).json({ message: 'product id và name là bắt buộc.' });
            const result = await productModel.updateProduct(id, { name, categoryId, price, costPrice, stockQuantity, isActive, sizes, colors, material });
            if (result && result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            res.status(200).json({ message: 'Cập nhật sản phẩm thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi cập nhật sản phẩm.' });
        }
    },

    deleteProduct: async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ message: 'product id là bắt buộc.' });
            const result = await productModel.deleteProduct(id);
            if (result && result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
            res.status(200).json({ message: 'Xóa sản phẩm thành công.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi khi xóa sản phẩm.' });
        }
    }
};

module.exports = productController;