// src/pages/CustomersScreen.js
import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Plus, Edit, Eye } from 'lucide-react';
// Import API thật để lấy dữ liệu từ Server
import { getCustomers } from '../services/api'; 
// Import các hằng số và hàm tiện ích
import { ROLES } from '../utils/constants';
import { normalizeSearchableValue } from '../utils/helpers';

export const CustomersScreen = ({ userRoleName }) => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    
    // Xác định quyền chỉnh sửa (Chỉ Owner, Sales, Online Sales mới được chỉnh sửa/thêm)
    const canEdit = [ROLES.OWNER.name, ROLES.SALES.name, ROLES.ONLINE_SALES.name].includes(userRoleName);

    // --- LẤY DỮ LIỆU TỪ API ---
    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getCustomers(); // <-- GỌI API /api/customers
                setCustomers(data);
            } catch (err) {
                setError(err.message || 'Không thể tải dữ liệu khách hàng từ máy chủ.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    // --- LOGIC TÌM KIẾM TOÀN DIỆN TRÊN CLIENT ---
    const filteredCustomers = useMemo(() => {
        if (!searchTerm) return customers;
        const lowerCaseSearch = normalizeSearchableValue(searchTerm);

        return customers.filter(c => {
            return Object.values(c).some(value => {
                return normalizeSearchableValue(value).includes(lowerCaseSearch);
            });
        });
    }, [customers, searchTerm]);

    // --- RENDER HỌC (Loading, Error) ---
    if (isLoading) {
        return <p className="p-6 text-center text-xl text-blue-600 font-semibold">Đang tải dữ liệu khách hàng từ Server...</p>;
    }
    
    if (error) {
        return <p className="p-6 text-center text-xl text-red-600 font-semibold">Lỗi: {error}</p>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Khách hàng (Customers)</h1>
            <p className="text-gray-500 text-sm">Quyền: Owner, Sales, Online Sales (chỉnh sửa); Warehouse, Shipper (chỉ xem)</p>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    {/* Ô TÌM KIẾM */}
                    <div className="relative flex-grow w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, SĐT, email, địa chỉ, năm sinh..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                        />
                    </div>

                    {canEdit && (
                        <button
                            onClick={() => alert("[API CALL] Mở form Thêm Khách hàng mới.")}
                            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-200 w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Thêm khách hàng
                        </button>
                    )}
                </div>

                {/* BẢNG KHÁCH HÀNG */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã KH</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Năm sinh</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCustomers.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{c.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.dob}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">{c.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                        <button
                                            title="Xem lịch sử"
                                            onClick={() => alert(`[API CALL] Xem lịch sử mua hàng của KH #${c.id}`)}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        {canEdit && (
                                            <button
                                                title="Cập nhật"
                                                onClick={() => alert(`[API CALL] Mở form cập nhật KH #${c.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">Không tìm thấy khách hàng nào.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
