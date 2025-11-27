'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, Plus, Edit2, Trash2, X, Save, Users, Search, Shield } from 'lucide-react';
import { Button } from '@/components/Button';
import { Department } from '@/types/department';
import { UserProfile } from '@/types/user';
import { DepartmentPermissions } from './DepartmentPermissions';

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [permissionDept, setPermissionDept] = useState<Department | null>(null);
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

  const handleSave = async () => {
    try {
      if (!formData.name) {
        alert('Vui lòng nhập tên phòng ban');
        return;
      }

      const deptId = editingDept?.id || `dept_${Date.now()}`;
      const manager = users.find(u => u.uid === formData.managerId);
      
      const deptData: any = {
        name: formData.name,
        description: formData.description,
        createdAt: editingDept?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Only add managerId and managerName if manager is selected
      if (formData.managerId && manager) {
        deptData.managerId = formData.managerId;
        deptData.managerName = manager.displayName;
      }

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
          <p className="text-slate-600">Quản lý các phòng ban trong công ty</p>
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
                  onClick={() => setPermissionDept(dept)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Phân quyền"
                >
                  <Shield size={18} />
                </button>
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
            {dept.managerName && (
              <p className="text-sm text-slate-500 mb-2">
                👤 Trưởng phòng: <span className="font-medium">{dept.managerName}</span>
              </p>
            )}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={16} />
                <span>{getStaffCount(dept.id)} nhân viên</span>
              </div>
              {dept.permissions && dept.permissions.length > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Shield size={14} />
                  <span className="font-medium">{dept.permissions.length} quyền</span>
                </div>
              )}
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
                  {users.map(user => (
                    <option key={user.uid} value={user.uid}>
                      {user.displayName} ({user.email})
                    </option>
                  ))}
                </select>
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

      {/* Permission Modal */}
      {permissionDept && (
        <DepartmentPermissions
          department={permissionDept}
          onClose={() => setPermissionDept(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};
