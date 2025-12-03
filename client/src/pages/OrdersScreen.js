// /client/src/pages/OrdersScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Search, Plus, Edit, Trash2, Eye, Zap } from 'lucide-react';
import { getOrders } from '../services/api';
import { ROLES } from '../utils/constants';
import { formatCurrency, normalizeSearchableValue } from '../utils/helpers';

export const OrdersScreen = ({ currentUserId, userRoleId }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ======= ROLE CHECK =======
  const isOwner = userRoleId === ROLES.OWNER.id;
  const isDirectSales = userRoleId === ROLES.SALES.id;
  const isOnlineSales = userRoleId === ROLES.ONLINE_SALES.id;
  const isShipper = userRoleId === ROLES.SHIPPER.id;

  // Kênh được phép xem
  const restrictedChannel = isDirectSales ? 'Direct' : isOnlineSales ? 'Online' : 'all';

  // ======= FILTER STATE =======
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState(restrictedChannel);
  const [searchTerm, setSearchTerm] = useState('');

  // ======= PERMISSIONS =======
  const canCreateEditOrder = isOwner || isDirectSales || isOnlineSales;
  const canUpdateStatus = isOwner || isDirectSales || isOnlineSales || isShipper;
  const canCancel = isOwner;

  // ======= FETCH ORDERS =======
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError('Không thể tải dữ liệu đơn hàng từ server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (restrictedChannel !== 'all' && filterChannel !== restrictedChannel) {
      setFilterChannel(restrictedChannel);
    }
  }, [restrictedChannel, filterChannel]);

  // ======= FILTER LOGIC =======
  const filteredOrders = useMemo(() => {
    const lower = normalizeSearchableValue(searchTerm);

    return orders.filter(o => {
      const statusMatch = filterStatus === 'all' || o.status === filterStatus;
      const channelMatch =
        restrictedChannel === 'all'
          ? filterChannel === 'all' || o.orderType === filterChannel
          : o.orderType === restrictedChannel;
      const shipperMatch = !isShipper || o.shipper_user_id === currentUserId;

      if (!statusMatch || !channelMatch || !shipperMatch) return false;

      if (!searchTerm) return true;

      return Object.values(o).some(v => {
        if (typeof v === 'object') return false;
        return normalizeSearchableValue(v).includes(lower);
      });
    });
  }, [orders, filterStatus, filterChannel, searchTerm, restrictedChannel, isShipper, currentUserId]);

  // ======= BADGES =======
  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";
    const map = {
      Pending: "bg-yellow-100 text-yellow-700",
      Processing: "bg-blue-100 text-blue-700",
      Shipping: "bg-purple-100 text-purple-700",
      Completed: "bg-green-100 text-green-700",
      Cancelled: "bg-red-100 text-red-700"
    };
    return <span className={`${base} ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
  };

  const getChannelBadge = (channel) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";
    const color = channel === 'Online' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
    return <span className={`${base} ${color}`}>{channel}</span>;
  };

  // ======= ACTION HANDLERS =======
  const handleViewDetail = (order) => alert('Xem chi tiết đơn ' + order.id);
  const handleEditOrder = (order) => { if (canCreateEditOrder) alert('Chỉnh sửa đơn ' + order.id); };
  const handleDeleteOrder = (order) => { if (canCancel && window.confirm(`Xóa đơn ${order.id}?`)) alert('Đã xóa (placeholder)'); };
  const handleUpdateStatus = (order) => { if (canUpdateStatus) alert('Cập nhật trạng thái ' + order.id); };

  // ======= RENDER =======
  if (isLoading) return <p className="p-6 text-center">Đang tải dữ liệu...</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
        <ShoppingCart /> Quản lý Đơn hàng
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-4">
        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          {/* Search */}
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Search size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="ml-2 outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select
            className="border rounded-lg px-3 py-2"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipping">Shipping</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Channel filter */}
          {restrictedChannel === 'all' && (
            <select
              className="border rounded-lg px-3 py-2"
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value)}
            >
              <option value="all">Tất cả kênh</option>
              <option value="Direct">Bán trực tiếp</option>
              <option value="Online">Bán online</option>
            </select>
          )}

          {/* New Order button */}
          {canCreateEditOrder && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus size={18} /> Tạo Đơn mới
            </button>
          )}
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs">Mã</th>
                <th className="px-3 py-3 text-left text-xs">Khách hàng</th>
                <th className="px-3 py-3 text-left text-xs">NV lập đơn</th>
                <th className="px-3 py-3 text-left text-xs">Ngày lập</th>
                <th className="px-3 py-3 text-left text-xs">Tổng tiền</th>
                <th className="px-3 py-3 text-left text-xs">Kênh</th>
                <th className="px-3 py-3 text-left text-xs">Trạng thái</th>
                <th className="px-3 py-3 text-right text-xs">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(o => {
                const showUpdateBtn = canUpdateStatus && o.status !== 'Completed' && o.status !== 'Cancelled';
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">{o.id}</td>
                    <td className="px-3 py-4">{o.customerName}</td>
                    <td className="px-3 py-4">{o.staffName}</td>
                    <td className="px-3 py-4">{new Date(o.orderDate).toLocaleDateString('vi-VN')}</td>
                    <td className="px-3 py-4 text-red-600 font-semibold">{formatCurrency(o.totalAmount)}</td>
                    <td className="px-3 py-4">{getChannelBadge(o.orderType)}</td>
                    <td className="px-3 py-4">{getStatusBadge(o.status)}</td>

                    {/* ACTIONS */}
                    <td className="px-3 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => handleViewDetail(o)} className="p-2 rounded-full  hover:bg-blue-100 text-black-600"><Eye size={18} /></button>
                      {canCreateEditOrder && <button onClick={() => handleEditOrder(o)} className="p-2 rounded-full hover:bg-blue-100  text-blue-800"><Edit size={18} /></button>}
                      {showUpdateBtn && <button onClick={() => handleUpdateStatus(o)} className="p-2 rounded-full hover:bg-blue-100  text-yellow-600"><Zap size={18} /></button>}
                      {canCancel && <button onClick={() => handleDeleteOrder(o)} className="p-2 rounded-full  hover:bg-blue-100  text-red-600"><Trash2 size={18} /></button>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <p className="text-center py-8 text-gray-500">Không tìm thấy đơn hàng nào.</p>}
        </div>
      </div>
    </div>
  );
};
