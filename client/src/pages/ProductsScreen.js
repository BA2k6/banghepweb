// client/src/pages/ProductsScreen.js

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ChevronDown, Eye } from 'lucide-react'; 
import { getProducts, getCategories, deleteProduct } from '../services/api'; 
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';
import ProductFormModal from '../components/ProductFormModal';

export const ProductsScreen = ({ userRoleName }) => {
    // products giờ chứa { id, name, ..., variants: [...] }
    const [products, setProducts] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentProductData, setCurrentProductData] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false); 

    const canEdit = [ROLES.OWNER.name, ROLES.WAREHOUSE.name].includes(userRoleName);
    const canDelete = userRoleName === ROLES.OWNER.name;
    // const showActions = true; // Không cần thiết

    // Load Categories
    useEffect(() => {
        getCategories().then(cats => setCategories(cats || [])).catch(console.error);
    }, []);

    // Load Products (ĐÃ SỬA: Thêm searchTerm vào params)
    const loadProducts = async (category, search) => {
        setIsLoading(true);
        try {
            // Giả định getProducts(categoryId, searchTerm) đã được sửa trong api.js
            const prods = await getProducts(category, search); 
            
            // Backend mới trả về cấu trúc lồng nhau (product { variants: [...] })
            setProducts(prods || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Lỗi tải dữ liệu sản phẩm.');
        } finally {
            setIsLoading(false);
            setIsLoadingInitial(false);
        }
    };

    // 💡 SỬA: Gọi API khi category HOẶC searchTerm thay đổi (dùng debounce)
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            const catParam = selectedCategory === 'all' ? null : selectedCategory;
            loadProducts(catParam, searchTerm);
        }, 300); // Debounce 300ms
        
        return () => clearTimeout(delaySearch);
    }, [selectedCategory, searchTerm]);

    // Auto refresh (Giữ nguyên)
    useEffect(() => {
        const handler = () => loadProducts(selectedCategory, searchTerm);
        window.addEventListener('products:updated', handler);
        return () => window.removeEventListener('products:updated', handler);
    }, [selectedCategory, searchTerm]); // Phụ thuộc vào selectedCategory/searchTerm để tải lại đúng dữ liệu

    // --- HANDLERS ---
    const handleAddNew = () => {
        setCurrentProductData(null); 
        setIsViewMode(false); 
        setShowAddModal(true);
    };

    const handleViewClick = (p) => {
        // Cần map data phức tạp hơn cho Modal
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(true); 
        setShowAddModal(true);
    };

    const handleEditClick = (p) => {
        // Cần map data phức tạp hơn cho Modal
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(false); 
        setShowAddModal(true);
    };

    // 💡 SỬA: Hàm map data để tương thích với cấu trúc Product mới
    const mapProductToForm = (p) => ({
        id: p.product_id,
        name: p.name || '',
        categoryId: p.category_id || '', // Đã sửa tên cột
        price: p.base_price || 0, // Giá cơ bản
        costPrice: p.cost_price || 0, // Giá vốn
        brand: p.brand || '',
        description: p.description || '',
        material: p.material || '',
        
        // Cần truyền Variants để Modal hiển thị/sửa Variants
        variants: p.variants || [], 
        
        // Các trường tổng hợp (có thể bị loại bỏ trong API mới)
        // Nếu Backend không cung cấp, ta không thể map:
        // stockQuantity: p.stockQuantity || 0, 
        // sizes: p.sizes || '',
        // colors: p.colors || '',
        // Nếu Backend API cũ vẫn giữ 3 trường trên, thì giữ nguyên
        stockQuantity: p.total_stock_quantity || 0, 
        sizes: p.all_sizes || '', 
        colors: p.all_colors || '', 
    });

    const handleDelete = async (id) => {
        if (!window.confirm('CẢNH BÁO: Xóa sản phẩm sẽ xóa toàn bộ tồn kho và hình ảnh liên quan!')) return;
        try {
            await deleteProduct(id);
            // Thay vì gọi loadProducts(), kích hoạt event
            window.dispatchEvent(new Event('products:updated'));
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa');
        }
    };

    // 💡 SỬA: TẠO DANH SÁCH PHẲNG (FLATTEN) ĐỂ ĐỔ VÀO BẢNG
    // Mỗi biến thể là một dòng riêng biệt trong bảng quản lý
    const flattenedList = useMemo(() => {
        const flat = [];
        products.forEach(p => {
            // Lấy category name
            const categoryName = categories.find(c => c.category_id === p.category_id)?.category_name || '-';
            
            if (p.variants && p.variants.length > 0) {
                p.variants.forEach(v => {
                    const finalPrice = parseFloat(p.base_price) + parseFloat(v.additional_price || 0);
                    
                    flat.push({
                        // Thông tin sản phẩm cha
                        productId: p.product_id,
                        productName: p.name,
                        brand: p.brand,
                        categoryName: categoryName,
                        basePrice: p.base_price,
                        costPrice: p.cost_price,
                        isActive: p.is_active,
                        
                        // Thông tin biến thể
                        variantId: v.variant_id,
                        color: v.color,
                        size: v.size,
                        stockQuantity: v.stock_quantity,
                        variantPrice: finalPrice, // Giá bán của biến thể
                    });
                });
            } else {
                // Nếu sản phẩm không có biến thể nào được tạo (Dạng sản phẩm cha chưa hoàn chỉnh)
                flat.push({
                    productId: p.product_id,
                    productName: p.name,
                    brand: p.brand,
                    categoryName: categoryName,
                    basePrice: p.base_price,
                    costPrice: p.cost_price,
                    isActive: p.is_active,
                    variantId: null,
                    color: 'N/A', size: 'N/A', 
                    stockQuantity: 0,
                    variantPrice: p.base_price,
                });
            }
        });
        
        // 💡 Giữ nguyên logic tìm kiếm trên danh sách phẳng (chỉ tìm kiếm trên text)
        const lowerSearch = normalizeSearchableValue(searchTerm);
        return flat.filter(item => {
            if (!lowerSearch) return true;
            const content = `${item.productId} ${item.productName} ${item.brand} ${item.color} ${item.size} ${item.variantId}`.toLowerCase();
            return normalizeSearchableValue(content).includes(lowerSearch);
        });
        
    }, [products, searchTerm, categories]);


    if (isLoadingInitial) return <div className="p-8 text-center text-blue-600 animate-pulse">Đang tải dữ liệu...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6 p-4 md:p-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                    <p className="text-gray-500 text-sm mt-1">Tổng cộng: <span className="font-semibold">{products.length}</span> mã hàng cha</p>
                </div>
                {canEdit && (
                    <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all font-medium">
                        <Plus className="w-5 h-5" /> Thêm sản phẩm
                    </button>
                )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Thanh tìm kiếm đã được sửa để hoạt động trên danh sách phẳng */}
                    <div className="relative flex-grow group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm (Mã/Tên/Biến thể)..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                        />
                    </div>
                    {/* Filter Category */}
                    <div className="w-full sm:w-64 relative">
                        <select 
                            value={selectedCategory} 
                            onChange={e => setSelectedCategory(e.target.value)} 
                            className="w-full appearance-none bg-gray-50 border border-gray-200 py-2.5 pl-4 pr-10 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer"
                        >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map(c => (<option key={c.category_id} value={c.category_id}>{c.category_name}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm (Mã SP)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Biến thể (Mã VT)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá bán / Vốn</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tồn kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Dùng danh sách đã làm phẳng (flattenedList) */}
                            {flattenedList.map((item) => (
                                <tr 
                                    key={item.variantId || item.productId} 
                                    className={`hover:bg-blue-50/50 transition-colors group ${!item.variantId ? 'bg-yellow-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-sm group-hover:text-blue-700">{item.productName}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-xs border border-gray-200">{item.productId}</span>
                                                {item.brand && <span className="text-xs text-gray-500">• {item.brand}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.variantId ? (
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-900">{item.color} / {item.size}</div>
                                                <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-mono text-xs border border-purple-100 mt-1">{item.variantId}</span>
                                            </div>
                                        ) : (
                                            <span className="text-red-500 text-xs font-semibold">Chưa có biến thể</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{formatCurrency(item.variantPrice)}</div>
                                        {canEdit && <div className="text-xs text-gray-500 mt-0.5">Vốn: {formatCurrency(item.costPrice)}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {item.stockQuantity > 0 ? `${item.stockQuantity} sp` : 'Hết hàng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.isActive 
                                            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Đang bán</span>
                                            : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Ngừng bán</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {/* NÚT XEM */}
                                            {/* LƯU Ý: handleViewClick/handleEditClick hiện tại cần Product ID để hoạt động đúng trong modal */}
                                            <button onClick={() => handleViewClick(products.find(p => p.product_id === item.productId))} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title="Xem chi tiết">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* NÚT SỬA */}
                                            {canEdit && item.variantId && <button onClick={() => handleEditClick(products.find(p => p.product_id === item.productId))} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Sửa"><Edit className="w-4 h-4" /></button>}
                                            {/* NÚT XÓA (Chỉ xóa Product ID) */}
                                            {canDelete && <button onClick={() => handleDelete(item.productId)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Xóa Sản phẩm cha"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {flattenedList.length === 0 && <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-500">Không tìm thấy sản phẩm nào</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductFormModal 
                open={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSaved={() => window.dispatchEvent(new Event('products:updated'))} 
                initialData={currentProductData} 
                viewOnly={isViewMode} 
            />
        </div>
    );
};