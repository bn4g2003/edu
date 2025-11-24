'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types/course';
import { UserProfile } from '@/types/user';
import { Search, UserPlus, UserCheck, UserX, X } from 'lucide-react';
import { Button } from '@/components/Button';

interface CourseStudentsProps {
  course: Course;
  onClose: () => void;
  onUpdate: () => void;
}

export const CourseStudents: React.FC<CourseStudentsProps> = ({ course, onClose, onUpdate }) => {
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
      const q = query(usersRef, where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      const studentsData = snapshot.docs.map(doc => doc.data()) as UserProfile[];
      
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
      alert('Đã phê duyệt học sinh!');
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
      alert('Đã xóa học sinh!');
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
      alert('Đã thêm học sinh vào khóa học!');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{course.title}</h3>
            <p className="text-slate-600">Quản lý học sinh</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Pending Approvals */}
        {pendingStudents.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-sm">
                {pendingStudents.length}
              </span>
              Chờ phê duyệt
            </h4>
            <div className="space-y-2">
              {pendingStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{student.displayName}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(student.uid)}
                      disabled={processing === student.uid}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1 text-sm"
                    >
                      <UserCheck size={14} />
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReject(student.uid)}
                      disabled={processing === student.uid}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1 text-sm"
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
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
              {enrolledStudents.length}
            </span>
            Đã đăng ký
          </h4>
          {enrolledStudents.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Chưa có học sinh nào</p>
          ) : (
            <div className="space-y-2">
              {enrolledStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{student.displayName}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(student.uid)}
                    disabled={processing === student.uid}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1 text-sm"
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
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm">
              {availableStudents.length}
            </span>
            Thêm học sinh
          </h4>
          {availableStudents.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Không còn học sinh nào</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableStudents.map((student) => (
                <div key={student.uid} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{student.displayName}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddStudent(student.uid)}
                    disabled={processing === student.uid}
                    className="px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-1 text-sm"
                  >
                    <UserPlus size={14} />
                    Thêm
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <Button onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
