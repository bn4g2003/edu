'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { UserProfile } from '@/types/user';
import { UserPlus, X, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/Button';

interface CourseStudentManagementProps {
  course: Course;
  onUpdate: () => void;
}

export const CourseStudentManagement: React.FC<CourseStudentManagementProps> = ({ 
  course, 
  onUpdate 
}) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [courseStudents, setCourseStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [course.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all users (không phân biệt role)
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as UserProfile[];
      setAllUsers(usersData);

      // Load current course students
      const currentStudentIds = course.students || [];
      const currentStudents = usersData.filter(user => currentStudentIds.includes(user.uid));
      setCourseStudents(currentStudents);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudents = async () => {
    if (selectedUserIds.length === 0) {
      alert('Vui lòng chọn ít nhất một người');
      return;
    }

    try {
      const courseRef = doc(db, 'courses', course.id);
      
      // Thêm từng user vào mảng students
      for (const userId of selectedUserIds) {
        await updateDoc(courseRef, {
          students: arrayUnion(userId),
          updatedAt: new Date()
        });
      }

      alert(`Đã thêm ${selectedUserIds.length} học viên vào khóa học!`);
      setShowModal(false);
      setSelectedUserIds([]);
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error adding students:', error);
      alert('Lỗi khi thêm học viên');
    }
  };

  const handleRemoveStudent = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa học viên này khỏi khóa học?')) {
      return;
    }

    try {
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        students: arrayRemove(userId),
        updatedAt: new Date()
      });

      alert('Đã xóa học viên khỏi khóa học!');
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Lỗi khi xóa học viên');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const availableUsers = allUsers.filter(user => 
    !courseStudents.some(cs => cs.uid === user.uid) &&
    (user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={24} />
            Học viên trong khóa học
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Quản lý học viên đã tham gia khóa học này
          </p>
        </div>
        <Button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2"
        >
          <UserPlus size={18} />
          Thêm học viên
        </Button>
      </div>

      {/* Current Students List */}
      {courseStudents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Chưa có học viên nào trong khóa học</p>
          <p className="text-sm text-slate-500 mt-1">Nhấn "Thêm học viên" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseStudents.map((student) => (
            <div 
              key={student.uid}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{student.displayName}</h4>
                  <p className="text-sm text-slate-600 mt-1">{student.email}</p>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                    student.role === 'student' ? 'bg-green-100 text-green-700' :
                    student.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                    student.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {student.role === 'student' ? 'Học viên' :
                     student.role === 'staff' ? 'Nhân viên' :
                     student.role === 'teacher' ? 'Giáo viên' :
                     student.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveStudent(student.uid)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa khỏi khóa học"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Students Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Thêm học viên vào khóa học</h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedUserIds([]);
                  setSearchTerm('');
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {availableUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng khả dụng'}
                </div>
              ) : (
                availableUsers.map((user) => (
                  <label
                    key={user.uid}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedUserIds.includes(user.uid)
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.uid)}
                      onChange={() => toggleUserSelection(user.uid)}
                      className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{user.displayName}</div>
                      <div className="text-sm text-slate-600">{user.email}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'student' ? 'bg-green-100 text-green-700' :
                      user.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'admin' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'student' ? 'Học viên' :
                       user.role === 'staff' ? 'Nhân viên' :
                       user.role === 'teacher' ? 'Giáo viên' :
                       user.role === 'admin' ? 'Admin' :
                       user.role}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button 
                onClick={handleAddStudents} 
                className="flex-1"
                disabled={selectedUserIds.length === 0}
              >
                Thêm {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
              </Button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUserIds([]);
                  setSearchTerm('');
                }}
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
