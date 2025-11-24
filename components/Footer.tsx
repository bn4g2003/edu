import React from 'react';
import { BookOpen, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <img src="/logo.png" alt="Kama" className="h-10 w-auto" />
              <span className="text-xl font-bold">Kama</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nền tảng học tập trực tuyến hàng đầu, kết nối người học với tri thức nhân loại thông qua công nghệ AI tiên tiến.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Khám Phá</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Khóa học mới</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Sự kiện & Webinar</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Blog giáo dục</a></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Trở thành giảng viên</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="flex-shrink-0 text-brand-500" />
                <span>Tầng 12, Tòa nhà Bitexco, Q1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0 text-brand-500" />
                <span>+84 90 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="flex-shrink-0 text-brand-500" />
                <span>contact@kama.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
          © 2024 Kama Inc. All rights reserved. Designed for Excellence.
        </div>
      </div>
    </footer>
  );
};