'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/user';
import { AttendanceRecord, MonthlySalary, CompanySettings } from '@/types/attendance';
import { Search, Calendar, Clock, Settings, Wifi, Save, X, Plus, Trash2, Eye, ChevronLeft, Users } from 'lucide-react';
import { Button } from '@/components/Button';

interface Department {
  id: string;
  name: string;
  managerId?: string;
}

export const AttendanceManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [monthlySalaries, setMonthlySalaries] = useState<MonthlySalary[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [photoModal, setPhotoModal] = useState<{ url: string; type: string; time: string; userName: string } | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'workDays' | 'workHours' | 'lateMinutes'>('name');

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Check if current user is a department manager
  const isManager = userProfile?.position === 'Trưởng phòng';
  const isAdmin = userProfile?.role === 'admin';
  const managedDepartment = departments.find(d => d.managerId === userProfile?.uid);

  useEffect(() => { loadData(); }, [selectedMonth]);

  // ESC key to close photo modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && photoModal) setPhotoModal(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [photoModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load departments
      const deptSnapshot = await getDocs(collection(db, 'departments'));
      const deptData = deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Department[];
      setDepartments(deptData);

      // Load company settings
      const settingsSnapshot = await getDocs(collection(db, 'companySettings'));
      if (!settingsSnapshot.empty) {
        setCompanySettings({ ...settingsSnapshot.docs[0].data(), createdAt: settingsSnapshot.docs[0].data().createdAt?.toDate(), updatedAt: settingsSnapshot.docs[0].data().updatedAt?.toDate() } as CompanySettings);
      }

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt?.toDate(), updatedAt: doc.data().updatedAt?.toDate() })) as UserProfile[];
      usersData = usersData.filter(u => u.role === 'staff');
      setUsers(usersData);

      // Load attendance records
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = `${year}-${month}-31`;
      const attendanceRef = collection(db, 'attendanceRecords');
      const attendanceQuery = query(attendanceRef, where('date', '>=', startDate), where('date', '<=', endDate));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      setAttendanceRecords(attendanceSnapshot.docs.map(doc => ({ ...doc.data(), checkInTime: doc.data().checkInTime?.toDate(), checkOutTime: doc.data().checkOutTime?.toDate() })) as AttendanceRecord[]);

      // Load monthly salaries
      const salaryRef = collection(db, 'monthlySalaries');
      const salaryQuery = query(salaryRef, where('month', '==', selectedMonth));
      const salarySnapshot = await getDocs(salaryQuery);
      setMonthlySalaries(salarySnapshot.docs.map(doc => ({ ...doc.data() })) as MonthlySalary[]);
    } catch (error) { console.error('Error loading data:', error); } finally { setLoading(false); }
  };

  // Filter users based on role (manager sees only their department)
  const getFilteredUsers = () => {
    let filtered = users;
    
    // If manager, only show users from their department
    if (isManager && managedDepartment) {
      filtered = users.filter(u => u.departmentId === managedDepartment.id);
    }
    
    // Apply department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(u => u.departmentId === filterDepartment);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = attendanceRecords.find(r => r.userId === user.uid && r.date === today);
        
        if (filterStatus === 'checked-in') return !!todayRecord;
        if (filterStatus === 'not-checked-in') return !todayRecord;
        if (filterStatus === 'late') return todayRecord?.status === 'late';
        if (filterStatus === 'on-time') return todayRecord?.status === 'present';
        return true;
      });
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.displayName.localeCompare(b.displayName);
      }
      
      const aRecords = attendanceRecords.filter(r => r.userId === a.uid);
      const bRecords = attendanceRecords.filter(r => r.userId === b.uid);
      
      if (sortBy === 'workDays') {
        const aWorkDays = aRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const bWorkDays = bRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        return bWorkDays - aWorkDays;
      }
      
      if (sortBy === 'workHours') {
        const aWorkHours = aRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
        const bWorkHours = bRecords.reduce((sum, r) => sum + (r.workHours || 0), 0);
        return bWorkHours - aWorkHours;
      }
      
      if (sortBy === 'lateMinutes') {
        const aLateMinutes = aRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
        const bLateMinutes = bRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
        return bLateMinutes - aLateMinutes;
      }
      
      return 0;
    });
    
    return sorted;
  };

  const filteredUsers = getFilteredUsers();

  const calculateMonthlySalary = (userId: string): MonthlySalary | null => {
    const user = users.find(u => u.uid === userId);
    if (!user || !user.monthlySalary) return null;
    const userRecords = attendanceRecords.filter(r => r.userId === userId);
    const presentDays = userRecords.filter(r => r.status === 'present').length;
    const lateDays = userRecords.filter(r => r.status === 'late').length;
    const halfDays = userRecords.filter(r => r.status === 'half-day').length;
    const workingDays = companySettings?.workingDaysPerMonth || 26;
    const absentDays = Math.max(0, workingDays - presentDays - lateDays - halfDays);
    const dailySalary = user.monthlySalary / workingDays;
    const totalDeduction = (dailySalary * absentDays) + (dailySalary * 0.5 * lateDays) + (dailySalary * 0.5 * halfDays);
    const finalSalary = Math.max(0, user.monthlySalary - totalDeduction);
    return { id: `${userId}_${selectedMonth}`, userId, userName: user.displayName, departmentId: user.departmentId, month: selectedMonth, baseSalary: user.monthlySalary, workingDays, presentDays, absentDays, lateDays, halfDays, totalDeduction, finalSalary, createdAt: new Date(), updatedAt: new Date() };
  };

  const handleSaveSalary = async (userId: string) => {
    try {
      const salary = calculateMonthlySalary(userId);
      if (!salary) { alert('Không thể tính lương'); return; }
      await setDoc(doc(db, 'monthlySalaries', salary.id), salary);
      alert('Lưu thành công!'); loadData();
    } catch (error) { console.error('Error:', error); alert('Lỗi khi lưu'); }
  };

  const handleSaveSettings = async (settings: Partial<CompanySettings>) => {
    try {
      const settingsId = companySettings?.id || 'default';
      await setDoc(doc(db, 'companySettings', settingsId), { ...settings, id: settingsId, updatedAt: new Date(), createdAt: companySettings?.createdAt || new Date() });
      alert('Lưu cài đặt thành công!'); setShowSettingsModal(false); loadData();
    } catch (error) { console.error('Error:', error); alert('Lỗi khi lưu cài đặt'); }
  };

  const getUserAttendanceStats = (userId: string) => {
    const userRecords = attendanceRecords.filter(r => r.userId === userId);
    return { present: userRecords.filter(r => r.status === 'present').length, late: userRecords.filter(r => r.status === 'late').length, halfDay: userRecords.filter(r => r.status === 'half-day').length };
  };

  // View employee attendance history
  if (selectedUserId) {
    const selectedUser = users.find(u => u.uid === selectedUserId);
    const userRecords = attendanceRecords.filter(r => r.userId === selectedUserId).sort((a, b) => b.date.localeCompare(a.date));
    const salary = calculateMonthlySalary(selectedUserId);

    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedUserId(null)} className="p-2 hover:bg-slate-100 rounded-lg"><ChevronLeft size={24} /></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedUser?.displayName}</h2>
            <p className="text-slate-600">{selectedUser?.email}</p>
          </div>
        </div>

        {salary && (
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Tổng kết tháng {selectedMonth}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80">Ngày đi làm</p>
                <p className="text-2xl font-bold">{salary.presentDays + salary.lateDays}</p>
                <p className="text-xs opacity-70 mt-1">ngày</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80">Tổng phút muộn</p>
                <p className="text-2xl font-bold">{userRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0)}</p>
                <p className="text-xs opacity-70 mt-1">phút</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80">Nửa ngày</p>
                <p className="text-2xl font-bold">{userRecords.filter(r => r.status === 'half-day').length}</p>
                <p className="text-xs opacity-70 mt-1">ngày</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80">Ngày nghỉ</p>
                <p className="text-2xl font-bold">{salary.absentDays}</p>
                <p className="text-xs opacity-70 mt-1">ngày</p>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <p className="text-sm opacity-80">Lương thực nhận</p>
                <p className="text-2xl font-bold">{salary.finalSalary.toLocaleString('vi-VN')}</p>
                <p className="text-xs opacity-70 mt-1">VNĐ</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200"><h3 className="font-semibold text-slate-900">Lịch sử chấm công</h3></div>
          {userRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Chưa có dữ liệu chấm công</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {userRecords.map((record) => (
                <div key={record.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><Calendar className="text-slate-600" size={20} /></div>
                      <div>
                        <p className="font-medium text-slate-900">{new Date(record.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-slate-500">Check-in: {record.checkInTime?.toLocaleTimeString('vi-VN')}{record.checkOutTime && ` | Check-out: ${record.checkOutTime.toLocaleTimeString('vi-VN')}`}{record.workHours && ` | ${record.workHours} giờ`}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${record.status === 'present' ? 'bg-green-100 text-green-700' : record.status === 'late' ? 'bg-yellow-100 text-yellow-700' : record.status === 'half-day' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {record.status === 'present' ? 'Đúng giờ' : record.status === 'late' ? `Muộn ${record.lateMinutes}p` : record.status === 'half-day' ? 'Nửa ngày' : 'Vắng'}
                    </span>
                  </div>
                  {/* Photos */}
                  {(record.checkInPhoto || record.checkOutPhoto) && (
                    <div className="flex gap-4 ml-16">
                      {record.checkInPhoto && (
                        <div className="text-center">
                          <img 
                            src={record.checkInPhoto} 
                            alt="Check-in" 
                            onClick={() => setPhotoModal({ 
                              url: record.checkInPhoto!, 
                              type: 'Check-in', 
                              time: record.checkInTime?.toLocaleString('vi-VN') || '', 
                              userName: record.userName 
                            })}
                            className="w-20 h-20 rounded-lg object-cover border-2 border-green-200 cursor-pointer hover:scale-105 transition-transform" 
                          />
                          <p className="text-xs text-slate-500 mt-1">Check-in</p>
                        </div>
                      )}
                      {record.checkOutPhoto && (
                        <div className="text-center">
                          <img 
                            src={record.checkOutPhoto} 
                            alt="Check-out" 
                            onClick={() => setPhotoModal({ 
                              url: record.checkOutPhoto!, 
                              type: 'Check-out', 
                              time: record.checkOutTime?.toLocaleString('vi-VN') || '', 
                              userName: record.userName 
                            })}
                            className="w-20 h-20 rounded-lg object-cover border-2 border-orange-200 cursor-pointer hover:scale-105 transition-transform" 
                          />
                          <p className="text-xs text-slate-500 mt-1">Check-out</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Photo Modal for detail view */}
        {photoModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPhotoModal(null)}>
            <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setPhotoModal(null)} 
                className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg"
              >
                <X size={24} />
                <span>Đóng (ESC)</span>
              </button>
              <div className="bg-white rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white">
                  <h3 className="text-xl font-bold">{photoModal.userName}</h3>
                  <p className="text-sm text-slate-300">{photoModal.type} - {photoModal.time}</p>
                </div>
                <div className="p-4 bg-slate-50">
                  <img 
                    src={photoModal.url} 
                    alt={photoModal.type} 
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý chấm công</h2>
          <p className="text-slate-600 mt-1">
            {isManager && managedDepartment ? `Phòng ban: ${managedDepartment.name}` : 'Theo dõi chấm công và tính lương nhân viên'}
          </p>
        </div>
        {/* Only show settings button for admin, not for managers */}
        {isAdmin && (
          <Button onClick={() => setShowSettingsModal(true)} className="flex items-center gap-2">
            <Settings size={18} /> Cài đặt
          </Button>
        )}
      </div>

      {/* Manager info banner */}
      {isManager && managedDepartment && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="text-purple-600" size={20} />
            <div>
              <p className="font-medium text-purple-900">Trưởng phòng {managedDepartment.name}</p>
              <p className="text-sm text-purple-700">Bạn chỉ có thể xem chấm công của nhân viên trong phòng ban mình</p>
            </div>
          </div>
        </div>
      )}

      {companySettings && isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Wifi className="text-blue-600 mt-1" size={20} />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Cài đặt công ty</p>
              <p className="text-sm text-blue-700 mt-1">Giờ làm: {companySettings.workStartTime} - {companySettings.workEndTime} | Ngày công: {companySettings.workingDaysPerMonth} | IP: {companySettings.allowedIPs?.length || 0} địa chỉ</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {/* Filters and Search */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Tìm kiếm nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" />
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Phòng ban:</label>
            <select 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">Tất cả</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Trạng thái:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="all">Tất cả</option>
              <option value="checked-in">Đã chấm công hôm nay</option>
              <option value="not-checked-in">Chưa chấm công hôm nay</option>
              <option value="on-time">Đúng giờ hôm nay</option>
              <option value="late">Đi muộn hôm nay</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Sắp xếp:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="name">Tên A-Z</option>
              <option value="workDays">Ngày làm nhiều nhất</option>
              <option value="workHours">Giờ làm nhiều nhất</option>
              <option value="lateMinutes">Đi muộn nhiều nhất</option>
            </select>
          </div>

          {(filterDepartment !== 'all' || filterStatus !== 'all' || sortBy !== 'name') && (
            <button
              onClick={() => {
                setFilterDepartment('all');
                setFilterStatus('all');
                setSortBy('name');
              }}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng nhân viên</p>
          <p className="text-2xl font-bold text-slate-900">{filteredUsers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Đã chấm công hôm nay</p>
          <p className="text-2xl font-bold text-green-600">{attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && filteredUsers.some(u => u.uid === r.userId)).length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Tổng lương tháng</p>
          <p className="text-2xl font-bold text-blue-600">{filteredUsers.reduce((sum, u) => sum + (u.monthlySalary || 0), 0).toLocaleString('vi-VN')}đ</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Đã tính lương</p>
          <p className="text-2xl font-bold text-orange-600">{monthlySalaries.filter(s => filteredUsers.some(u => u.uid === s.userId)).length}</p>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nhân viên</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Hôm nay</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Ngày đi làm</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tổng giờ làm</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Tổng phút muộn</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Lương cơ bản</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thực nhận</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredUsers.map((user) => {
              const stats = getUserAttendanceStats(user.uid);
              const salary = calculateMonthlySalary(user.uid);
              const savedSalary = monthlySalaries.find(s => s.userId === user.uid);
              const today = new Date().toISOString().split('T')[0];
              const todayRecord = attendanceRecords.find(r => r.userId === user.uid && r.date === today);
              
              return (
                <tr key={user.uid} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{user.displayName}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {todayRecord ? (
                      <div className="flex items-center justify-center gap-2">
                        {todayRecord.checkInPhoto && (
                          <img 
                            src={todayRecord.checkInPhoto} 
                            alt="Check-in" 
                            onClick={() => setPhotoModal({ 
                              url: todayRecord.checkInPhoto!, 
                              type: 'Check-in', 
                              time: todayRecord.checkInTime?.toLocaleString('vi-VN') || '', 
                              userName: user.displayName 
                            })}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-green-300 cursor-pointer hover:scale-110 transition-transform" 
                          />
                        )}
                        {todayRecord.checkOutPhoto && (
                          <img 
                            src={todayRecord.checkOutPhoto} 
                            alt="Check-out" 
                            onClick={() => setPhotoModal({ 
                              url: todayRecord.checkOutPhoto!, 
                              type: 'Check-out', 
                              time: todayRecord.checkOutTime?.toLocaleString('vi-VN') || '', 
                              userName: user.displayName 
                            })}
                            className="w-10 h-10 rounded-lg object-cover border-2 border-orange-300 cursor-pointer hover:scale-110 transition-transform" 
                          />
                        )}
                        {!todayRecord.checkInPhoto && !todayRecord.checkOutPhoto && (
                          <span className="text-xs text-slate-400">Không có ảnh</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-xs text-slate-400">Chưa chấm công</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {stats.present + stats.late} ngày
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {attendanceRecords.filter(r => r.userId === user.uid).reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1)} giờ
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stats.late > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                      {attendanceRecords.filter(r => r.userId === user.uid).reduce((sum, r) => sum + (r.lateMinutes || 0), 0)} phút
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">{(user.monthlySalary || 0).toLocaleString('vi-VN')}đ</td>
                  <td className="px-6 py-4 text-right text-green-600 font-bold">{(savedSalary?.finalSalary || salary?.finalSalary || 0).toLocaleString('vi-VN')}đ</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => setSelectedUserId(user.uid)} className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"><Eye size={16} /></button>
                    {isAdmin && <Button onClick={() => handleSaveSalary(user.uid)} className="px-3 py-1.5 text-sm" disabled={!salary}>{savedSalary ? 'Cập nhật' : 'Tính lương'}</Button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-slate-500">Không có nhân viên nào</div>
        )}
      </div>

      {showSettingsModal && <SettingsModal settings={companySettings} onSave={handleSaveSettings} onClose={() => setShowSettingsModal(false)} />}
      
      {/* Photo Modal */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPhotoModal(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPhotoModal(null)} 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-lg"
            >
              <X size={24} />
              <span>Đóng (ESC)</span>
            </button>
            <div className="bg-white rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white">
                <h3 className="text-xl font-bold">{photoModal.userName}</h3>
                <p className="text-sm text-slate-300">{photoModal.type} - {photoModal.time}</p>
              </div>
              <div className="p-4 bg-slate-50">
                <img 
                  src={photoModal.url} 
                  alt={photoModal.type} 
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Modal with improved IP management
interface SettingsModalProps {
  settings: CompanySettings | null;
  onSave: (settings: Partial<CompanySettings>) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [ipList, setIpList] = useState<string[]>(settings?.allowedIPs || []);
  const [bulkIPText, setBulkIPText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(settings?.workStartTime || '08:00');
  const [workEndTime, setWorkEndTime] = useState(settings?.workEndTime || '17:00');
  const [lateThreshold, setLateThreshold] = useState(settings?.lateThresholdMinutes || 15);
  const [workingDays, setWorkingDays] = useState(settings?.workingDaysPerMonth || 26);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [loadingIP, setLoadingIP] = useState(false);

  useEffect(() => {
    fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => setCurrentIP(data.ip)).catch(() => {}).finally(() => setLoadingIP(false));
    setLoadingIP(true);
  }, []);

  const handleAddIP = (ip: string) => {
    const trimmed = ip.trim();
    if (trimmed && !ipList.includes(trimmed)) setIpList([...ipList, trimmed]);
  };

  const handleRemoveIP = (ip: string) => setIpList(ipList.filter(i => i !== ip));

  const handleBulkAdd = () => {
    const newIPs = bulkIPText.split('\n').map(ip => ip.trim()).filter(ip => ip && !ipList.includes(ip));
    if (newIPs.length > 0) {
      setIpList([...ipList, ...newIPs]);
      setBulkIPText('');
      setShowBulkInput(false);
    }
  };

  const handleSubmit = () => {
    onSave({ allowedIPs: ipList, workStartTime, workEndTime, lateThresholdMinutes: lateThreshold, workingDaysPerMonth: workingDays });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Cài đặt công ty</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* IP Management */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2"><Wifi size={20} className="text-brand-600" /> Địa chỉ IP công ty</h4>
              <button onClick={() => setShowBulkInput(!showBulkInput)} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                {showBulkInput ? 'Đóng' : '+ Thêm nhiều IP'}
              </button>
            </div>
            
            {/* Current IP */}
            <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">IP hiện tại của bạn</p>
                  <p className="font-mono text-lg font-bold text-slate-900">{loadingIP ? 'Đang tải...' : currentIP || 'Không xác định'}</p>
                </div>
                <Button onClick={() => handleAddIP(currentIP)} disabled={!currentIP || ipList.includes(currentIP)} className="flex items-center gap-2">
                  <Plus size={16} /> Thêm IP này
                </Button>
              </div>
            </div>

            {/* Bulk IP Input */}
            {showBulkInput && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                <p className="text-sm font-medium text-slate-700 mb-2">Nhập nhiều IP (mỗi IP một dòng)</p>
                <textarea
                  value={bulkIPText}
                  onChange={(e) => setBulkIPText(e.target.value)}
                  placeholder="192.168.1.1&#10;203.0.113.50&#10;10.0.0.1"
                  rows={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-sm resize-none"
                />
                <div className="flex justify-end mt-3">
                  <Button onClick={handleBulkAdd} disabled={!bulkIPText.trim()} className="flex items-center gap-2">
                    <Plus size={16} /> Thêm tất cả
                  </Button>
                </div>
              </div>
            )}

            {/* IP List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Danh sách IP được phép ({ipList.length})</p>
              {ipList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300">Chưa có IP nào</div>
              ) : (
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {ipList.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"><Wifi size={16} className="text-green-600" /></div>
                        <span className="font-mono text-slate-900">{ip}</span>
                        {ip === currentIP && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">IP hiện tại</span>}
                      </div>
                      <button onClick={() => handleRemoveIP(ip)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Work Hours */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Clock size={20} className="text-brand-600" /> Giờ làm việc</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Giờ bắt đầu</label>
                <input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Giờ kết thúc</label>
                <input type="time" value={workEndTime} onChange={(e) => setWorkEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg" />
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Settings size={20} className="text-brand-600" /> Cài đặt khác</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cho phép đi muộn (phút)</label>
                <input type="number" min="0" max="60" value={lateThreshold} onChange={(e) => setLateThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-xs text-slate-500 mt-1">Số phút được phép đến muộn</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Số ngày công/tháng</label>
                <input type="number" min="1" max="31" value={workingDays} onChange={(e) => setWorkingDays(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-xs text-slate-500 mt-1">Số ngày công chuẩn để tính lương</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <Button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-3"><Save size={18} /> Lưu cài đặt</Button>
          <button onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium">Hủy</button>
        </div>
      </div>
    </div>
  );
};
