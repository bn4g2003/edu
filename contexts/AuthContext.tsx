'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, UserRole } from '@/types/user';

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<UserProfile>;
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
      // Tìm user trong Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserProfile;
      
      // Lưu vào localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUserProfile(userData);
      
      return userData;
    } catch (error: any) {
      throw new Error(error.message || 'Đăng nhập thất bại');
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
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
