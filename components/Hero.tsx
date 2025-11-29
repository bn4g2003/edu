import React from 'react';
import { Button } from './Button';
import { Play, ArrowRight, CheckCircle2, Star, Users } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id="about" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Dark Gradient Overlay for legibility and premium feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-brand-900/40"></div>
        
        {/* Tech Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-medium animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Nền tảng Đào Tạo Nội Bộ
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
              Đẩy Nhanh <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                Sự Nghiệp
              </span> <br/>
              Của Bạn
            </h1>
            
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              Không chỉ là thư viện video đơn thuần—đây là công cụ thúc đẩy sự nghiệp tối ưu cho mọi nhân viên. 
              Các khóa học thực hành giúp bạn nâng cao kỹ năng nhanh chóng, tự tin hơn trong công việc và nắm bắt cơ hội thăng tiến sớm hơn.
            </p>
            

          </div>

          {/* Visual Content */}
          <div className="relative hidden lg:block">
            {/* Main Image Card */}
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm group">
               <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1770&auto=format&fit=crop" 
                alt="Students learning" 
                className="w-full h-auto object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
              />
              
              {/* Overlay Content on Image */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-brand-400 font-semibold text-sm">Khóa học đang học</p>
                    <h3 className="text-white font-bold text-lg">Kỹ Năng Lãnh Đạo</h3>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg text-white">
                    <span className="font-bold">85%</span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-brand-500 h-1.5 rounded-full w-[85%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            {/* Floating Badge 1 */}
            <div className="absolute -right-8 top-10 z-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce duration-[4000ms]">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                  <Star className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Đánh giá</p>
                  <p className="text-lg font-bold text-slate-900">4.9 Stars</p>
                </div>
              </div>
            </div>

            {/* Floating Badge 2 */}
             <div className="absolute -left-8 bottom-20 z-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce duration-[5000ms] delay-500">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Nhân viên đang học</p>
                  <p className="text-lg font-bold text-slate-900">+2,500</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};