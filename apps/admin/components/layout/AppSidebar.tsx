'use client';

import React, { useState } from 'react';
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../ui/alert-dialog';
import {
  LayoutDashboard,
  Terminal,
  ShieldCheck,
  Rocket,
  LogOut,
  ChevronsUpDown,
  Layers,
  ChevronRight,
  Server,
  AlertTriangle,
  UserCog,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const mainNavItems = [
  {
    title: 'Overview',
    url: '/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Terminal',
    url: '/terminal',
    icon: Terminal,
  },
  {
    title: 'Sessions',
    url: '/sessions',
    icon: ShieldCheck,
  },
  {
    title: 'Users',
    url: '/users',
    icon: UserCog,
  },
  {
    title: 'Deployments',
    url: '/deployments',
    icon: Rocket,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-zinc-800 bg-[#09090b] text-zinc-200">
        {/* 1. Minimal Shadcn Team/Project Switcher Header */}
        <SidebarHeader className="h-14 flex items-center justify-center p-2 border-b border-zinc-800">
          <div className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer select-none w-full">
            <div className="size-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-xs flex-shrink-0">
              21
            </div>
            <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-semibold text-zinc-100 truncate leading-none">
                api21
              </div>
              <div className="text-xs text-zinc-400 truncate mt-1 leading-none">System Control Panel</div>
            </div>
            <ChevronsUpDown className="size-4 text-zinc-400 ml-auto group-data-[collapsible=icon]:hidden flex-shrink-0" />
          </div>
        </SidebarHeader>

        {/* 2. Minimal Nav Menu */}
        <SidebarContent className="px-2 py-3 gap-3">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-xs font-medium text-zinc-400 px-2 h-7 mb-0.5">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
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
                        className="h-9 px-2.5 rounded-md text-sm font-normal text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 data-[active=true]:bg-zinc-800 data-[active=true]:text-zinc-100 data-[active=true]:font-medium"
                      >
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <Icon className={`size-4 flex-shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                          <span className="truncate flex-1">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="bg-zinc-800 my-1" />

          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-xs font-medium text-zinc-400 px-2 h-7 mb-0.5">
              Infrastructure
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    tooltip="API Documentation"
                    className="h-9 px-2.5 rounded-md text-sm font-normal text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                  >
                    <a
                      href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 w-full"
                    >
                      <Server className="size-4 text-zinc-400 flex-shrink-0" />
                      <span className="truncate flex-1">API Docs</span>
                      <ChevronRight className="size-3.5 text-zinc-600 ml-auto group-data-[collapsible=icon]:hidden" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="sm"
                    tooltip="BullMQ Queues"
                    className="h-9 px-2.5 rounded-md text-sm font-normal text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60"
                  >
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/admin/queues`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 w-full"
                    >
                      <Layers className="size-4 text-zinc-400 flex-shrink-0" />
                      <span className="truncate flex-1">BullMQ Dashboard</span>
                      <ChevronRight className="size-3.5 text-zinc-600 ml-auto group-data-[collapsible=icon]:hidden" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* 3. Minimal Shadcn User Profile Footer */}
        <SidebarFooter className="h-14 flex items-center p-2 border-t border-zinc-800 mt-auto">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors w-full">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="size-8 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center font-medium text-xs border border-zinc-700 flex-shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-medium text-zinc-200 truncate leading-tight">{user?.username || 'admin'}</div>
                <div className="text-xs text-zinc-400 truncate flex items-center gap-1.5 font-mono mt-0.5 leading-none">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  authorized
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors group-data-[collapsible=icon]:hidden flex-shrink-0 cursor-pointer"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Shadcn AlertDialog Confirmation Modal for Logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="border-zinc-800 bg-[#09090b] shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertTriangle className="size-4.5" />
              </div>
              <div className="text-left">
                <AlertDialogTitle className="text-sm font-semibold text-zinc-100">
                  Sign out of System Control Panel?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-zinc-400 mt-1">
                  Are you sure you want to log out? Your administrative session will be terminated and you will need to re-authenticate with master credentials.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel disabled={isLoggingOut} className="h-8 text-xs font-medium border-zinc-800 hover:bg-zinc-800 text-zinc-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
              className="h-8 text-xs font-medium bg-red-600 hover:bg-red-500 text-white"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
