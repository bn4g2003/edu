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
              Nền tảng EdTech số 1 Việt Nam
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
              Đánh Thức <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
                Tiềm Năng Vô Hạn
              </span> <br/>
              Của Bạn
            </h1>
            
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              Học tập chủ động với lộ trình được cá nhân hóa bởi AI. 
              Kết nối với chuyên gia đầu ngành và nhận chứng chỉ quốc tế ngay hôm nay.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Button variant="primary" size="lg" className="group bg-brand-600 hover:bg-brand-500 border-0 shadow-brand-500/50 shadow-lg">
                Bắt Đầu Miễn Phí
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <button className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-full border border-white/30 hover:bg-white/10 transition-all backdrop-blur-sm group">
                <div className="w-8 h-8 rounded-full bg-white text-brand-900 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                   <Play className="w-3 h-3 fill-current translate-x-0.5" />
                </div>
                Video Giới Thiệu
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-300 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
                <span>Lộ trình AI 1:1</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
                <span>Chứng chỉ thực</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img key={i} className="w-6 h-6 rounded-full border border-slate-900" src={`https://picsum.photos/50/50?random=${i + 10}`} alt="Student" />
                  ))}
                </div>
                <div className="flex gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-white">4.9/5</span>
                </div>
              </div>
            </div>
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
                    <p className="text-brand-400 font-semibold text-sm">Khóa học đang diễn ra</p>
                    <h3 className="text-white font-bold text-lg">Data Science Masterclass</h3>
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
                  <p className="text-xs text-slate-500 font-medium">Học viên mới</p>
                  <p className="text-lg font-bold text-slate-900">+12,500</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};