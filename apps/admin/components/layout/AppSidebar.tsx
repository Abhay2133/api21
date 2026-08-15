'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarRail,
} from '../ui/sidebar';
import { LayoutDashboard, Terminal, Rocket, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const navItems = [
  {
    name: 'Overview',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Terminal',
    href: '/terminal',
    icon: Terminal,
  },
  {
    name: 'Deployments',
    href: '/deployments',
    icon: Rocket,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800/80 bg-slate-950/80">
      {/* Brand Header */}
      <SidebarHeader className="border-b border-slate-800/80 p-3.5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 text-slate-950 font-black text-base flex-shrink-0">
            21
          </div>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <div className="font-bold text-white tracking-tight flex items-center gap-1.5 text-sm truncate">
              api21 <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">ADMIN</span>
            </div>
            <div className="text-[11px] text-slate-500 truncate">System Control Panel</div>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav Menu Content */}
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[11px] font-semibold tracking-wider uppercase px-2 mb-1">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className="cursor-pointer"
                    >
                      <Link href={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Authenticated User Footer */}
      <SidebarFooter className="border-t border-slate-800/80 p-3 mt-auto">
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 overflow-hidden">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700 flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.username || 'Admin'}</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Authorized
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
