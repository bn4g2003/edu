'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Department } from '@/types/department';
import { PERMISSIONS, PermissionAction } from '@/types/permission';
import { Shield, Save, X } from 'lucide-react';
import { Button } from '@/components/Button';

interface DepartmentPermissionsProps {
  department: Department;
  onClose: () => void;
  onUpdate: () => void;
}

export const DepartmentPermissions: React.FC<DepartmentPermissionsProps> = ({
  department,
  onClose,
  onUpdate
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionAction[]>(
    department.permissions || []
  );
  const [saving, setSaving] = useState(false);

  const togglePermission = (permission: PermissionAction) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const deptRef = doc(db, 'departments', department.id);
      await updateDoc(deptRef, {
        permissions: selectedPermissions,
        updatedAt: new Date()
      });
      alert('Cập nhật quyền thành công!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Lỗi khi cập nhật quyền');
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setSelectedPermissions(PERMISSIONS.map(p => p.action));
  };

  const clearAll = () => {
    setSelectedPermissions([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Phân quyền phòng ban</h3>
              <p className="text-sm text-slate-600">{department.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-3">
          <button
            onClick={selectAll}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
          >
            Chọn tất cả
          </button>
          <button
            onClick={clearAll}
            className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Bỏ chọn tất cả
          </button>
          <div className="ml-auto text-sm text-slate-600 flex items-center">
            Đã chọn: <span className="font-bold ml-1">{selectedPermissions.length}/{PERMISSIONS.length}</span>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PERMISSIONS.map((permission) => {
              const isSelected = selectedPermissions.includes(permission.action);
              return (
                <label
                  key={permission.id}
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePermission(permission.action)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-1">
                      {permission.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {permission.description}
                    </div>
                    <div className="mt-2">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                        {permission.action}
                      </code>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu quyền'}
          </Button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium text-slate-700"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};
