import React from 'react';
import { Facebook, Phone, Mail, MapPin, CheckCircle, Send } from 'lucide-react';
import ShopLogo from '../assets/shop-logo-konen.png'; 

const Footer = () => {
    const ACCENT_COLOR = '#E2B657';
    const BG_COLOR = 'bg-gray-800'; 

    return (
        <>
            <footer className={`${BG_COLOR} text-white pt-12 pb-8 text-sm font-sans border-t-4 border-gray-900`}>
                <div className="max-w-7xl mx-auto px-4">
                    
                    {/* --- Top Section (5 Cột ngang hàng) --- */}
                    {/* ĐÃ CHUYỂN SANG: lg:grid-cols-5 để chứa đúng 5 khối con, giữ nguyên cấu trúc cũ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10 border-b border-gray-600 pb-10"> 
                        
                        {/* Cột 1: Logo (Khối 1/5) */}
                        <div className="lg:col-span-1"> 
                            <img src={ShopLogo} alt="Aura Store Branding" className="w-40 h-auto object-contain drop-shadow-md mb-6" />
                        </div>
                        
                        {/* Cột 2: Về Aura (Khối 2/5) */}
                        <div>
                            <h3 className={`font-bold text-base mb-5 uppercase text-[${ACCENT_COLOR}] tracking-wide`}>VỀ AURA</h3>
                            
                            <p className="text-gray-400 text-xs leading-relaxed mb-4">
                                Bản quyền © 2025 AuraStore<br/>
                                Mọi quyền được bảo lưu.
                            </p>
                            <ul className="space-y-2 text-gray-300 text-xs">
                                <li><a href="#" className={`hover:text-[${ACCENT_COLOR}] transition-colors hover:underline`}>Chính sách bảo mật</a></li>
                                <li><a href="#" className={`hover:text-[${ACCENT_COLOR}] transition-colors hover:underline`}>Chính sách đổi, trả hàng hóa</a></li>
                                <li><a href="#" className={`hover:text-[${ACCENT_COLOR}] transition-colors hover:underline`}>Câu hỏi thường gặp</a></li>
                            </ul>
                        </div>

                        {/* Cột 3: Cam Kết (Khối 3/5) */}
                        <div>
                            <h3 className={`font-bold text-base mb-5 uppercase text-[${ACCENT_COLOR}] tracking-wide`}>CAM KẾT</h3>
                            <ul className="space-y-4 text-gray-300 text-xs">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span>Luôn có sản phẩm trong catalogue</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span>Đổi trả hàng trong 7 ngày</span>
                                </li>
                                
                                <li className="flex items-start gap-2">
                                    <CheckCircle className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span>Hoàn tiền nếu sai sót</span>
                                </li>
                            </ul>
                        </div>

                        {/* Cột 4: Đừng Bỏ Lỡ (Khối 4/5) */}
                        <div>
                            <h3 className={`font-bold text-base mb-5 uppercase text-[${ACCENT_COLOR}] tracking-wide`}>ĐỪNG BỎ LỠ</h3>
                            <ul className="space-y-3 text-gray-300 text-xs font-medium">
                                <li><a href="#" className="hover:text-white hover:underline flex items-center gap-2"><Send size={14}/> Chương trình khuyến mãi</a></li>
                                <li><a href="#" className="hover:text-white hover:underline flex items-center gap-2"><Facebook size={14}/> Theo dõi trên Facebook</a></li>
                                <li><a href="#" className="hover:text-white hover:underline flex items-center gap-2"><Mail size={14}/> Đăng ký nhận tin</a></li>
                            </ul>
                        </div>

                        {/* Cột 5: Thông tin Liên hệ nhanh (Khối 5/5) */}
                        <div>
                            <h3 className={`font-bold text-base mb-5 uppercase text-[${ACCENT_COLOR}] tracking-wide`}>LIÊN HỆ NHANH</h3>
                            <div className="space-y-4">
                                <a href="tel:19001880" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <Phone className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span className="font-bold text-base">1900 1880</span> (CSKH)
                                </a>
                                <a href="mailto:cskh@aurastore.com" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <Mail className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span>cskh@aurastore.com</span>
                                </a>
                                <a href="#" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                    <MapPin className={`w-4 h-4 text-[${ACCENT_COLOR}] shrink-0`} />
                                    <span>Hà Nội, Việt Nam</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* --- Bottom Section: Thông tin công ty (Giữ nguyên) --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs text-gray-400 pt-5">
                        <div>
                            <h4 className="font-bold text-white mb-3 uppercase tracking-wider">CÔNG TY TNHH DỊCH VỤ EB</h4>
                            <p className="mb-1.5 flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500" />
                                <span>Hà Nội, Việt Nam</span>
                            </p>
                            <p className="mb-1 flex items-center gap-4 ml-5">
                                <span>Tel: (84-08) 3995 8368</span>
                                <span>Fax: (84-08) 3995 8423</span>
                            </p>
                        </div>
                        
                        <div className="lg:text-right">
                            <div className="text-gray-500 pt-5">
                                *Mọi giao dịch và thông tin sản phẩm đều thuộc quyền sở hữu của Công ty TNHH Dịch Vụ EB.
                            </div>
                        </div>
                    </div>
                </div>
                {/* Copyright (Giữ nguyên) */}
                <div className="mb-4 pt-6 border-t border-white/5 text-center text-xs text-gray-500 w-full max-w-7xl mx-auto px-4 md:px-8">
                    © {new Date().getFullYear()} Aura Store. All Rights Reserved.
                </div>
            </footer>
        </>
    );
};

export default Footer;