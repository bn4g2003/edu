"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Auth } from '@/components/Auth';
import { ChatbaseWidget } from '@/components/ChatbaseWidget';
import { useAuth } from '@/contexts/AuthContext';

type ViewState = 'home' | 'login' | 'register';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const { userProfile, loading } = useAuth();

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'login' || currentView === 'register') {
    return (
      <Auth 
        initialMode={currentView} 
        onBack={() => handleViewChange('home')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-brand-500 selection:text-white text-black">
      <Navbar 
        onLogin={() => handleViewChange('login')} 
        onRegister={() => handleViewChange('register')}
        onNavigateHome={() => handleViewChange('home')}
      />
      <main>
        <Hero />
      </main>
      <ChatbaseWidget />
    </div>
  );
};

export default App;