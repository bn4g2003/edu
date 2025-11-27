'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/user';
import { Search, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { Button } from '@/components/Button';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'staff' as UserRole
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as UserProfile[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'staff'
    });
    setShowModal(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: user.password,
      displayName: user.displayName,
      role: user.role
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.email || !formData.password || !formData.displayName) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
      }

      if (editingUser) {
        // Update existing user
        const userRef = doc(db, 'users', editingUser.uid);
        await updateDoc(userRef, {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          updatedAt: new Date()
        });
        alert('Cập nhật người dùng thành công!');
      } else {
        // Check if email exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', formData.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          alert('Email đã tồn tại!');
          return;
        }

        // Add new user
        const newUser = {
          uid: `user_${Date.now()}`,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await addDoc(collection(db, 'users'), newUser);
        alert('Thêm người dùng thành công!');
      }

      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Lỗi khi lưu người dùng');
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.displayName}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      alert('Xóa người dùng thành công!');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Lỗi khi xóa người dùng');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      admin: 'bg-red-100 text-red-700',
      staff: 'bg-blue-100 text-blue-700',
      student: 'bg-green-100 text-green-700'
    };
    const labels = {
      admin: 'Admin',
      staff: 'Nhân viên',
      student: 'Học sinh'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h2>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus size={18} />
          Thêm người dùng
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="staff">Nhân viên</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng số</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Admin</p>
          <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Nhân viên</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'staff').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vai trò</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày tạo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((user) => (
              <tr key={user.uid} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-900">{user.displayName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  {user.createdAt?.toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Admin</option>
                </select>
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
    </div>
  );
};
