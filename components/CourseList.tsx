import React from 'react';
import { Star, User, Clock, ChevronRight } from 'lucide-react';
import { Button } from './Button';

const courses = [
  {
    id: 1,
    title: "Fullstack Web Development với React & Node.js",
    instructor: "Nguyễn Văn A",
    rating: 4.9,
    students: 12500,
    duration: "6 tháng",
    price: "2.499.000đ",
    image: "https://picsum.photos/400/250?random=1",
    tag: "Bestseller"
  },
  {
    id: 2,
    title: "Data Science & Machine Learning Masterclass",
    instructor: "Trần Thị B",
    rating: 4.8,
    students: 8300,
    duration: "4 tháng",
    price: "3.199.000đ",
    image: "https://picsum.photos/400/250?random=2",
    tag: "Trending"
  },
  {
    id: 3,
    title: "UI/UX Design: Tư duy thiết kế hiện đại",
    instructor: "Lê Văn C",
    rating: 4.9,
    students: 9100,
    duration: "3 tháng",
    price: "1.899.000đ",
    image: "https://picsum.photos/400/250?random=3",
    tag: "New"
  }
];

export const CourseList: React.FC = () => {
  return (
    <section id="courses" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">Khóa Học Nổi Bật</h2>
            <p className="mt-2 text-slate-600">Những khóa học được bình chọn tốt nhất tháng này.</p>
          </div>
          <Button variant="outline">
            Xem tất cả khóa học <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
              <div className="relative overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-48 object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-700 text-xs font-bold px-3 py-1 rounded-full">
                  {course.tag}
                </span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><User size={14} /> {course.instructor}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-1 mb-4">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-slate-900">{course.rating}</span>
                  <span className="text-slate-500 text-sm">({course.students.toLocaleString()} học viên)</span>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xl font-bold text-brand-600">{course.price}</span>
                  <button className="text-sm font-semibold text-slate-900 hover:text-brand-600 transition-colors">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};