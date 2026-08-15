'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../../components/layout/Sidebar';
import { useAuthStore } from '../../store/useAuthStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isCheckingAuth, checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth().then((authed) => {
      if (!authed) {
        router.replace('/login');
      }
    });
  }, [checkAuth, router]);

  if (!mounted || isCheckingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#090d16]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Verifying administrative credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-[#090d16]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
