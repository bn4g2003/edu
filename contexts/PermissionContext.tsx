'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { PermissionAction, DEFAULT_ROLES } from '@/types/permission';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface PermissionContextType {
  permissions: PermissionAction[];
  hasPermission: (action: PermissionAction) => boolean;
  hasAnyPermission: (actions: PermissionAction[]) => boolean;
  hasAllPermissions: (actions: PermissionAction[]) => boolean;
  loading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [permissions, setPermissions] = useState<PermissionAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, [userProfile]);

  const loadPermissions = async () => {
    try {
      setLoading(true);

      if (!userProfile) {
        setPermissions([]);
        return;
      }

      // Admin có tất cả quyền
      if (userProfile.role === 'admin') {
        setPermissions(DEFAULT_ROLES.ADMIN.permissions);
        return;
      }

      // Staff: Load permissions từ phòng ban
      if (userProfile.role === 'staff') {
        if (userProfile.departmentId) {
          const deptSnapshot = await getDocs(
            query(collection(db, 'departments'), where('__name__', '==', userProfile.departmentId))
          );
          
          if (!deptSnapshot.empty) {
            const deptData = deptSnapshot.docs[0].data();
            const deptPermissions = deptData.permissions || [];

            // Check if user is department manager
            if (deptData.managerId === userProfile.uid) {
              // Manager: Kết hợp quyền phòng ban + quyền manager mặc định
              const managerPerms = [...new Set([...deptPermissions, ...DEFAULT_ROLES.MANAGER.permissions])];
              setPermissions(managerPerms);
              return;
            }

            // Staff: Chỉ có quyền của phòng ban (không fallback)
            setPermissions(deptPermissions);
            return;
          }
        }
        
        // Staff không có phòng ban hoặc phòng ban không tồn tại → Không có quyền gì
        setPermissions([]);
        return;
      }

      // Default: no permissions
      setPermissions([]);
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (action: PermissionAction): boolean => {
    return permissions.includes(action);
  };

  const hasAnyPermission = (actions: PermissionAction[]): boolean => {
    return actions.some(action => permissions.includes(action));
  };

  const hasAllPermissions = (actions: PermissionAction[]): boolean => {
    return actions.every(action => permissions.includes(action));
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        loading
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
