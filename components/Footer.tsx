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
              Nền tảng đào tạo nội bộ giúp nhân viên phát triển kỹ năng, nâng cao năng lực và thăng tiến trong sự nghiệp.
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
              <li><a href="#" className="hover:text-brand-400 transition-colors">Khóa học đào tạo</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Lộ trình phát triển</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Tin tức nội bộ</a></li>
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Hướng dẫn sử dụng</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Chính sách nội bộ</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Liên hệ IT Support</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="flex-shrink-0 text-brand-500" />
                <span>Phòng Đào Tạo - Tầng 5</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="flex-shrink-0 text-brand-500" />
                <span>Ext: 1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="flex-shrink-0 text-brand-500" />
                <span>training@company.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-slate-500">
          © 2024 Nền Tảng Đào Tạo Nội Bộ. Phát triển nhân viên - Thúc đẩy sự nghiệp.
        </div>
      </div>
    </footer>
  );
};