// client/src/pages/ProductsScreen.js

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ChevronDown, Eye } from 'lucide-react'; // ĐÃ THÊM EYE
import { getProducts, getCategories, deleteProduct } from '../services/api'; 
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';
import ProductFormModal from '../components/ProductFormModal';

export const ProductsScreen = ({ userRoleName }) => {
    const [products, setProducts] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentProductData, setCurrentProductData] = useState(null);
    const [isViewMode, setIsViewMode] = useState(false); // State mới: check xem hay sửa

    const canEdit = [ROLES.OWNER.name, ROLES.WAREHOUSE.name].includes(userRoleName);
    const canDelete = userRoleName === ROLES.OWNER.name;
    const showActions = true;

    // Load Categories
    useEffect(() => {
        getCategories().then(cats => setCategories(cats || [])).catch(console.error);
    }, []);

    // Load Products
    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const catParam = selectedCategory === 'all' ? null : selectedCategory;
            const prods = await getProducts(catParam);
            setProducts(prods || []);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Lỗi tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, [selectedCategory]);
    
    // Auto refresh
    useEffect(() => {
        const handler = () => loadProducts();
        window.addEventListener('products:updated', handler);
        return () => window.removeEventListener('products:updated', handler);
    }, [selectedCategory]);

    // --- HANDLERS ---
    const handleAddNew = () => {
        setCurrentProductData(null); 
        setIsViewMode(false); // Mode thêm mới
        setShowAddModal(true);
    };

    const handleViewClick = (p) => {
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(true); // Mode xem
        setShowAddModal(true);
    };

    const handleEditClick = (p) => {
        setCurrentProductData(mapProductToForm(p));
        setIsViewMode(false); // Mode sửa
        setShowAddModal(true);
    };

    // Helper map data
    const mapProductToForm = (p) => ({
        id: p.id,
        name: p.name || '',
        categoryId: p.categoryId || '',
        price: p.price || 0,
        costPrice: p.costPrice || 0,
        stockQuantity: p.stockQuantity || 0, 
        isActive: p.isActive !== undefined ? !!p.isActive : true,
        sizes: p.sizes || '',
        colors: p.colors || '',
        brand: p.brand || '',
        description: p.description || '',
        material: p.material || ''
    });

    const handleDelete = async (id) => {
        if (!window.confirm('CẢNH BÁO: Xóa sản phẩm sẽ xóa toàn bộ tồn kho và hình ảnh liên quan!')) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa');
        }
    };

    const filteredProducts = useMemo(() => {
        const lowerSearch = normalizeSearchableValue(searchTerm);
        return products.filter(p => {
            if (!lowerSearch) return true;
            const content = `${p.id} ${p.name} ${p.brand} ${p.sizes} ${p.colors}`.toLowerCase();
            return normalizeSearchableValue(content).includes(lowerSearch);
        });
    }, [products, searchTerm]);

    if (isLoading && products.length === 0) return <div className="p-8 text-center text-blue-600 animate-pulse">Đang tải dữ liệu...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

    return (
        <div className="space-y-6 p-4 md:p-6 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                    <p className="text-gray-500 text-sm mt-1">Tổng cộng: <span className="font-semibold">{products.length}</span> mã hàng</p>
                </div>
                {canEdit && (
                    <button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all font-medium">
                        <Plus className="w-5 h-5" /> Thêm sản phẩm
                    </button>
                )}
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-grow group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                        <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="w-full sm:w-64 relative">
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 py-2.5 pl-4 pr-10 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer">
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Phân loại</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá bán / Vốn</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tồn kho</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-sm group-hover:text-blue-700">{p.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-mono text-xs border border-gray-200">{p.id}</span>
                                                {p.brand && <span className="text-xs text-gray-500">• {p.brand}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 mb-1.5">{p.categoryName || '-'}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {p.sizes && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">Size: {p.sizes}</span>}
                                            {p.colors && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-100">Màu: {p.colors}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{formatCurrency(p.price)}</div>
                                        {canEdit && <div className="text-xs text-gray-500 mt-0.5">Vốn: {formatCurrency(p.costPrice)}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${p.stockQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.stockQuantity > 0 ? `${p.stockQuantity} sp` : 'Hết hàng'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {p.isActive 
                                            ? <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Đang bán</span>
                                            : <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">Ngừng bán</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {/* NÚT XEM */}
                                            <button onClick={() => handleViewClick(p)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title="Xem chi tiết">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {/* NÚT SỬA */}
                                            {canEdit && <button onClick={() => handleEditClick(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Sửa"><Edit className="w-4 h-4" /></button>}
                                            {/* NÚT XÓA */}
                                            {canDelete && <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Xóa"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-500">Không tìm thấy sản phẩm nào</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <ProductFormModal 
                open={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSaved={loadProducts} 
                initialData={currentProductData} 
                viewOnly={isViewMode} // Truyền prop View Only
            />
        </div>
    );
};