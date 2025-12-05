// server/controllers/productController.js
const productModel = require('../models/productModel');
const db = require('../config/db.config');

const productController = {
    // 1. GET List (Danh sách sản phẩm cha)
// Hàm cần sửa: Trả về danh sách sản phẩm kèm các biến thể
    listProducts: async (req, res) => {
        const { category_id, search_term } = req.query; 
        
        let filterConditions = "p.is_active = TRUE";
        const queryParams = [];

        if (category_id && category_id !== 'all') {
            filterConditions += " AND p.category_id = ?";
            queryParams.push(category_id);
        }

        if (search_term) {
            filterConditions += " AND (p.name LIKE ? OR p.product_id LIKE ?)";
            queryParams.push(`%${search_term}%`, `%${search_term}%`);
        }

        const query = `
            SELECT 
                p.product_id, p.name, p.category_id, p.base_price, p.cost_price, 
                pv.variant_id, pv.color, pv.size, pv.stock_quantity, pv.additional_price
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE ${filterConditions}
            ORDER BY p.product_id, pv.variant_id;
        `;
        
        try {
            const [rows] = await db.query(query, queryParams);
            
            // 💡 CHUYỂN DỮ LIỆU PHẲNG THÀNH CẤU TRÚC PHÂN CẤP (Nested Structure)
            const productsMap = {};
            rows.forEach(row => {
                const { product_id, name, base_price, cost_price, ...variant } = row;
                
                if (!productsMap[product_id]) {
                    productsMap[product_id] = {
                        product_id, name, base_price, cost_price, 
                        variants: []
                    };
                }
                
                // Chỉ thêm biến thể nếu nó tồn tại (variant_id không NULL)
                if (variant.variant_id) {
                    productsMap[product_id].variants.push({
                        variant_id: variant.variant_id,
                        color: variant.color,
                        size: variant.size,
                        stock_quantity: variant.stock_quantity,
                        additional_price: variant.additional_price,
                        // Thêm trường 'price' đã tính toán đơn giản (base + add)
                        price: parseFloat(base_price) + parseFloat(variant.additional_price || 0)
                    });
                }
            });

            // Chuyển object Map thành mảng
            const finalProducts = Object.values(productsMap);
            res.status(200).json(finalProducts);

        } catch (error) {
            console.error("Error listing products with variants:", error);
            res.status(500).json({ message: "Lỗi Backend khi tải sản phẩm.", details: error.message });
        }
    },

    // 2. GET Detail (Chi tiết 1 sản phẩm)
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

    // ---------------------------------------------------------
    // 3. GET VARIANTS (QUAN TRỌNG: ĐÂY LÀ HÀM BẠN ĐANG THIẾU)
    // ---------------------------------------------------------
    listVariants: async (req, res) => {
        try {
            // Hàm này phục vụ cho dropdown chọn hàng ở màn hình Nhập Kho
            const variants = await productModel.getAllVariants();
            res.status(200).json(variants);
        } catch (error) {
            console.error("List Variants Error:", error);
            res.status(500).json({ message: 'Lỗi server khi lấy danh sách biến thể.' });
        }
    },

    // 4. CREATE (Đã fix logic sinh mã & bỏ material)
    createProduct: async (req, res) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            // Lấy dữ liệu (Đã xóa 'material' theo schema mới)
            let { id, name, categoryId, price, costPrice, isActive, sizes, colors, brand, description, stockQuantity } = req.body;
            const initialStock = Number(stockQuantity) || 0;

            // [LOGIC SINH MÃ TỰ ĐỘNG]
            if (!id || id.trim() === '') {
                id = await productModel.generateNextId(); // Đảm bảo Model có hàm này
                console.log(">> Auto-generated ID:", id);
            }

            if (!name) throw new Error('Tên sản phẩm là bắt buộc.');

            // A. Tạo Header (Bảng products)
            await productModel.createProductHeader({
                id, name, categoryId, price, costPrice, isActive, brand, description
            }, conn);

            // B. Tạo Variants (Bảng product_variants)
            const hasOptions = (sizes && sizes.trim()) || (colors && colors.trim());

            if (hasOptions) {
                // Tạo nhiều biến thể (Stock = 0, chờ nhập kho)
                await productModel.createVariantsBulk(id, sizes, colors, conn);
            } else {
                // Tạo 1 biến thể mặc định (Stock = input ban đầu nếu có)
                await productModel.createSingleVariant({
                    productId: id,
                    stock: initialStock
                }, conn);
            }

            await conn.commit();

            // Trả về ID mới để Frontend biết
            if (hasOptions && initialStock > 0) {
                res.status(201).json({ 
                    message: `Đã tạo sản phẩm [${id}]. Lưu ý: Tồn kho biến thể đang là 0, vui lòng vào "Nhập kho" để nhập chi tiết từng size/màu.`,
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

    // 5. UPDATE
    updateProduct: async (req, res) => {
        try {
            const { id } = req.params;
            // Chỉ update thông tin chung, không update biến thể ở đây (thường làm API riêng)
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

    // 6. DELETE
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