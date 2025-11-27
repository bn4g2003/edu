'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { Search, Plus, Edit2, Trash2, X, Save, BookOpen, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/Button';
import { CourseDetailPage } from './CourseDetailPage';
import { CourseStudentManagement } from './CourseStudentManagement';
import { BunnyImageUpload } from '@/components/shared/BunnyImageUpload';
import { BunnyVideoUpload } from '@/components/shared/BunnyVideoUpload';

interface CourseManagementProps {
  onNavigateToApproval?: () => void;
}

export const CourseManagement: React.FC<CourseManagementProps> = ({ onNavigateToApproval }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [managingStudentsCourse, setManagingStudentsCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: 0,
    price: 0,
    thumbnail: '',
    demoVideoId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterLevel, filterCategory]);

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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel !== 'all') {
      filtered = filtered.filter(course => course.level === filterLevel);
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(course => course.category === filterCategory);
    }

    setFilteredCourses(filtered);
  };

  const getCategories = () => {
    const cats = new Set(courses.map(c => c.category));
    return Array.from(cats).sort();
  };

  const categories = getCategories();

  const handleAdd = () => {
    setEditingCourse(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      level: 'beginner',
      duration: 0,
      price: 0,
      thumbnail: '',
      demoVideoId: ''
    });
    setShowModal(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      thumbnail: course.thumbnail,
      demoVideoId: course.demoVideoId || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.category) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      if (editingCourse) {
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration: formData.duration,
          price: formData.price,
          thumbnail: formData.thumbnail,
          demoVideoId: formData.demoVideoId,
          updatedAt: new Date()
        });
        alert('Cập nhật khóa học thành công!');
      } else {
        const newCourse = {
          id: `course_${Date.now()}`,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration: formData.duration,
          price: formData.price,
          thumbnail: formData.thumbnail,
          demoVideoId: formData.demoVideoId,
          teacherId: 'admin',
          teacherName: 'Admin',
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

  // Show course detail page
  if (detailCourse) {
    return (
      <CourseDetailPage
        course={detailCourse}
        onBack={() => setDetailCourse(null)}
        isAdmin={true}
      />
    );
  }

  // Show student management page
  if (managingStudentsCourse) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setManagingStudentsCourse(null);
            loadData();
          }}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-medium"
        >
          ← Quay lại danh sách khóa học
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{managingStudentsCourse.title}</h2>
          <p className="text-slate-600">{managingStudentsCourse.description}</p>
        </div>
        <CourseStudentManagement 
          course={managingStudentsCourse} 
          onUpdate={loadData}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Quản lý khóa học</h2>
        <div className="flex gap-3">
          {onNavigateToApproval && (
            <Button 
              onClick={onNavigateToApproval} 
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
            >
              <Users size={18} />
              Duyệt khóa học
              {courses.filter(c => c.pendingStudents && c.pendingStudents.length > 0).length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                  {courses.filter(c => c.pendingStudents && c.pendingStudents.length > 0).length}
                </span>
              )}
            </Button>
          )}
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={18} />
            Thêm khóa học
          </Button>
        </div>
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
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả cấp độ</option>
          <option value="beginner">Cơ bản</option>
          <option value="intermediate">Trung cấp</option>
          <option value="advanced">Nâng cao</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
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

      {/* Course List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Khóa học
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cấp độ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Học viên
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Thời lượng
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{course.title}</div>
                      <div className="text-sm text-slate-500 line-clamp-1">{course.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {course.category}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {getLevelBadge(course.level)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium text-slate-900">{course.students?.length || 0}</span>
                      {course.pendingStudents && course.pendingStudents.length > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          +{course.pendingStudents.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-slate-900">
                    {course.duration}h
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                    {course.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailCourse(course)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                        title="Chi tiết lớp học"
                      >
                        <BookOpen size={16} />
                        Chi tiết
                      </button>
                      <button
                        onClick={() => setManagingStudentsCourse(course)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                        title="Thêm học viên"
                      >
                        <UserPlus size={16} />
                        Thêm HV
                      </button>
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Không tìm thấy khóa học nào</p>
          </div>
        )}
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

              <BunnyImageUpload
                label="Thumbnail (Ảnh đại diện)"
                currentImage={formData.thumbnail}
                onUploadComplete={(url) => setFormData({ ...formData, thumbnail: url })}
                folder="courses/thumbnails"
              />

              <BunnyVideoUpload
                label="Video Demo (Video giới thiệu khóa học)"
                currentVideoId={formData.demoVideoId}
                onUploadComplete={(videoId) => setFormData({ ...formData, demoVideoId: videoId })}
              />
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

    </div>
  );
};
