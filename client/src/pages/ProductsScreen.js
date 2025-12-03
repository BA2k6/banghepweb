// C:\Users\Admin\Downloads\DUANWEB(1)\client\src\pages\ProductsScreen.js

import React, { useState, useMemo, useEffect } from 'react';
import { Package, Search, Plus, Edit, Trash2, ChevronDown } from 'lucide-react';
// Import API thật để lấy dữ liệu từ Server
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../services/api'; 
// Import các hằng số và hàm tiện ích
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';

export const ProductsScreen = ({ userRoleName }) => {
    const [products, setProducts] = useState([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form fields for Add Product
    const [newProduct, setNewProduct] = useState({ id: '', name: '', categoryId: '', price: '', costPrice: '', stockQuantity: '', isActive: true, sizes: '', colors: '', material: '' });
    
    // Khả năng chỉnh sửa/xóa (Permissions)
    const canEdit = [ROLES.OWNER.name, ROLES.WAREHOUSE.name].includes(userRoleName);
    const canDelete = userRoleName === ROLES.OWNER.name;
    
    // --- LẤY DỮ LIỆU TỪ API ---
    // Fetch categories and products
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const cats = await getCategories();
                setCategories(cats || []);

                const catId = selectedCategory === 'all' ? null : selectedCategory;
                const data = await getProducts(catId);
                setProducts(data);
            } catch (err) {
                setError(err.message || 'Không thể tải dữ liệu sản phẩm từ máy chủ.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [selectedCategory]); // reload when selectedCategory changes

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Save product (create or update)
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                id: newProduct.id.trim(),
                name: newProduct.name.trim(),
                categoryId: newProduct.categoryId || null,
                price: Number(newProduct.price) || 0,
                costPrice: Number(newProduct.costPrice) || 0,
                stockQuantity: Number(newProduct.stockQuantity) || 0,
                isActive: !!newProduct.isActive,
                sizes: newProduct.sizes || null,
                colors: newProduct.colors || null,
                material: newProduct.material || null,
            };

            if (isEditing && editingId) {
                await updateProduct(editingId, payload);
            } else {
                await createProduct(payload);
            }

            // refresh list
            const catId = selectedCategory === 'all' ? null : selectedCategory;
            const data = await getProducts(catId);
            setProducts(data);
            setShowAddModal(false);
            setNewProduct({ id: '', name: '', categoryId: '', price: '', costPrice: '', stockQuantity: '', isActive: true });
            setIsEditing(false);
            setEditingId(null);
        } catch (err) {
            alert(err.message || 'Lỗi khi lưu sản phẩm');
        }
    };

    const handleEditClick = (p) => {
        setIsEditing(true);
        setEditingId(p.id);
        setNewProduct({
            id: p.id,
            name: p.name || '',
            categoryId: p.categoryId || '',
            price: p.price || '',
            costPrice: p.costPrice || '',
            stockQuantity: p.stockQuantity || '',
            isActive: !!p.isActive,
            sizes: p.sizes || '',
            colors: p.colors || '',
            material: p.material || '',
        });
        setShowAddModal(true);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm('Bạn có chắc muốn xóa sản phẩm này không?');
        if (!ok) return;
        try {
            await deleteProduct(id);
            const catId = selectedCategory === 'all' ? null : selectedCategory;
            const data = await getProducts(catId);
            setProducts(data);
        } catch (err) {
            alert(err.message || 'Lỗi khi xóa sản phẩm');
        }
    };

    // --- LOGIC TÌM KIẾM TOÀN DIỆN TRÊN CLIENT ---
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerCaseSearch = normalizeSearchableValue(searchTerm);

        return products.filter(p => {
            // Kiểm tra tất cả các trường
            return Object.values(p).some(value => {
                return normalizeSearchableValue(value).includes(lowerCaseSearch);
            });
        });
    }, [products, searchTerm]);

    // --- RENDER HỌC (Loading, Error) ---
    if (isLoading) {
        return <p className="p-6 text-center text-xl text-blue-600 font-semibold">Đang tải dữ liệu sản phẩm từ Server...</p>;
    }
    
    if (error) {
        return <p className="p-6 text-center text-xl text-red-600 font-semibold">Lỗi: {error}</p>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm (Products)</h1>
            <p className="text-gray-500">Quyền: Owner, Warehouse (chỉnh sửa); Sales, Online Sales, Shipper (chỉ xem)</p>

            <div className="flex justify-end items-center mb-2">
                <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm flex items-center gap-3">
                    <span className="whitespace-nowrap">Tổng sản phẩm</span>
                    <span className="bg-white text-blue-700 font-bold px-2 py-0.5 rounded-full text-sm">{products.length}</span>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    {/* Ô TÌM KIẾM */}
                    <div className="relative flex-grow w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã, tên, giá, tồn kho..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>
                    {/* Styled select filter (reverted per user request) */}
                    <div className="w-full sm:w-48">
                        <label className="sr-only">Danh mục</label>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="block w-full appearance-none bg-white border-2 border-blue-100 text-blue-800 py-2 pl-3 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors">
                                <option value="all">Tất cả danh mục</option>
                                {categories.map(c => (
                                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-blue-700">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto flex justify-end">
                        {canEdit && (
                            <button onClick={() => { setIsEditing(false); setEditingId(null); setNewProduct({ id: '', name: '', categoryId: '', price: '', costPrice: '', stockQuantity: '', isActive: true }); setShowAddModal(true); }} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto">
                                <Plus className="w-5 h-5 mr-1" /> Thêm sản phẩm
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá vốn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{p.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.categoryName || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{formatCurrency(p.price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(p.costPrice)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.stockQuantity > 100 ? 'bg-green-100 text-green-800' : p.stockQuantity > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                            {p.stockQuantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {p.isActive ? 'Đang bán' : 'Ngừng bán'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {canEdit && (
                                                <button title="Sửa" onClick={() => handleEditClick(p)} className="text-indigo-600 hover:text-indigo-900 mr-3 p-1 rounded-full hover:bg-indigo-100 transition"><Edit className="w-5 h-5" /></button>
                                            )}
                                            {canDelete && (
                                                <button title="Xóa" onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition"><Trash2 className="w-5 h-5" /></button>
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredProducts.length === 0 && <p className="text-center py-8 text-gray-500">Không tìm thấy sản phẩm nào.</p>}
                </div>
            </div>
            {/* Add Product Modal (basic) */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div className="bg-white rounded-lg w-full max-w-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Thêm sản phẩm mới</h2>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Mã sản phẩm <span className="text-red-500">*</span></label>
                                    <input required placeholder="VD: P0201" value={newProduct.id} onChange={(e)=>setNewProduct({...newProduct,id:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                    <p className="text-xs text-gray-400 mt-1">Mã phải là duy nhất, không chứa ký tự đặc biệt.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Tên sản phẩm <span className="text-red-500">*</span></label>
                                    <input required placeholder="Tên sản phẩm" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <label className="text-sm font-medium text-gray-700">Danh mục</label>
                                    <select value={newProduct.categoryId} onChange={(e)=>setNewProduct({...newProduct,categoryId:e.target.value})} className="mt-1 block w-full appearance-none rounded-lg border-2 border-blue-100 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white text-gray-800">
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c=> (<option key={c.category_id} value={c.category_id}>{c.category_name}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-blue-700">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Giá bán (VND)</label>
                                    <div className="mt-1 relative">
                                        <input type="number" min="0" placeholder="0" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct,price:e.target.value})} className="block w-full rounded-lg border-2 border-blue-100 px-3 py-2 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₫</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Giá vốn (VND)</label>
                                    <div className="mt-1 relative">
                                        <input type="number" min="0" placeholder="0" value={newProduct.costPrice} onChange={(e)=>setNewProduct({...newProduct,costPrice:e.target.value})} className="block w-full rounded-lg border-2 border-blue-100 px-3 py-2 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">₫</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Tồn kho</label>
                                    <input type="number" min="0" placeholder="0" value={newProduct.stockQuantity} onChange={(e)=>setNewProduct({...newProduct,stockQuantity:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Kích cỡ (CSV)</label>
                                    <input placeholder="VD: S,M,L,XL" value={newProduct.sizes} onChange={(e)=>setNewProduct({...newProduct,sizes:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                    <p className="text-xs text-gray-400 mt-1">Nhập danh sách kích cỡ, phân cách bằng dấu phẩy.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Màu sắc (CSV)</label>
                                    <input placeholder="VD: Đỏ,Đen,Trắng" value={newProduct.colors} onChange={(e)=>setNewProduct({...newProduct,colors:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                    <p className="text-xs text-gray-400 mt-1">Nhập danh sách màu sắc, phân cách bằng dấu phẩy.</p>
                                </div>
                            </div>

                            <div className="mt-2">
                                <label className="text-sm font-medium text-gray-700">Chất liệu</label>
                                <input placeholder="VD: Cotton" value={newProduct.material} onChange={(e)=>setNewProduct({...newProduct,material:e.target.value})} className="mt-1 block w-full rounded-lg border-2 border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="inline-flex items-center">
                                    <input type="checkbox" checked={newProduct.isActive} onChange={(e)=>setNewProduct({...newProduct,isActive:e.target.checked})} className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
                                    <span className="text-sm text-gray-700">Đang bán</span>
                                </label>
                                <p className="text-xs text-gray-400">Bỏ chọn để ẩn sản phẩm khỏi cửa hàng.</p>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={()=>setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow">Tạo sản phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};