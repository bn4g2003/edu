import React from 'react';
import { Brain, Globe, Video, Award, Users, Zap } from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    title: "Học Thực Hành",
    description: "Các khóa học tập trung vào kỹ năng thực tế, áp dụng ngay vào công việc hàng ngày.",
    color: "bg-purple-500"
  },
  {
    icon: <Video className="w-6 h-6 text-white" />,
    title: "Video Chất Lượng Cao",
    description: "Nội dung được sản xuất chuyên nghiệp, dễ hiểu và thu hút người học.",
    color: "bg-blue-500"
  },
  {
    icon: <Globe className="w-6 h-6 text-white" />,
    title: "Học Mọi Lúc Mọi Nơi",
    description: "Truy cập khóa học 24/7 trên mọi thiết bị, phù hợp với lịch làm việc của bạn.",
    color: "bg-green-500"
  },
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Học Theo Phòng Ban",
    description: "Khóa học được phân bổ theo phòng ban, phù hợp với nhu cầu công việc cụ thể.",
    color: "bg-orange-500"
  },
  {
    icon: <Award className="w-6 h-6 text-white" />,
    title: "Theo Dõi Tiến Độ",
    description: "Hệ thống theo dõi chi tiết giúp bạn và quản lý nắm rõ quá trình học tập.",
    color: "bg-red-500"
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Nâng Cao Nhanh Chóng",
    description: "Đầu tư vào kỹ năng hôm nay, thăng tiến sự nghiệp ngày mai.",
    color: "bg-yellow-500"
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-[#53cafd] uppercase tracking-wide">Tại sao chọn chúng tôi?</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Nền Tảng Đào Tạo Nội Bộ Toàn Diện
          </p>
          <p className="mt-4 max-w-2xl text-xl text-slate-300 mx-auto">
            Không chỉ là thư viện video—đây là công cụ thúc đẩy sự nghiệp cho mọi nhân viên trong tổ chức.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-[#5e3ed0]/20 backdrop-blur-md p-8 rounded-2xl hover:bg-[#5e3ed0]/30 hover:shadow-xl transition-all duration-300 border border-white/10 hover:border-[#53cafd]/50">
              <div className={`inline-flex items-center justify-center p-3 rounded-xl shadow-lg mb-6 ${feature.color} transform group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#53cafd] transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};