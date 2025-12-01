'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/user';

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (email: string, password: string, displayName: string, role: UserRole, additionalInfo?: Partial<UserProfile>) => Promise<UserProfile>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra session từ localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUserProfile(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Bước 1: Thử đăng nhập qua API hệ thống nhân sự trước
      // API hỗ trợ cả employeeId (VD: NV001) và email
      let hrEmployee: any = null;
      try {
        const hrRes = await fetch('https://checkin-ten-gamma.vercel.app/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: email, password }), // API dùng employeeId, có thể là email hoặc mã NV
        });

        console.log('HR API response status:', hrRes.status);

        if (hrRes.ok) {
          const hrData = await hrRes.json();
          console.log('HR API response:', hrData);
          if (hrData.success && hrData.employee) {
            hrEmployee = hrData.employee;
          }
        } else if (hrRes.status === 401) {
          // Mật khẩu sai từ hệ thống HR - không throw, để fallback về local
          console.log('HR API: Invalid credentials, trying local auth');
        } else if (hrRes.status === 403) {
          const errorData = await hrRes.json();
          throw new Error(errorData.error || 'Tài khoản đã bị vô hiệu hóa');
        } else if (hrRes.status === 404) {
          // User không tồn tại trong HR - không throw, để fallback về local
          console.log('HR API: User not found, trying local auth');
        } else if (hrRes.status === 500) {
          // Lỗi server - fallback về local
          console.log('HR API: Server error (500), trying local auth');
        }
      } catch (err: any) {
        // Nếu lỗi từ HR API là lỗi nghiêm trọng (vô hiệu hóa), throw luôn
        if (err.message && err.message.includes('vô hiệu')) {
          throw err;
        }
        console.log('HR API không khả dụng hoặc lỗi, thử đăng nhập local:', err.message);
      }

      // Bước 2: Tìm user trong Firestore
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('email', '==', email));
      let querySnapshot = await getDocs(q);

      // Nếu có thông tin từ HR và chưa có user trong Firestore -> tạo mới
      if (querySnapshot.empty && hrEmployee) {
        const newUserId = `staff_${hrEmployee.id || Date.now()}`;
        const newUser: UserProfile = {
          uid: newUserId,
          email: hrEmployee.email,
          password: password,
          displayName: hrEmployee.fullName || hrEmployee.email,
          role: 'staff',
          approved: true,
          totalLearningHours: 0,
          phoneNumber: hrEmployee.phone,
          address: hrEmployee.address,
          country: hrEmployee.country,
          photoURL: hrEmployee.avatarURL,
          dateOfBirth: hrEmployee.birthday,
          monthlySalary: hrEmployee.baseSalary,
          employmentStatus: hrEmployee.employmentStatus,
          employmentStartDate: hrEmployee.startDate,
          employmentMaritalStatus: hrEmployee.maritalStatus,
          employmentBranch: hrEmployee.branch,
          employmentTeam: hrEmployee.team,
          employmentSalaryPercentage: hrEmployee.salaryPercentage,
          employmentActive: hrEmployee.active,
          employment: hrEmployee,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'users', newUserId), newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        setUserProfile(newUser);
        return newUser;
      }

      // Nếu không có user và không có HR data -> kiểm tra password local
      if (querySnapshot.empty) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      const userDoc = querySnapshot.docs[0];
      let userData = userDoc.data() as UserProfile;

      // Nếu không có HR data, kiểm tra password local
      if (!hrEmployee && userData.password !== password) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      
      // Kiểm tra tài khoản đã được duyệt chưa (trừ admin)
      if (userData.role !== 'admin' && userData.approved === false) {
        throw new Error('Tài khoản của bạn chưa được duyệt. Vui lòng liên hệ quản trị viên.');
      }
      
      // Nếu có HR data, cập nhật thông tin
      if (hrEmployee) {
        const updateData: Record<string, unknown> = {
          employment: hrEmployee,
          password: password, // Cập nhật password từ HR
          updatedAt: new Date(),
        };

        if (hrEmployee.phone) updateData.phoneNumber = hrEmployee.phone;
        if (hrEmployee.address) updateData.address = hrEmployee.address;
        if (hrEmployee.country) updateData.country = hrEmployee.country;
        if (hrEmployee.avatarURL) updateData.photoURL = hrEmployee.avatarURL;
        if (hrEmployee.birthday) updateData.dateOfBirth = hrEmployee.birthday;
        if (typeof hrEmployee.baseSalary === 'number') updateData.monthlySalary = hrEmployee.baseSalary;
        if (hrEmployee.employmentStatus) updateData.employmentStatus = hrEmployee.employmentStatus;
        if (hrEmployee.startDate) updateData.employmentStartDate = hrEmployee.startDate;
        if (hrEmployee.maritalStatus) updateData.employmentMaritalStatus = hrEmployee.maritalStatus;
        if (hrEmployee.branch) updateData.employmentBranch = hrEmployee.branch;
        if (hrEmployee.team) updateData.employmentTeam = hrEmployee.team;
        if (typeof hrEmployee.salaryPercentage === 'number') updateData.employmentSalaryPercentage = hrEmployee.salaryPercentage;
        if (typeof hrEmployee.active === 'boolean') updateData.employmentActive = hrEmployee.active;

        await updateDoc(userDoc.ref, updateData);

        userData = {
          ...userData,
          ...updateData,
        } as UserProfile;
      }

      // Lưu vào localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUserProfile(userData);
      
      return userData;
    } catch (error: any) {
      throw new Error(error.message || 'Đăng nhập thất bại');
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole, additionalInfo?: Partial<UserProfile>) => {
    try {
      // Kiểm tra email đã tồn tại chưa
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('Email đã được sử dụng');
      }

      // Tạo user mới
      const newUser: UserProfile = {
        uid: `user_${Date.now()}`,
        email: email,
        password: password,
        displayName: displayName,
        role: role,
        approved: role === 'admin' ? true : false, // Admin tự động duyệt, còn lại cần duyệt
        ...additionalInfo, // Thêm các thông tin bổ sung
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Lưu vào Firestore
      await setDoc(doc(db, 'users', newUser.uid), newUser);

      // Lưu vào localStorage
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setUserProfile(newUser);

      return newUser;
    } catch (error: any) {
      throw new Error(error.message || 'Đăng ký thất bại');
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('currentUser');
      setUserProfile(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const value = {
    userProfile,
    loading,
    signIn,
    signUp,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
