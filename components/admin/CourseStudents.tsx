'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { UserProfile } from '@/types/user';
import { Search, UserPlus, UserCheck, UserX, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

interface CourseStudentsProps {
  course: Course;
  onClose: () => void;
  onUpdate: () => void;
}

export const CourseStudents: React.FC<CourseStudentsProps> = ({ course, onClose, onUpdate }) => {
  const { userProfile: currentUser } = useAuth();
  const [allStudents, setAllStudents] = useState<UserProfile[]>([]);
  const [pendingStudents, setPendingStudents] = useState<UserProfile[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<UserProfile[]>([]);
  const [availableStudents, setAvailableStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [course]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const allUsersData = snapshot.docs.map(doc => doc.data()) as UserProfile[];

      // Filter for staff and student roles only
      let studentsData = allUsersData.filter(u => u.role === 'staff' || u.role === 'student');

      // Nếu không phải admin, chỉ hiển thị nhân viên trong phòng của trưởng phòng
      if (currentUser?.role !== 'admin' && currentUser?.position === 'Trưởng phòng' && currentUser?.departmentId) {
        studentsData = studentsData.filter(u => u.departmentId === currentUser.departmentId);
      }

      setAllStudents(studentsData);

      const pending = studentsData.filter(s => course.pendingStudents?.includes(s.uid));
      const enrolled = studentsData.filter(s => course.students?.includes(s.uid));
      const available = studentsData.filter(s =>
        !course.students?.includes(s.uid) && !course.pendingStudents?.includes(s.uid)
      );

      setPendingStudents(pending);
      setEnrolledStudents(enrolled);
      setAvailableStudents(available);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      setProcessing(studentId);
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        pendingStudents: arrayRemove(studentId),
        students: arrayUnion(studentId)
      });
      alert('Đã phê duyệt nhân viên!');
      onUpdate();
      loadStudents();
    } catch (error) {
      console.error('Error approving:', error);
      alert('Lỗi khi phê duyệt');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (studentId: string) => {
    try {
      setProcessing(studentId);
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        pendingStudents: arrayRemove(studentId)
      });
      alert('Đã từ chối yêu cầu!');
      onUpdate();
      loadStudents();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert('Lỗi khi từ chối');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa học sinh này khỏi khóa học?')) return;

    try {
      setProcessing(studentId);
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        students: arrayRemove(studentId)
      });
      alert('Đã xóa nhân viên!');
      onUpdate();
      loadStudents();
    } catch (error) {
      console.error('Error removing:', error);
      alert('Lỗi khi xóa học sinh');
    } finally {
      setProcessing(null);
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      setProcessing(studentId);
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        students: arrayUnion(studentId)
      });
      alert('Đã thêm nhân viên vào khóa học!');
      onUpdate();
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Lỗi khi thêm học sinh');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6">
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#311898] border border-white/10 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">{course.title}</h3>
            <p className="text-slate-300">Quản lý nhân viên</p>
            {currentUser?.role !== 'admin' && currentUser?.position === 'Trưởng phòng' && (
              <p className="text-sm text-[#53cafd] mt-1">
                🏢 Chỉ hiển thị nhân viên trong phòng ban của bạn
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Pending Approvals */}
        {pendingStudents.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-sm border border-yellow-500/30">
                {pendingStudents.length}
              </span>
              Chờ phê duyệt
            </h4>
            <div className="space-y-2">
              {pendingStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.displayName}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(student.uid)}
                      disabled={processing === student.uid}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg hover:bg-green-500/30 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <UserCheck size={14} />
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(student.uid)}
                      disabled={processing === student.uid}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <UserX size={14} />
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enrolled Students */}
        <div className="mb-6">
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-sm border border-green-500/30">
              {enrolledStudents.length}
            </span>
            Đã đăng ký
          </h4>
          {enrolledStudents.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Chưa có nhân viên nào</p>
          ) : (
            <div className="space-y-2">
              {enrolledStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.displayName}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(student.uid)}
                    disabled={processing === student.uid}
                    className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-1 text-sm"
                  >
                    <UserX size={14} />
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Students */}
        <div>
          <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span className="bg-[#53cafd]/20 text-[#53cafd] px-2 py-1 rounded-full text-sm border border-[#53cafd]/30">
              {availableStudents.length}
            </span>
            Thêm nhân viên
          </h4>
          {availableStudents.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Không còn nhân viên nào</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{student.displayName}</p>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student.uid)}
                    disabled={processing === student.uid}
                    className="px-3 py-1.5 bg-[#53cafd] text-white rounded-lg hover:bg-[#3db9f5] disabled:opacity-50 flex items-center gap-1 text-sm shadow-[#53cafd]/25"
                  >
                    <UserPlus size={14} />
                    Thêm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <Button onClick={onClose} className="w-full bg-[#53cafd] hover:bg-[#3db9f5] border-none text-white shadow-[#53cafd]/25">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
