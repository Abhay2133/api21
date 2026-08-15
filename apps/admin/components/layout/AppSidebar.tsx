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
  SidebarSeparator,
} from '../ui/sidebar';
import {
  LayoutDashboard,
  Terminal,
  Rocket,
  LogOut,
  ChevronsUpDown,
  Layers,
  ChevronRight,
  Server,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const mainNavItems = [
  {
    title: 'Overview',
    url: '/overview',
    icon: LayoutDashboard,
    badge: 'Live',
  },
  {
    title: 'Terminal',
    url: '/terminal',
    icon: Terminal,
    badge: 'PTY',
  },
  {
    title: 'Deployments',
    url: '/deployments',
    icon: Rocket,
    badge: '14',
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
    <Sidebar collapsible="icon" className="border-r border-slate-800/60 bg-[#070b12] text-slate-200">
      {/* 1. Shadcn Team/Project Switcher Header */}
      <SidebarHeader className="p-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors cursor-pointer select-none">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-sky-500/20 flex-shrink-0">
            21
          </div>
          <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
              api21
              <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                v1.0
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">System Control Panel</div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 ml-auto group-data-[collapsible=icon]:hidden flex-shrink-0" />
        </div>
      </SidebarHeader>

      {/* 2. Compact Nav Menu */}
      <SidebarContent className="px-2 py-2 gap-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2 h-6 mb-1">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      size="sm"
                      className="h-8 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80 data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:font-medium data-[active=true]:shadow-sm data-[active=true]:border-slate-700/60"
                    >
                      <Link href={item.url} className="flex items-center gap-2.5 w-full">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                        <span className="truncate flex-1">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono group-data-[collapsible=icon]:hidden ${
                              isActive
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-slate-800/80 text-slate-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-slate-800/60 my-1" />

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2 h-6 mb-1">
            Infrastructure
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  tooltip="API Documentation"
                  className="h-8 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80"
                >
                  <a
                    href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 w-full"
                  >
                    <Server className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate flex-1">API Docs</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 ml-auto group-data-[collapsible=icon]:hidden" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="sm"
                  tooltip="BullMQ Queues"
                  className="h-8 px-2.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900/80"
                >
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/admin/queues`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 w-full"
                  >
                    <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate flex-1">BullMQ Dashboard</span>
                    <ChevronRight className="w-3 h-3 text-slate-600 ml-auto group-data-[collapsible=icon]:hidden" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Shadcn User Profile Footer */}
      <SidebarFooter className="p-2 border-t border-slate-800/60 mt-auto">
        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-900/60 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700/60 flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.username || 'admin'}</div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                authorized
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors group-data-[collapsible=icon]:hidden flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
