// client/src/components/ProductFormModal.js
import React, { useState, useEffect } from 'react';
import { createProduct, updateProduct, getCategories, getProducts, getProduct } from '../services/api';

const ProductFormModal = ({ open, onClose, onSaved, initialData, viewOnly }) => {
  // Bỏ 'material' khỏi state ban đầu
  const [form, setForm] = useState({ 
    id: '', name: '', categoryId: '', price: '', costPrice: '', 
    stockQuantity: '', isActive: true, sizes: '', colors: '', brand: '', description: '' 
  });
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    getCategories().then(cats => setCategories(cats || [])).catch(()=>{});
  }, []);

  useEffect(() => {
    if (open) {
      if (initialData) {
        // --- CHẾ ĐỘ XEM / SỬA ---
        const fetchDetail = async () => {
            setFetchingDetails(true);
            try {
                // Set form tạm thời
                setForm({
                    id: initialData.id || '',
                    name: initialData.name || '',
                    categoryId: initialData.categoryId || '',
                    price: initialData.price || '',
                    costPrice: initialData.costPrice || '',
                    stockQuantity: initialData.stockQuantity || '',
                    isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                    sizes: initialData.sizes || '',
                    colors: initialData.colors || '',
                    brand: initialData.brand || '',
                    description: initialData.description || ''
                });

                // Gọi API lấy chi tiết (có variants)
                const fullData = await getProduct(initialData.id);
                if (fullData && fullData.variants) {
                    setVariants(fullData.variants);
                }
            } catch (err) {
                console.error("Lỗi lấy chi tiết:", err);
            } finally {
                setFetchingDetails(false);
            }
        };
        fetchDetail();
      } else {
        // --- CHẾ ĐỘ THÊM MỚI ---
        setForm({ id: '', name: '', categoryId: '', price: '', costPrice: '', stockQuantity: '', isActive: true, sizes: '', colors: '', brand: '', description: '' });
        setVariants([]);
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;

    setLoading(true);
    try {
      if (!initialData && (!form.categoryId || !form.price || !form.costPrice)) {
        alert('Vui lòng nhập đầy đủ: Danh mục, Giá bán, Giá vốn.');
        setLoading(false);
        return;
      }

      const payload = {
        // ID rỗng -> Server tự sinh
        id: form.id ? form.id.trim() : '', 
        name: form.name.trim(),
        categoryId: form.categoryId || null,
        price: Number(form.price) || 0,
        costPrice: Number(form.costPrice) || 0,
        stockQuantity: Number(form.stockQuantity) || 0,
        isActive: !!form.isActive,
        sizes: form.sizes || null,
        colors: form.colors || null,
        brand: form.brand || null,
        description: form.description || null
      };

      let res;
      if (initialData && initialData.id) {
        res = await updateProduct(initialData.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res && res.message) alert(res.message);

      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  let modalTitle = 'Thêm sản phẩm mới';
  if (initialData) modalTitle = viewOnly ? 'Chi tiết sản phẩm' : 'Chỉnh sửa sản phẩm';

  const hasVariants = form.sizes.trim().length > 0 || form.colors.trim().length > 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">Mã SP (Tự động)</label>
              {/* QUAN TRỌNG: Đã bỏ required */}
              <input 
                value={form.id} 
                readOnly={!!initialData || viewOnly} 
                onChange={e=>setForm({...form, id: e.target.value})} 
                placeholder="(Tự động)"
                className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:ring-blue-500 placeholder-gray-400 ${viewOnly || initialData ? 'cursor-not-allowed text-gray-500' : ''}`} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 uppercase">Tên sản phẩm <span className="text-red-500">*</span></label>
              <input required value={form.name} readOnly={viewOnly} onChange={e=>setForm({...form, name: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Danh mục <span className="text-red-500">*</span></label>
              <select value={form.categoryId} disabled={viewOnly} onChange={e=>setForm({...form, categoryId: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 bg-white ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`}>
                <option value="">-- Chọn --</option>
                {categories.map(c=> (<option key={c.category_id} value={c.category_id}>{c.category_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase">Thương hiệu</label>
              <input value={form.brand} readOnly={viewOnly} onChange={e=>setForm({...form, brand: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Giá bán <span className="text-red-500">*</span></label>
                <input type="number" value={form.price} readOnly={viewOnly} onChange={e=>setForm({...form, price: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Giá vốn <span className="text-red-500">*</span></label>
                <input type="number" value={form.costPrice} readOnly={viewOnly} onChange={e=>setForm({...form, costPrice: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 ${viewOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Kích cỡ (Size)</label>
                <input placeholder="VD: S, M, L" value={form.sizes} readOnly={viewOnly} onChange={e=>setForm({...form, sizes: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${viewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            <div>
                <label className="text-xs font-semibold text-gray-600 uppercase">Màu sắc (Color)</label>
                <input placeholder="VD: Đỏ, Xanh, Trắng" value={form.colors} readOnly={viewOnly} onChange={e=>setForm({...form, colors: e.target.value})} className={`mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm ${viewOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
            </div>
            
            {/* Nếu nhập mới mà không có Size/Màu thì hiện ô nhập Stock tổng */}
            {!initialData && !hasVariants && (
                <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase">Tồn kho ban đầu</label>
                    <input type="number" min="0" value={form.stockQuantity} onChange={e=>setForm({...form, stockQuantity: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </div>
            )}
            
            {/* Cảnh báo nếu nhập size/màu */}
            {!initialData && hasVariants && (
                <p className="text-xs text-yellow-700 italic bg-yellow-50 p-2 rounded">
                    * Bạn đang tạo sản phẩm có biến thể. Hệ thống sẽ tạo tự động các biến thể với Tồn kho = 0. Vui lòng nhập kho chi tiết sau.
                </p>
            )}
          </div>

          {/* TABLE CHI TIẾT TỒN KHO */}
          {initialData && (
              <div className="mt-4 border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Chi tiết tồn kho</h3>
                  {fetchingDetails ? (
                      <p className="text-xs text-blue-500">Đang tải chi tiết tồn kho...</p>
                  ) : variants.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg max-h-40 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Màu</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tồn kho</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {variants.map((v) => (
                                    <tr key={v.variant_id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{v.color}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900">{v.size}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-bold text-blue-600">{v.stock_quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                  ) : (
                      <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div>
                              <p className="text-sm font-medium text-gray-700">Sản phẩm đơn giản</p>
                              <p className="text-xs text-gray-500">Không có biến thể Size/Màu</p>
                          </div>
                          <div className="ml-auto text-right">
                              <span className="block text-xs text-gray-500 uppercase">Tồn kho</span>
                              <span className="text-lg font-bold text-blue-600">{form.stockQuantity}</span>
                          </div>
                      </div>
                  )}
              </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={form.isActive} disabled={viewOnly} onChange={e=>setForm({...form, isActive: e.target.checked})} className="form-checkbox h-5 w-5 text-blue-600"/>
              <span className="ml-2 text-sm text-gray-700">Đang kinh doanh</span>
            </label>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Đóng</button>
                {!viewOnly && (
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50">
                        {loading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;