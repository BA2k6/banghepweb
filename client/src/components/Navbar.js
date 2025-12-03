import React from 'react';
import { LogOut, User } from 'lucide-react';

export const Navbar = ({ currentUser, handleLogout, setPath }) => (
    <header className="bg-gray-100 shadow-md h-16 flex items-center justify-between px-6 sticky top-0 z-30 w-full md:pl-64">
        <div className="text-lg font-semibold text-gray-800 hidden sm:block">
            Hệ thống Quản lý Cửa hàng
        </div>

        <div className="flex items-center space-x-4">
            <button 
                onClick={() => setPath('/profile')} 
                title="Hồ sơ cá nhân" 
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition duration-150"
            >
                <User className="w-5 h-5 text-gray-500" />
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-800">{currentUser?.fullName || 'Guest'}</p>
                    <p className="text-xs text-blue-600 font-semibold">{currentUser?.roleName || 'Chưa đăng nhập'}</p>
                </div>
            </button>
            
            <button title="Đăng xuất" onClick={handleLogout} className="p-2 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50 transition">
                <LogOut className="w-6 h-6" />
            </button>
        </div>
    </header>
);