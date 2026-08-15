'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../../components/ui/sidebar';
import { AppSidebar } from '../../components/layout/AppSidebar';
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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {/* Header Mobile / Responsive Trigger Bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800/80 px-4 md:hidden bg-slate-950/60 backdrop-blur-md">
          <SidebarTrigger />
          <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
            api21 <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">ADMIN</span>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
