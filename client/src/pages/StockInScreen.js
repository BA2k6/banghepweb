import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Trash2, Package, DollarSign, FileText, TrendingUp, Layers, RefreshCw } from "lucide-react";
import api from "../services/api";
import ProductFormModal from '../components/ProductFormModal';

const StockInScreen = () => {
  const [stockIns, setStockIns] = useState([]);
  const [variants, setVariants] = useState([]); // Danh sách biến thể để chọn
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    stockInId: "", // Tùy chọn nhập vào mã phiếu cũ
    variantId: "",
    quantity: "",
    priceImport: "",
    note: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Tải lịch sử nhập kho
      try {
        const stockRes = await api.get("/stockin/items");
        setStockIns(stockRes.data || []);
      } catch (err) {
        console.error("Lỗi tải lịch sử nhập kho:", err);
        setError("Không thể tải lịch sử nhập kho.");
      }

      // 2. Tải danh sách biến thể (Variants)
      // Tách riêng try/catch để nếu lỗi API này thì vẫn xem được lịch sử
      try {
        const variantRes = await api.get("/products/variants"); 
        setVariants(variantRes.data || []); 
      } catch (err) {
        console.warn("API /products/variants chưa sẵn sàng hoặc lỗi 404:", err);
        // Không set Error chặn màn hình, chỉ log warning
      }
      
    } catch (err) {
      setError("Lỗi hệ thống không xác định.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return stockIns;
    const query = search.toLowerCase();
    return stockIns.filter((item) => {
      const name = item.productName || "";
      const id = item.variantId || "";
      const ticket = item.stockInId || "";
      return name.toLowerCase().includes(query) || id.toLowerCase().includes(query) || ticket.toLowerCase().includes(query);
    });
  }, [stockIns, search]);

  const stats = useMemo(() => {
    const totalItems = filtered.length;
    const totalQuantity = filtered.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalValue = filtered.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.priceImport) || 0), 0);
    return { totalItems, totalQuantity, totalValue };
  }, [filtered]);

  const handleAdd = async () => {
    if (!form.variantId || !form.quantity || !form.priceImport) {
      setError("Vui lòng chọn biến thể, số lượng và giá.");
      return;
    }

    try {
      setError("");
      // Gửi request tạo phiếu nhập
      await api.post("/stockin/items", form);
      
      setShowAdd(false);
      // Reset form nhưng giữ lại mã phiếu để nhập tiếp cho nhanh
      setForm(prev => ({ 
        stockInId: prev.stockInId, 
        variantId: "", 
        quantity: "", 
        priceImport: "", 
        note: "" 
      }));
      
      loadData();
      
      // Thông báo cập nhật dữ liệu cho các màn hình khác
      try { window.dispatchEvent(new CustomEvent('products:updated')); } catch(e){}
      
      alert("Nhập kho thành công!");
    } catch (err) {
      console.error("Error adding item:", err);
      setError(err.response?.data?.message || "Lỗi khi nhập kho.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa dòng nhập kho này? Kho sẽ bị trừ lại.")) return;
    try {
      setError("");
      await api.delete(`/stockin/items/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa.");
    }
  };

  // Hàm reload danh sách biến thể sau khi tạo sản phẩm mới xong
  const refreshVariants = async () => {
      try {
        const variantRes = await api.get("/products/variants"); 
        setVariants(variantRes.data || []);
      } catch (e) { console.error(e); }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="fixed inset-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <span className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-xl shadow-lg">
                  <Package size={28} />
                </span>
                Quản Lý Nhập Kho
              </h1>
              <p className="text-gray-500 mt-2 ml-1">Theo dõi lịch sử nhập hàng và quản lý tồn kho</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={loadData}
                    className="p-3 bg-white text-gray-600 rounded-xl shadow hover:bg-gray-50 transition-colors"
                    title="Làm mới dữ liệu"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                onClick={() => setShowAdd(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                <Plus size={20} />
                Tạo phiếu nhập
                </button>
            </div>
        </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Lượt nhập</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalItems}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Tổng số lượng</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalQuantity.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Layers size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Tổng giá trị nhập</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalValue.toLocaleString()} đ</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Search & Error */}
          <div className="mb-6 space-y-4">
             {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                   <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                   {error}
                </div>
             )}
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Tìm theo mã phiếu, tên sản phẩm, mã biến thể..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
          </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && stockIns.length === 0 ? (
             <div className="p-12 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : filtered.length === 0 ? (
             <div className="p-12 text-center text-gray-500">Chưa có dữ liệu nhập kho.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Mã Phiếu</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Sản Phẩm</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Phân Loại</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">SL</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Giá Nhập</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thành Tiền</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {item.stockInId}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                            {item.importDate ? new Date(item.importDate).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{item.productName}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{item.variantId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                           {item.color && <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md border border-purple-100">{item.color}</span>}
                           {item.size && <span className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">{item.size}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-medium text-gray-700">{item.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {Number(item.priceImport).toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        {(Number(item.quantity) * Number(item.priceImport)).toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Xóa dòng nhập này"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-800">Tạo phiếu nhập kho</h3>
               <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã Phiếu (Tùy chọn)</label>
                  <input 
                    type="text" 
                    placeholder="Để trống để tự tạo mã mới hoặc nhập mã cũ (SI...)"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    value={form.stockInId}
                    onChange={e => setForm({...form, stockInId: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">Nhập mã phiếu cũ để thêm sản phẩm vào phiếu đó.</p>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Biến Thể Sản Phẩm <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                    value={form.variantId}
                    onChange={e => {
                        const v = variants.find(v => v.variant_id === e.target.value);
                        setForm({
                            ...form, 
                            variantId: e.target.value,
                            priceImport: v ? v.cost_price : form.priceImport // Auto-fill giá vốn hiện tại
                        });
                    }}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {variants.length > 0 ? variants.map(v => (
                       <option key={v.variant_id} value={v.variant_id}>
                          {v.product_name} ({v.color} - {v.size}) - Tồn: {v.stock_quantity}
                       </option>
                    )) : (
                        <option value="" disabled>Không có dữ liệu (Vui lòng kiểm tra Backend)</option>
                    )}
                  </select>
                  
                  <button 
                     type="button" 
                     onClick={()=>setShowProductModal(true)} 
                     className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                     <Plus size={14}/> Tạo sản phẩm mới
                  </button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng <span className="text-red-500">*</span></label>
                    <input 
                        type="number" min="1"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={form.quantity}
                        onChange={e => setForm({...form, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập đơn vị <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            type="number" min="0"
                            className="w-full pl-4 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={form.priceImport}
                            onChange={e => setForm({...form, priceImport: e.target.value})}
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-sm">đ</span>
                    </div>
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea 
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                    value={form.note}
                    onChange={e => setForm({...form, note: e.target.value})}
                  />
               </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
               <button 
                 onClick={() => setShowAdd(false)}
                 className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
               >
                 Hủy
               </button>
               <button 
                 onClick={handleAdd}
                 className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
               >
                 Xác nhận nhập
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal tạo sản phẩm mới */}
      <ProductFormModal 
        open={showProductModal} 
        onClose={()=>setShowProductModal(false)} 
        onSaved={async (payload)=>{
             // Reload lại list variants sau khi tạo sản phẩm
             refreshVariants();
             alert("Tạo sản phẩm thành công! Hãy chọn từ danh sách.");
        }} 
      />
      </div>
    </>
  );
};

export default StockInScreen;