import React from 'react';
import { ArrowLeft, Target, Heart, Users, Award, Gem } from 'lucide-react';
import Footer from '../components/Footer'; 
import ABOUT_IMAGE from '../assets/about.png';


export const AboutScreen = ({ setPath }) => {
    return (
        <div className="min-h-screen w-full bg-black text-white font-sans selection:bg-[#E2B657] selection:text-black">
            
            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/10">
            <button
                onClick={() => setPath('/')}
                className="absolute left-8 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
                <div className="bg-white/5 p-2 rounded-full border border-white/10 group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all">
                    <ArrowLeft className="w-5 h-5 group-hover:text-[#E2B657] transition-colors" />
                </div>
            </button>
                <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white">Về chúng tôi</h2>
                </div>
               
            </header>
            {/* --- HERO SECTION --- */}
            <div className="relative pt-24 pb-20 px-6 md:px-20 flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                
                <span className="text-[#E2B657] font-medium tracking-[0.2em] uppercase mb-4 animate-fade-in-up">Câu chuyện thương hiệu</span>
                <h1 className="text-5xl md:text-7xl lg:text-7xl font-black uppercase tracking-widest mb-6 scale-y-110">
    {/* Container: relative để định vị lớp phủ, group để bắt sự kiện hover */}
    <span className="relative group block w-fit mx-auto cursor-pointer select-none">
        
        {/* --- LỚP 1: CHỮ GỐC (MÀU VÀNG GOLD) --- */}
        <span className="
            relative z-10
            bg-clip-text text-transparent 
            bg-gradient-to-b from-[#e4d9b4] via-[#e5c24f] to-[#886600] 
            drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]
        ">
            Aura Store
        </span>

        {/* --- LỚP 2: DẢI SÁNG (SHINE OVERLAY) --- */}
        {/* Lớp này nằm đè lên lớp 1 (absolute inset-0), cũng cắt theo hình chữ (bg-clip-text) */}
        <span className="
            absolute inset-0 z-20
            bg-clip-text text-transparent
            
            /* Tạo dải sáng trắng mờ ở giữa, 2 bên trong suốt */
            bg-gradient-to-r from-transparent via-white/90 to-transparent
            bg-no-repeat
            
            /* Kích thước background rộng gấp đôi chữ để có chỗ chạy */
            bg-[length:200%_100%]
            
            /* Vị trí ban đầu: Nằm ẩn bên trái (-100%) */
            bg-[position:-100%_0]
            
            /* Khi Hover: Chạy sang bên phải (200%) */
            group-hover:bg-[position:200%_0]
            
            /* Thời gian chạy: 0.7s */
            transition-[background-position] duration-700 ease-in-out
        "
        aria-hidden="true">
            Aura Store
        </span>
        
    </span>
</h1>
                <p className="max-w-3xl text-gray-300 text-lg md:text-xl leading-relaxed font-light">
                    Không chỉ là nơi mua sắm, Aura Store là biểu tượng của phong cách sống thượng lưu. Chúng tôi kết hợp giữa thời trang đẳng cấp và công nghệ quản lý hiện đại để mang lại trải nghiệm hoàn hảo nhất.
                </p>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                
                {/* Image Side */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-[#E2B657] rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <img 
                        src={ABOUT_IMAGE} 
                        alt="About Aura" 
                        className="relative z-10 w-full h-[400px] object-cover rounded-lg grayscale group-hover:grayscale-0 transition-all duration-700 shadow-2xl border border-white/10"
                    />
                </div>

                {/* Text Side */}
                <div className="space-y-8">
                    <FeatureBlock 
                        icon={Target} 
                        title="Sứ mệnh" 
                        desc="Mang đến những sản phẩm thời trang chất lượng cao nhất, tôn vinh vẻ đẹp và cá tính riêng biệt của từng khách hàng."
                    />
                    <FeatureBlock 
                        icon={Gem} 
                        title="Giá trị cốt lõi" 
                        desc="Sang trọng - Tận tâm - Đổi mới. Chúng tôi không ngừng hoàn thiện hệ thống để phục vụ bạn tốt hơn mỗi ngày."
                    />
                    <FeatureBlock 
                        icon={Users} 
                        title="Đội ngũ" 
                        desc="Được vận hành bởi những chuyên gia đam mê thời trang và đội ngũ kỹ thuật viên hàng đầu."
                    />
                </div>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="border-t border-white/10 bg-white/5 py-16">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <StatNumber num="2024" label="Thành lập" />
                    <StatNumber num="10K+" label="Khách hàng tin dùng" />
                    <StatNumber num="100%" label="Chính hãng" />
                    <StatNumber num="24/7" label="Hỗ trợ" />
                </div>
            </div>

            {/* --- FOOTER --- */}
            <Footer/> 
        </div>
    );
};

// Component con cho các khối tính năng
const FeatureBlock = ({ icon: Icon, title, desc }) => (
   <div className="flex gap-4 p-4 rounded-xl transition-all duration-300 
            border border-transparent 
            hover:border-[#E2B657]/60 
            hover:shadow-[0_0_25px_rgba(226,182,87,0.6)] 
            hover:bg-white/5">

        <div className="mt-1">
            <div className="w-10 h-10 rounded-full bg-[#E2B657]/10 flex items-center justify-center text-[#E2B657]">
                <Icon size={20} />
            </div>
        </div>
        <div>
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

// Component con cho số liệu
const StatNumber = ({ num, label }) => (
    <div>
        <div className="text-3xl md:text-4xl font-black text-[#E2B657] mb-2">{num}</div>
        <div className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">{label}</div>
    </div>
     
);

