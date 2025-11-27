'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, Plus, Edit2, Trash2, X, Save, Users, Search, Shield } from 'lucide-react';
import { Button } from '@/components/Button';
import { Department } from '@/types/department';
import { UserProfile } from '@/types/user';


export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [viewStaffDept, setViewStaffDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterDepartments();
  }, [departments, searchTerm]);

  const filterDepartments = () => {
    let filtered = departments;

    if (searchTerm) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDepartments(filtered);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deptSnapshot = await getDocs(collection(db, 'departments'));
      const depts = deptSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Department[];
      setDepartments(depts);

      // Load users (staff only)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as UserProfile[];
      setUsers(usersData.filter(u => u.role === 'staff'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStaffCount = (deptId: string) => {
    return users.filter(u => u.departmentId === deptId).length;
  };

  const handleAdd = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', managerId: '' });
    setShowModal(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
      managerId: dept.managerId || '',
    });
    setShowModal(true);
  };

  const getUsersInDepartment = (deptId: string) => {
    // Lấy danh sách nhân viên trong phòng ban
    return users.filter(u => u.departmentId === deptId && u.approved);
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert('Vui lòng nhập tên phòng ban');
        return;
      }

      const deptId = editingDept?.id || `dept_${Date.now()}`;
      const manager = formData.managerId ? users.find(u => u.uid === formData.managerId) : null;
      
      const deptData: any = {
        name: formData.name,
        description: formData.description,
        managerId: formData.managerId || null,
        managerName: manager?.displayName || null,
        createdAt: editingDept?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'departments', deptId), deptData);
      
      alert(editingDept ? 'Cập nhật phòng ban thành công!' : 'Thêm phòng ban thành công!');
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Lỗi khi lưu phòng ban');
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Bạn có chắc muốn xóa phòng ban "${dept.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'departments', dept.id));
      alert('Xóa phòng ban thành công!');
      loadData();
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Lỗi khi xóa phòng ban');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý phòng ban</h1>
          <p className="text-slate-600">Chọn trưởng phòng từ danh sách nhân viên trong phòng ban</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={20} />
          Thêm phòng ban
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban theo tên, mô tả, trưởng phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng phòng ban</p>
          <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Có trưởng phòng</p>
          <p className="text-2xl font-bold text-purple-600">
            {departments.filter(d => d.managerId).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng nhân viên</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.length}
          </p>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((dept) => (
          <div key={dept.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(dept)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Chỉnh sửa"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(dept)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{dept.name}</h3>
            <p className="text-slate-600 text-sm mb-2 line-clamp-2">{dept.description}</p>
            {dept.managerName ? (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-500">👤 Trưởng phòng:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Users size={14} />
                  {dept.managerName}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  ⚠️ Chưa có trưởng phòng
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm mt-4">
              <button
                onClick={() => setViewStaffDept(dept)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Users size={16} />
                <span>{getStaffCount(dept.id)} nhân viên</span>
              </button>

            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">
            {searchTerm ? 'Không tìm thấy phòng ban nào' : 'Chưa có phòng ban nào'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                {editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên phòng ban</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ví dụ: Phòng Kỹ thuật"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Mô tả về phòng ban..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Trưởng phòng</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Chọn trưởng phòng --</option>
                  {editingDept && getUsersInDepartment(editingDept.id).map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.displayName} - {user.position || 'Nhân viên'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {editingDept 
                    ? `Chọn từ ${getUsersInDepartment(editingDept.id).length} nhân viên trong phòng`
                    : 'Lưu phòng ban trước, sau đó sửa để chọn trưởng phòng'}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <Button onClick={() => setShowModal(false)} className="flex-1 bg-slate-500 hover:bg-slate-600">
                Hủy
              </Button>
              <Button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
                <Save size={18} />
                Lưu
              </Button>
            </div>
          </div>
        </div>
      )}



      {/* View Staff Modal */}
      {viewStaffDept && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Danh sách nhân viên</h3>
                <p className="text-sm text-slate-600 mt-1">{viewStaffDept.name}</p>
              </div>
              <button 
                onClick={() => setViewStaffDept(null)} 
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {users.filter(u => u.departmentId === viewStaffDept.id).length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Chưa có nhân viên nào trong phòng ban này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users
                    .filter(u => u.departmentId === viewStaffDept.id)
                    .map((user) => (
                      <div 
                        key={user.uid} 
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{user.displayName}</h4>
                            <p className="text-sm text-slate-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {user.uid === viewStaffDept.managerId && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <Shield size={12} />
                              Trưởng phòng
                            </span>
                          )}
                          {user.monthlySalary && (
                            <p className="text-sm text-slate-600 mt-1">
                              {user.monthlySalary.toLocaleString('vi-VN')}đ/tháng
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Tổng số nhân viên: <strong className="text-slate-900">{users.filter(u => u.departmentId === viewStaffDept.id).length}</strong></span>
                <Button onClick={() => setViewStaffDept(null)} className="bg-slate-500 hover:bg-slate-600">
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
