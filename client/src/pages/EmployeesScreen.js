import React, { useState, useEffect } from 'react';
import api from '../services/api'; 
import { Plus, Search, User, Edit, Trash2, X, Shield, Truck, ShoppingBag, Headset, CheckCircle, AlertCircle } from 'lucide-react'; 

// ------------------------------------------------------------------------------------------------
// --- HELPER FUNCTIONS (ĐƯỢC THÊM VÀO TỪ CÁC COMPONENT TRƯỚC) ---
// ------------------------------------------------------------------------------------------------

// --- HELPER: MÀU SẮC ROLE ---
const getRoleBadgeColor = (roleName) => {
    const role = (roleName || '').toLowerCase();
    switch (role) {
        case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'customer': return 'bg-green-100 text-green-800 border-green-200';
        case 'sales': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'warehouse': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'shipper': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'online sales': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

// --- HELPER: ICON ROLE ---
const getRoleIcon = (roleName) => {
    const role = (roleName || '').toLowerCase();
    switch (role) {
        case 'owner': return <Shield className="w-3.5 h-3.5 mr-1" />;
        case 'customer': return <User className="w-3.5 h-3.5 mr-1" />;
        case 'shipper': return <Truck className="w-3.5 h-3.5 mr-1" />;
        case 'online sales': return <Headset className="w-3.5 h-3.5 mr-1" />;
        default: return <ShoppingBag className="w-3.5 h-3.5 mr-1" />;
    }
};

// --- HELPER: TRẠNG THÁI ---
const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active' || s === 'hoạt động') {
        return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700"><CheckCircle size={12} className='mr-1' /> Hoạt động</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700"><AlertCircle size={12} className='mr-1' /> Đã khóa</span>;
};

// ------------------------------------------------------------------------------------------------
// --- LOGIC SINH ID (GIỮ NGUYÊN) ---
// ------------------------------------------------------------------------------------------------
const generateNextEmpId = (roleName, employees) => {
    let prefix = 'EMP';
    switch (roleName) {
        case 'Warehouse': prefix = 'WH'; break;
        case 'Sales': prefix = 'SALE'; break;
        case 'Online Sales': prefix = 'OS'; break;
        case 'Shipper': prefix = 'SHIP'; break;
        default: prefix = 'EMP';
    }

    const existingIds = employees
        .filter(e => e.employee_id && e.employee_id.startsWith(prefix))
        .map(e => parseInt(e.employee_id.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
    
    const max = existingIds.length ? Math.max(...existingIds) : 0;
    // Tùy chỉnh padding cho ID. Ví dụ: SALE01, WH01
    return `${prefix}${(max + 1).toString().padStart(2, '0')}`;
};

// ------------------------------------------------------------------------------------------------
// --- MÀN HÌNH CHÍNH ---
// ------------------------------------------------------------------------------------------------

export const EmployeesScreen = () => {
    const [employees, setEmployees] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        roleName: 'Sales',
        fullName: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        address: '',
        baseSalary: 5000000,
        employeeId: '' 
    };

    const [formData, setFormData] = useState(initialFormState);

    // 1. Tải danh sách nhân viên
    const fetchEmployees = async () => {
        try {
            // API này cần trả về đầy đủ thông tin Employee + User (username, status)
            const res = await api.get('/employees'); 
            setEmployees(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchEmployees(); }, []);

    // 2. Tự động sinh ID (CHỈ KHI THÊM MỚI)
    useEffect(() => {
        if (isModalOpen && !isEditing) {
            const nextId = generateNextEmpId(formData.roleName, employees);
            setFormData(prev => ({ ...prev, employeeId: nextId }));
        }
    }, [formData.roleName, isModalOpen, isEditing, employees]);

    // 3. Hàm mở Modal để Sửa
    const handleEdit = (emp) => {
        setIsEditing(true);
        setFormData({
            // Đảm bảo department mapping đúng vai trò/roleName
            roleName: emp.department || 'Sales', 
            fullName: emp.full_name,
            username: emp.username,
            password: '', 
            email: emp.email,
            phone: emp.phone,
            address: emp.address,
            baseSalary: emp.base_salary,
            employeeId: emp.employee_id 
        });
        setIsModalOpen(true);
    };

    // 4. Hàm mở Modal để Thêm mới
    const handleAddNew = () => {
        setIsEditing(false);
        setFormData(initialFormState);
        setIsModalOpen(true);
    }

    // 5. Xử lý Submit (Phân chia Tạo mới / Cập nhật)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // API Cập nhật
                await api.put(`/employees/${formData.employeeId}`, formData);
                alert("Cập nhật thông tin thành công!");
            } else {
                // API Tạo mới
                await api.post('/employees/create', formData);
                alert("Thêm nhân viên thành công!");
            }
            setIsModalOpen(false);
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.message || "Đã có lỗi xảy ra");
        }
    };

    // 6. Xử lý Xóa
    const handleDelete = async (employeeId, username) => {
        const confirmMsg = `CẢNH BÁO: Bạn có chắc chắn muốn xóa nhân viên ${employeeId}?\n\nHành động này sẽ XÓA LUÔN TÀI KHOẢN đăng nhập (${username}) khỏi hệ thống.`;
        
        if (window.confirm(confirmMsg)) {
            try {
                await api.delete(`/employees/${employeeId}`);
                alert("Đã xóa nhân viên và tài khoản liên quan.");
                fetchEmployees();
            } catch (error) {
                alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
            }
        }
    };
    
    // 7. Logic tìm kiếm (lọc trên danh sách đã tải)
    const filteredEmployees = employees.filter(emp => {
        const lowerSearch = searchTerm.toLowerCase();
        return (
            emp.full_name.toLowerCase().includes(lowerSearch) ||
            emp.employee_id.toLowerCase().includes(lowerSearch) ||
            emp.username.toLowerCase().includes(lowerSearch)
        );
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            
            {/* --- HEADER VÀ NÚT THÊM MỚI --- */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Nhân sự</h1>
                <button 
                    onClick={handleAddNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md transition-colors"
                >
                    <Plus size={20} /> Thêm Nhân viên
                </button>
            </div>

            {/* --- THANH TÌM KIẾM --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên, Mã NV hoặc username..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* --- BẢNG HIỂN THỊ NHÂN VIÊN --- */}
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-4 border-b">Mã NV</th>
                            <th className="p-4 border-b">Họ tên</th>
                            <th className="p-4 border-b">Bộ phận</th>
                            <th className="p-4 border-b">Tài khoản & Trạng thái</th>
                            <th className="p-4 border-b">Liên hệ & Lương cơ bản</th>
                            <th className="p-4 border-b text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => (
                            <tr key={emp.employee_id} className="border-b hover:bg-blue-50 transition-colors">
                                <td className="p-4 font-bold text-blue-600">{emp.employee_id}</td>
                                <td className="p-4 font-medium">{emp.full_name}</td>
                                <td className="p-4">
                                    {/* Sử dụng Role Badge cho Bộ phận/Vị trí */}
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getRoleBadgeColor(emp.department)}`}>
                                        {getRoleIcon(emp.department)} {emp.department}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">
                                    <div className="text-gray-800 font-mono flex items-center gap-1">{emp.username}</div>
                                    <div className="mt-1">{getStatusBadge(emp.status)}</div>
                                </td>
                                <td className="p-4 text-sm">
                                    <div className="text-gray-800">{emp.email}</div>
                                    <div className="text-gray-500">{emp.phone}</div>
                                    <div className="text-xs text-green-600 font-medium mt-1">Lương: {emp.base_salary.toLocaleString()} VNĐ</div>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(emp)}
                                            className="p-2 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                                            title="Sửa thông tin"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(emp.employee_id, emp.username)}
                                            className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                            title="Xóa nhân viên & Tài khoản"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredEmployees.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-6 text-center text-gray-500">
                                    {employees.length === 0 ? 'Chưa có dữ liệu nhân viên.' : 'Không tìm thấy kết quả phù hợp.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL (Thêm/Sửa) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-xl font-bold mb-6 text-gray-800">
                            {isEditing ? `Cập nhật: ${formData.fullName}` : 'Tuyển dụng Nhân viên mới'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                            
                            {/* --- Cột 1: Thông tin Công việc --- */}
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <div className="border-b pb-2 mb-2 font-semibold text-blue-600">Thông tin Công việc</div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Vị trí / Bộ phận</label>
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.roleName}
                                        onChange={e => setFormData({...formData, roleName: e.target.value})}
                                        disabled={isEditing} 
                                    >
                                        <option value="Sales">Nhân viên Bán hàng</option>
                                        <option value="Online Sales">Sale Online</option>
                                        <option value="Warehouse">Thủ kho</option>
                                        <option value="Shipper">Giao hàng</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Mã NV {isEditing ? '(Cố định)' : '(Tự động)'}</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border bg-gray-100 text-gray-500 rounded cursor-not-allowed" 
                                        value={formData.employeeId} 
                                        readOnly 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Lương cơ bản (VNĐ)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.baseSalary}
                                        onChange={e => setFormData({...formData, baseSalary: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* --- Cột 2: Thông tin Cá nhân --- */}
                            <div className="col-span-2 md:col-span-1 space-y-4">
                                <div className="border-b pb-2 mb-2 font-semibold text-blue-600">Thông tin Cá nhân</div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Họ và Tên</label>
                                    <input 
                                        type="text" required 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.fullName}
                                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                                    <input 
                                        type="email" required 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Số điện thoại</label>
                                    <input 
                                        type="text" required 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Địa chỉ</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* --- Cột 3: Tài khoản Hệ thống --- */}
                            <div className="col-span-2 space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="font-semibold text-blue-800 flex items-center gap-2">
                                    <User size={18} /> Tài khoản Hệ thống
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">Tên đăng nhập</label>
                                        <input 
                                            type="text" required placeholder="VD: sale_an"
                                            className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none ${isEditing ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                                            value={formData.username}
                                            onChange={e => setFormData({...formData, username: e.target.value})}
                                            readOnly={isEditing} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-gray-700">
                                            {isEditing ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu khởi tạo'}
                                        </label>
                                        <input 
                                            type="text" 
                                            required={!isEditing} 
                                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- NÚT SUBMIT --- */}
                            <div className="col-span-2 flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition font-medium">
                                    {isEditing ? 'Cập nhật Hồ sơ' : 'Tạo Nhân viên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};