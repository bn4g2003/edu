import React from 'react';
import { Brain, Globe, Video, Award, Users, Zap } from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    title: "AI Mentor 1:1",
    description: "Trợ lý ảo phân tích điểm mạnh, điểm yếu và thiết kế lộ trình học riêng biệt cho bạn.",
    color: "bg-purple-500"
  },
  {
    icon: <Video className="w-6 h-6 text-white" />,
    title: "Bài Giảng 4K",
    description: "Chất lượng video sắc nét, âm thanh sống động giúp tăng sự tập trung và hứng thú.",
    color: "bg-blue-500"
  },
  {
    icon: <Globe className="w-6 h-6 text-white" />,
    title: "Học Mọi Nơi",
    description: "Đồng bộ hóa tiến độ trên mọi thiết bị. Học trên xe bus, quán cafe hay tại nhà.",
    color: "bg-green-500"
  },
  {
    icon: <Users className="w-6 h-6 text-white" />,
    title: "Cộng Đồng Sôi Nổi",
    description: "Kết nối với hàng triệu học viên, thảo luận và làm bài tập nhóm dễ dàng.",
    color: "bg-orange-500"
  },
  {
    icon: <Award className="w-6 h-6 text-white" />,
    title: "Chứng Chỉ Uy Tín",
    description: "Hoàn thành khóa học và nhận chứng chỉ có giá trị, liên kết với LinkedIn.",
    color: "bg-red-500"
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Cập Nhật Liên Tục",
    description: "Nội dung khóa học luôn được làm mới theo xu hướng công nghệ mới nhất.",
    color: "bg-yellow-500"
  }
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-brand-600 uppercase tracking-wide">Tại sao chọn EduPro?</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Công Nghệ Giáo Dục Đỉnh Cao
          </p>
          <p className="mt-4 max-w-2xl text-xl text-slate-500 mx-auto">
            Chúng tôi không chỉ bán khóa học, chúng tôi mang đến một hệ sinh thái học tập toàn diện giúp bạn bứt phá.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative bg-slate-50 p-8 rounded-2xl hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
              <div className={`inline-flex items-center justify-center p-3 rounded-xl shadow-lg mb-6 ${feature.color} transform group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};