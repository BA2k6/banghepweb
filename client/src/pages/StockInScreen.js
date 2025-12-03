import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import axios from "axios";

const StockInScreen = () => {
  const [stockIns, setStockIns] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    priceImport: "",
    note: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const stockRes = await axios.get("/api/stock-in");
    const productRes = await axios.get("/api/products");

    setStockIns(stockRes.data);
    setProducts(productRes.data);
  };

  const filtered = useMemo(() => {
    return stockIns.filter((item) =>
      item.productId?.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [stockIns, search]);

  const handleAdd = async () => {
    await axios.post("/api/stock-in", form);
    setShowAdd(false);
    setForm({ productId: "", quantity: "", priceImport: "", note: "" });
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;
    await axios.delete(`/api/stock-in/${id}`);
    loadData();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Nhập Kho</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> Nhập hàng
        </button>
      </div>

      {/* Search */}
      <div className="relative w-80 mb-4">
        <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Tìm theo tên sản phẩm..."
          className="pl-10 pr-3 py-2 w-full border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Sản phẩm</th>
              <th className="p-3 text-left">Số lượng</th>
              <th className="p-3 text-left">Giá nhập</th>
              <th className="p-3 text-left">Ghi chú</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="p-3">{item.productId?.name}</td>
                <td className="p-3">{item.quantity}</td>
                <td className="p-3">{item.priceImport.toLocaleString()} đ</td>
                <td className="p-3">{item.note}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Nhập hàng</h3>

            <select
              className="w-full border p-2 rounded mb-3"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="w-full border p-2 rounded mb-3"
              placeholder="Số lượng"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />

            <input
              type="number"
              className="w-full border p-2 rounded mb-3"
              placeholder="Giá nhập"
              value={form.priceImport}
              onChange={(e) =>
                setForm({ ...form, priceImport: e.target.value })
              }
            />

            <textarea
              className="w-full border p-2 rounded mb-3"
              placeholder="Ghi chú"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-2 bg-gray-300 rounded"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInScreen;
