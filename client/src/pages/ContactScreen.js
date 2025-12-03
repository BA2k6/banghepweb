import React from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import Footer from '../components/Footer'; 
import NenLogin from '../assets/nen.png'; // Đảm bảo bạn đã có hình này trong thư mục assets

// --- COMPONENT CON: CONTACT ITEM ---
const ContactItem = ({ icon: Icon, title, content }) => (
    <div className="flex items-start gap-4 group">
        <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-[#E2B657] group-hover:bg-[#E2B657] group-hover:text-black transition-all duration-300 flex-shrink-0 shadow-[0_0_15px_rgba(226,182,87,0.1)] group-hover:shadow-[0_0_20px_rgba(226,182,87,0.6)]">
            <Icon size={20} />
        </div>
        <div className="pt-1">
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#E2B657] transition-colors">{title}</div>
            <div className="text-lg font-medium text-white group-hover:text-[#E2B657] transition-colors duration-300 drop-shadow-md">{content}</div>
        </div>
    </div>
);

// --- CÁC HẰNG SỐ STYLE ---
const MAIN_BG = 'bg-transparent'; // Để trong suốt để hiện hình nền
const CARD_BG = 'bg-black/60 backdrop-blur-md'; // Nền kính mờ tối
const LIGHT_FORM_BG = 'bg-white/95 backdrop-blur-sm'; // Nền kính mờ sáng (Form)
const LIGHT_INPUT_BG = 'bg-gray-50'; // Nền input
const ACCENT_COLOR = 'text-[#E2B657]';

export const ContactScreen = ({ setPath }) => {
    return (
        <div className={`min-h-screen w-full ${MAIN_BG} text-white font-sans flex flex-col relative overflow-hidden`}>
            
            {/* =====================================================================================
                1. BACKGROUND LAYERS (HÌNH NỀN + LỚP PHỦ + HIỆU ỨNG)
               ===================================================================================== */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Hình nền gốc */}
                <img 
                    src={NenLogin} 
                    alt="Contact Background" 
                    className="w-full h-full object-cover"
                />
                
                

                {/* Hiệu ứng Blob (Đốm sáng) màu vàng */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen">
                    <div className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-[#E2B657]/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#E2B657]/20 rounded-full blur-[120px] animate-pulse delay-500"></div>
                </div>
            </div>

            {/* =====================================================================================
                2. HEADER (Back Button & Title)
               ===================================================================================== */}
            <header className={`fixed top-0 left-0 w-full z-50 flex items-center px-6 py-4 bg-black/50 backdrop-blur-md border-b border-white/10`}>
                <div className="flex-1 text-center relative w-full max-w-7xl mx-auto">
                    <button
                        onClick={() => setPath('/')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
                    >
                        <div className="bg-white/5 p-2 rounded-full border border-white/10 group-hover:border-[#E2B657] group-hover:bg-[#E2B657]/10 transition-all">
                            <ArrowLeft className="w-5 h-5 group-hover:text-[#E2B657] transition-colors" />
                        </div>
                    </button>
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white drop-shadow-md">Liên Hệ</h2>
                </div>
            </header>

            {/* =====================================================================================
                3. MAIN CONTENT
               ===================================================================================== */}
            <main className="flex-1 pt-20 z-10 relative"> 
                <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16">

                        {/* --- LEFT COLUMN: INFO SECTION --- */}
                        <div className={`md:col-span-8 p-6 md:p-10 ${CARD_BG} relative rounded-xl shadow-2xl overflow-hidden
                                         group transition-all duration-500 ease-in-out
                                         border border-[#E2B657]/20 hover:border-[#E2B657]/50`}>
                            
                            {/* Họa tiết nhiễu hạt (Noise texture) */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>

                            <h1 className={`text-3xl md:text-4xl font-black uppercase mb-5 ${ACCENT_COLOR} drop-shadow-lg`}>
                                Tư vấn & <br /> Hỗ trợ khách hàng
                            </h1>
                            <p className="text-gray-200 mb-8 text-md font-light leading-relaxed border-l-2 border-[#E2B657] pl-4">
                                Chúng tôi luôn sẵn lòng giải đáp mọi thắc mắc của bạn về sản phẩm, dịch vụ hoặc cần hỗ trợ kỹ thuật một cách nhanh chóng nhất.
                            </p>

                            <div className="space-y-8 mt-10">
                                <ContactItem icon={Phone} title="Hotline" content="1900 888 888" />
                                <ContactItem icon={Mail} title="Email" content="support@aurastore.com" />
                                <ContactItem icon={MapPin} title="Địa chỉ" content="Hà Nội, Việt Nam" />
                                <ContactItem icon={Clock} title="Giờ mở cửa" content="09:00 - 22:00 (Mỗi ngày)" />
                            </div>
                        </div>

                        {/* --- RIGHT COLUMN: FORM SECTION --- */}
                        <div className={`md:col-span-4 p-6 md:p-10 ${LIGHT_FORM_BG} rounded-xl relative
                                         transition-all duration-300 ease-in-out group 
                                         shadow-2xl hover:shadow-[0_0_30px_rgba(226,182,87,0.5)] 
                                         hover:scale-[1.01] transform`}>
                            
                            {/* Viền sáng khi hover */}
                            <div className="absolute inset-0 rounded-xl border-4 border-transparent 
                                         group-hover:border-[#E2B657]/70 transition-colors duration-300 pointer-events-none"></div>
                            
                            <h2 className={`text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-200 pb-4`}>
                                <Send size={24} className={ACCENT_COLOR}/> Gửi tin nhắn
                            </h2>
                            
                            <form className="space-y-5 w-full" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2 font-bold">Họ tên</label>
                                    <input 
                                        type="text" 
                                        className={`w-full ${LIGHT_INPUT_BG} border border-gray-200 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:border-[#E2B657] focus:ring-1 focus:ring-[#E2B657] outline-none transition-all shadow-sm`} 
                                        placeholder="Tên của bạn" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2 font-bold">Email</label>
                                    <input 
                                        type="email" 
                                        className={`w-full ${LIGHT_INPUT_BG} border border-gray-200 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:border-[#E2B657] focus:ring-1 focus:ring-[#E2B657] outline-none transition-all shadow-sm`} 
                                        placeholder="example@email.com" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-600 mb-2 font-bold">Lời nhắn</label>
                                    <textarea 
                                        rows="4" 
                                        className={`w-full ${LIGHT_INPUT_BG} border border-gray-200 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:border-[#E2B657] focus:ring-1 focus:ring-[#E2B657] outline-none transition-all shadow-sm resize-none`} 
                                        placeholder="Bạn cần hỗ trợ gì?"
                                    ></textarea>
                                </div>
                                {/* --- NÚT GỬI (ĐÃ SỬA) --- */}
<div className="relative mt-6 group">
    {/* 1. Lớp hào quang nhấp nháy (Breathing Glow) */}
    {/* - animate-pulse: Tạo hiệu ứng nhấp nháy mờ/tỏ liên tục
        - blur-lg: Làm nhòe để tạo thành hào quang
        - opacity-75: Độ trong suốt vừa phải để không lấn át nút
    */}
    <div className="absolute -inset-1 bg-gradient-to-r from-[#E2B657] to-[#FDB931] rounded-lg blur-lg opacity-75 animate-pulse transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
    
    {/* 2. Nút chính */}
    <button className="relative w-full bg-gradient-to-r from-[#E2B657] to-[#d4a037] text-black font-extrabold uppercase tracking-widest py-3.5 rounded-lg transition-all flex items-center justify-center gap-3 shadow-xl overflow-hidden hover:scale-[1.02] active:scale-[0.98]">
        
        {/* 3. Hiệu ứng quét sáng (Shine Sweep) tự động chạy */}
        {/* Dải sáng trắng chạy liên tục từ trái qua phải */}
        <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]"></div>
        
        {/* Nội dung nút */}
        <span className="relative z-10 flex items-center gap-2">
            <Send size={18} className="animate-bounce" /> {/* Icon nhảy nhẹ */}
            Gửi ngay
        </span>
    </button>
</div>

{/* --- CSS CHO HIỆU ỨNG QUÉT SÁNG (SHIMMER) --- */}
{/* Bạn có thể thêm đoạn style này vào ngay phía trên return hoặc trong file CSS global */}
<style>{`
    @keyframes shimmer {
        100% { left: 100%; }
    }
`}</style>
                            </form>
                        </div>

                    </div>
                </div>

                {/* Copyright Line */}
                <div className="pb-10 pt-4 text-center text-xs text-gray-400 w-full max-w-7xl mx-auto px-4 md:px-8 opacity-70">
                    © {new Date().getFullYear()} Aura Store. All Rights Reserved.
                </div>
            </main>

            {/* =====================================================================================
                4. FOOTER (NỀN ĐEN ĐẶC ĐỂ CHE HÌNH NỀN)
               ===================================================================================== */}
            <div className="relative z-50 bg-[#050505] border-t border-white/10 shadow-[0_-10px_50px_rgba(0,0,0,1)]">
                <Footer /> 
            </div>
            
        </div>
    );
};