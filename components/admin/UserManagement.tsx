'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/user';
import { Search, Plus, Edit2, Trash2, X, Save, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Button } from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

interface Department {
  id: string;
  name: string;
}

export const UserManagement: React.FC = () => {
  const { userProfile: currentUser } = useAuth(); // User hiện tại đang đăng nhập
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'staff' as UserRole,
    departmentId: '',
    monthlySalary: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterDepartment]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load users
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as UserProfile[];
      setUsers(usersData);

      // Load departments
      const deptSnapshot = await getDocs(collection(db, 'departments'));
      const depts = deptSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    // Chỉ lấy user đã duyệt hoặc admin
    let filtered = users.filter(user => user.role === 'admin' || user.approved);

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Department filter
    if (filterDepartment !== 'all') {
      if (filterDepartment === 'none') {
        filtered = filtered.filter(user => !user.departmentId);
      } else {
        filtered = filtered.filter(user => user.departmentId === filterDepartment);
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  // Lấy danh sách chờ duyệt
  const pendingUsers = users.filter(user => user.role !== 'admin' && !user.approved);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      role: 'staff',
      departmentId: '',
      monthlySalary: 0
    });
    setShowModal(true);
  };

  const handleEdit = (user: UserProfile) => {
    // Không cho sửa admin
    if (user.role === 'admin') {
      alert('Không thể chỉnh sửa tài khoản Admin!');
      return;
    }
    
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: user.password,
      displayName: user.displayName,
      role: user.role,
      departmentId: user.departmentId || '',
      monthlySalary: user.monthlySalary || 0
    });
    setShowModal(true);
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return '-';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '-';
  };

  const handleSave = async () => {
    try {
      if (!formData.email || !formData.password || !formData.displayName) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
      }

      if (editingUser) {
        // Update existing user - Find document by uid field
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', editingUser.uid));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          alert('Không tìm thấy người dùng!');
          return;
        }

        const userDocId = snapshot.docs[0].id;
        const userRef = doc(db, 'users', userDocId);
        
        const updateData: any = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          updatedAt: new Date()
        };

        // Only add departmentId and monthlySalary if they have values
        if (formData.departmentId) {
          updateData.departmentId = formData.departmentId;
        }
        if (formData.monthlySalary && formData.monthlySalary > 0) {
          updateData.monthlySalary = formData.monthlySalary;
        }

        await updateDoc(userRef, updateData);
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

        // Add new user with uid as custom field
        const newUserId = `user_${Date.now()}`;
        const newUser: any = {
          uid: newUserId,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          approved: formData.role === 'admin' ? true : false, // Admin tự động duyệt
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Only add departmentId and monthlySalary if they have values
        if (formData.departmentId) {
          newUser.departmentId = formData.departmentId;
        }
        if (formData.monthlySalary && formData.monthlySalary > 0) {
          newUser.monthlySalary = formData.monthlySalary;
        }

        // Use setDoc with custom ID instead of addDoc
        await setDoc(doc(db, 'users', newUserId), newUser);
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
    // Không cho xóa admin
    if (user.role === 'admin') {
      alert('Không thể xóa tài khoản Admin!');
      return;
    }

    // Không cho tự xóa chính mình
    if (user.uid === currentUser?.uid) {
      alert('Không thể xóa chính tài khoản của bạn!');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa người dùng "${user.displayName}"?`)) {
      return;
    }

    try {
      // Find document by uid field
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Không tìm thấy người dùng!');
        return;
      }

      const userDocId = snapshot.docs[0].id;
      await deleteDoc(doc(db, 'users', userDocId));
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

  const handleApprove = async (user: UserProfile, approve: boolean) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Không tìm thấy người dùng!');
        return;
      }

      const userDocId = snapshot.docs[0].id;
      const userRef = doc(db, 'users', userDocId);
      
      await updateDoc(userRef, {
        approved: approve,
        updatedAt: new Date()
      });

      alert(approve ? 'Đã duyệt tài khoản!' : 'Đã từ chối tài khoản!');
      loadUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Lỗi khi duyệt tài khoản');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="p-8 space-y-6">
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
          <option value="teacher">Giáo viên</option>
          <option value="student">Học viên</option>
        </select>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả phòng ban</option>
          <option value="none">Chưa có phòng ban</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng số</p>
          <p className="text-2xl font-bold text-slate-900">{users.filter(u => u.role === 'admin' || u.approved).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Chờ duyệt</p>
          <p className="text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Admin</p>
          <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Nhân viên</p>
          <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'staff' && u.approved).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Giáo viên</p>
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'teacher' && u.approved).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Học viên</p>
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'student' && u.approved).length}</p>
        </div>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <XCircle className="text-orange-600" size={24} />
              <h3 className="text-lg font-bold text-orange-900">
                Tài khoản chờ duyệt ({pendingUsers.length})
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-orange-100 border-b border-orange-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-900 uppercase">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-900 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-900 uppercase">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-orange-900 uppercase">Ngày đăng ký</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-orange-900 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {pendingUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-orange-50">
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
                        onClick={() => handleApprove(user, true)}
                        className="text-green-600 hover:text-green-800 mr-3 inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-lg font-medium"
                        title="Duyệt tài khoản"
                      >
                        <CheckCircle size={16} />
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1 px-3 py-1 bg-red-100 rounded-lg font-medium"
                        title="Từ chối"
                      >
                        <Trash2 size={16} />
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Users Table */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Danh sách người dùng</h3>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phòng ban</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Lương tháng</th>
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
                    {getDepartmentName(user.departmentId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-slate-900 font-medium">
                    {user.monthlySalary ? `${user.monthlySalary.toLocaleString('vi-VN')}đ` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {user.createdAt?.toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {user.role === 'admin' ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-sm">
                        <Shield size={14} />
                        <span className="font-medium">Được bảo vệ</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                  <option value="teacher">Giáo viên</option>
                  <option value="student">Học viên</option>
                </select>
              </div>

              {formData.role === 'staff' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phòng ban</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lương tháng (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.monthlySalary}
                      onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Ví dụ: 10000000"
                    />
                  </div>
                </>
              )}
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
