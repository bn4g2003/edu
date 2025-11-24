import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './Button';

const plans = [
  {
    name: "Cơ Bản",
    price: "0đ",
    description: "Trải nghiệm miễn phí các tính năng cơ bản.",
    features: ["Truy cập 5 khóa học miễn phí", "Cộng đồng hỗ trợ cơ bản", "Xem video HD 720p", "Hỗ trợ qua Email"],
    cta: "Đăng Ký Miễn Phí",
    variant: "secondary" as const
  },
  {
    name: "Chuyên Nghiệp",
    price: "199k",
    period: "/tháng",
    description: "Dành cho người học nghiêm túc muốn bứt phá.",
    features: ["Truy cập TOÀN BỘ khóa học", "AI Mentor hỗ trợ 24/7", "Chứng chỉ xác thực", "Tải video offline", "Hỗ trợ ưu tiên"],
    cta: "Thử Ngay 7 Ngày",
    variant: "primary" as const,
    popular: true
  },
  {
    name: "Doanh Nghiệp",
    price: "Liên hệ",
    description: "Giải pháp đào tạo nhân sự toàn diện.",
    features: ["Tài khoản quản trị viên", "Báo cáo tiến độ nhân viên", "Lộ trình đào tạo riêng", "Hỗ trợ kỹ thuật 1:1", "API tích hợp"],
    cta: "Liên Hệ Tư Vấn",
    variant: "secondary" as const
  }
];

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900">Đầu Tư Cho Tương Lai</h2>
          <p className="mt-4 text-slate-600">Chọn gói học tập phù hợp nhất với nhu cầu của bạn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className={`relative flex flex-col p-8 rounded-3xl ${plan.popular ? 'bg-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-slate-50 text-slate-900 border border-gray-100'}`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                  Phổ biến nhất
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>{plan.period}</span>}
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-brand-400' : 'text-brand-600'}`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.variant} 
                className={`w-full ${plan.popular ? 'bg-brand-600 hover:bg-brand-500 text-white border-none' : ''}`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};