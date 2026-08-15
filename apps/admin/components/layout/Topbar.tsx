'use client';

import React from 'react';
import { Activity, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { SidebarTrigger } from '../ui/sidebar';

interface TopbarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Topbar({ title, subtitle, children }: TopbarProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#070b12] px-5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800/60" />
        <div className="h-5 w-[1px] bg-slate-800" />
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-100">{title}</span>
          {subtitle && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 hidden sm:inline text-xs">{subtitle}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        {children}
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </Badge>

        <a
          href={`${apiBaseUrl}/`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-sky-400 transition-colors px-2.5 py-1 rounded-md border border-slate-800 bg-slate-900/60 hover:border-slate-700 font-medium"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>
    </header>
  );
}
