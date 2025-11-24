'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { UserProfile } from '@/types/user';
import { Search, Plus, Edit2, Trash2, X, Save, BookOpen, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { CourseStudents } from './CourseStudents';

export const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingCourse, setManagingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teacherId: '',
    teacherName: '',
    category: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: 0,
    price: 0,
    thumbnail: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const coursesRef = collection(db, 'courses');
      const coursesSnapshot = await getDocs(coursesRef);
      const coursesData = coursesSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Course[];
      setCourses(coursesData);

      const usersRef = collection(db, 'users');
      const teachersQuery = query(usersRef, where('role', '==', 'teacher'));
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachersData = teachersSnapshot.docs.map(doc => doc.data()) as UserProfile[];
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  };

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      teacherId: '',
      teacherName: '',
      category: '',
      level: 'beginner',
      duration: 0,
      price: 0,
      thumbnail: ''
    });
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      thumbnail: course.thumbnail
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.teacherId || !formData.category) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const teacher = teachers.find(t => t.uid === formData.teacherId);
      if (!teacher) {
        alert('Giáo viên không hợp lệ');
        return;
      }

      if (editingCourse) {
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, {
          ...formData,
          teacherName: teacher.displayName,
          updatedAt: new Date()
        });
        alert('Cập nhật khóa học thành công!');
      } else {
        const newCourse = {
          id: `course_${Date.now()}`,
          ...formData,
          teacherName: teacher.displayName,
          students: [],
          pendingStudents: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(doc(db, 'courses', newCourse.id), newCourse);
        alert('Thêm khóa học thành công!');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Lỗi khi lưu khóa học');
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Bạn có chắc muốn xóa khóa học "${course.title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', course.id));
      alert('Xóa khóa học thành công!');
      loadData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Lỗi khi xóa khóa học');
    }
  };

  const getLevelBadge = (level: string) => {
    const styles = {
      beginner: 'bg-green-100 text-green-700',
      intermediate: 'bg-yellow-100 text-yellow-700',
      advanced: 'bg-red-100 text-red-700'
    };
    const labels = {
      beginner: 'Cơ bản',
      intermediate: 'Trung cấp',
      advanced: 'Nâng cao'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level as keyof typeof styles]}`}>
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Quản lý khóa học</h2>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={18} />
          Thêm khóa học
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng khóa học</p>
          <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Cơ bản</p>
          <p className="text-2xl font-bold text-green-600">{courses.filter(c => c.level === 'beginner').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Trung cấp</p>
          <p className="text-2xl font-bold text-yellow-600">{courses.filter(c => c.level === 'intermediate').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Nâng cao</p>
          <p className="text-2xl font-bold text-red-600">{courses.filter(c => c.level === 'advanced').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-16 h-16 text-white" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 line-clamp-2">{course.title}</h3>
                {getLevelBadge(course.level)}
              </div>
              <p className="text-sm text-slate-600 mb-2 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                <span>👨‍🏫 {course.teacherName}</span>
                <div className="flex items-center gap-2">
                  <span>👥 {course.students?.length || 0}</span>
                  {course.pendingStudents && course.pendingStudents.length > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      +{course.pendingStudents.length} chờ
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-slate-600">⏱️ {course.duration}h</span>
                <span className="font-bold text-brand-600">{course.price.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setManagingCourse(course)}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center gap-1"
                >
                  <Users size={14} />
                  Học sinh
                </button>
                <button
                  onClick={() => handleEdit(course)}
                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(course)}
                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên khóa học *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giáo viên phụ trách *</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Chọn giáo viên</option>
                    {teachers.map(teacher => (
                      <option key={teacher.uid} value={teacher.uid}>{teacher.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="VD: Lập trình, Thiết kế..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cấp độ</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="beginner">Cơ bản</option>
                    <option value="intermediate">Trung cấp</option>
                    <option value="advanced">Nâng cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời lượng (giờ)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giá (VNĐ)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL Thumbnail</label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
                <Save size={18} />
                Lưu
              </Button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Students Management Modal */}
      {managingCourse && (
        <CourseStudents
          course={managingCourse}
          onClose={() => setManagingCourse(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};
