'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types/user';
import { SalaryRecord } from '@/types/salary';
import { Search, DollarSign, Calendar, Save, X } from 'lucide-react';
import { Button } from '@/components/Button';

export const SalaryManagementNew: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'calculated' | 'not-calculated'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    absentDays: 0,
    lateDays: 0,
    note: ''
  });

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load staff users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as UserProfile[];
      const staffUsers = usersData.filter(u => u.role === 'staff');
      setUsers(staffUsers);

      // Load salary records for selected month
      const salaryRef = collection(db, 'salaryRecords');
      const salaryQuery = query(salaryRef, where('month', '==', selectedMonth));
      const salarySnapshot = await getDocs(salaryQuery);
      const records = salarySnapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as SalaryRecord[];
      setSalaryRecords(records);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = (baseSalary: number, absentDays: number, lateDays: number) => {
    const workingDays = 26;
    const dailySalary = baseSalary / workingDays;
    const absentDeduction = dailySalary * absentDays;
    const lateDeduction = (dailySalary / 2) * lateDays; // Đi muộn trừ 50% lương ngày
    const totalDeduction = absentDeduction + lateDeduction;
    const finalSalary = baseSalary - totalDeduction;
    
    return {
      deduction: totalDeduction,
      finalSalary: Math.max(0, finalSalary)
    };
  };

  const handleEdit = (user: UserProfile) => {
    const existingRecord = salaryRecords.find(r => r.userId === user.uid);
    
    if (existingRecord) {
      setEditingRecord(existingRecord);
      setFormData({
        userId: user.uid,
        absentDays: existingRecord.absentDays,
        lateDays: existingRecord.lateDays,
        note: existingRecord.note || ''
      });
    } else {
      setEditingRecord(null);
      setFormData({
        userId: user.uid,
        absentDays: 0,
        lateDays: 0,
        note: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const user = users.find(u => u.uid === formData.userId);
      if (!user || !user.monthlySalary) {
        alert('Người dùng chưa có lương cơ bản');
        return;
      }

      const { deduction, finalSalary } = calculateSalary(
        user.monthlySalary,
        formData.absentDays,
        formData.lateDays
      );

      const recordId = `${formData.userId}_${selectedMonth}`;
      const recordData: any = {
        id: recordId,
        userId: user.uid,
        userName: user.displayName,
        month: selectedMonth,
        baseSalary: user.monthlySalary,
        workingDays: 26,
        absentDays: formData.absentDays,
        lateDays: formData.lateDays,
        deduction,
        finalSalary,
        createdAt: editingRecord?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Only add optional fields if they have values
      if (user.departmentId) {
        recordData.departmentId = user.departmentId;
      }
      if (formData.note) {
        recordData.note = formData.note;
      }

      await setDoc(doc(db, 'salaryRecords', recordId), recordData);
      alert('Lưu bảng lương thành công!');
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('Lỗi khi lưu bảng lương');
    }
  };

  const getSalaryRecord = (userId: string) => {
    return salaryRecords.find(r => r.userId === userId);
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;

    // Status filter
    const hasRecord = salaryRecords.some(r => r.userId === user.uid);
    if (filterStatus === 'calculated' && !hasRecord) return false;
    if (filterStatus === 'not-calculated' && hasRecord) return false;

    return true;
  });

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý lương</h2>
          <p className="text-slate-600 mt-1">Tính lương theo tháng (26 ngày công)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tất cả</option>
          <option value="calculated">Đã tính lương</option>
          <option value="not-calculated">Chưa tính lương</option>
        </select>
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng nhân viên</p>
          <p className="text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Đã tính lương</p>
          <p className="text-2xl font-bold text-green-600">{salaryRecords.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng lương cơ bản</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.reduce((sum, u) => sum + (u.monthlySalary || 0), 0).toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng lương thực nhận</p>
          <p className="text-2xl font-bold text-orange-600">
            {salaryRecords.reduce((sum, r) => sum + r.finalSalary, 0).toLocaleString('vi-VN')}đ
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Lương cơ bản</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ngày nghỉ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ngày đi muộn</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Trừ lương</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thực nhận</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((user) => {
              const record = getSalaryRecord(user.uid);
              const baseSalary = user.monthlySalary || 0;
              
              return (
                <tr key={user.uid} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.displayName}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">
                    {baseSalary.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record && record.absentDays > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {record?.absentDays || 0} ngày
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record && record.lateDays > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {record?.lateDays || 0} ngày
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">
                    -{(record?.deduction || 0).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 text-right text-green-600 font-bold">
                    {(record?.finalSalary || baseSalary).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      onClick={() => handleEdit(user)}
                      className="px-4 py-2 text-sm"
                    >
                      {record ? 'Sửa' : 'Nhập'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Nhập công lương</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhân viên</label>
                <input
                  type="text"
                  value={users.find(u => u.uid === formData.userId)?.displayName || ''}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
                <input
                  type="text"
                  value={selectedMonth}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số ngày nghỉ</label>
                  <input
                    type="number"
                    min="0"
                    max="26"
                    value={formData.absentDays}
                    onChange={(e) => setFormData({ ...formData, absentDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số ngày đi muộn</label>
                  <input
                    type="number"
                    min="0"
                    max="26"
                    value={formData.lateDays}
                    onChange={(e) => setFormData({ ...formData, lateDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              {/* Preview */}
              {(() => {
                const user = users.find(u => u.uid === formData.userId);
                if (!user || !user.monthlySalary) return null;
                
                const { deduction, finalSalary } = calculateSalary(
                  user.monthlySalary,
                  formData.absentDays,
                  formData.lateDays
                );

                return (
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Lương cơ bản:</span>
                      <span className="font-medium">{user.monthlySalary.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Trừ lương:</span>
                      <span className="font-medium text-red-600">-{deduction.toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                      <span>Thực nhận:</span>
                      <span className="text-green-600">{finalSalary.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                );
              })()}
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
