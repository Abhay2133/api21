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
    <header className="h-12 border-b border-slate-800/80 bg-[#070b12] px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800/60" />
        <div className="h-4 w-[1px] bg-slate-800" />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-200">{title}</span>
          {subtitle && (
            <>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400 hidden sm:inline">{subtitle}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <Badge variant="outline" className="gap-1 py-0.5 px-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </Badge>

        <a
          href={`${apiBaseUrl}/`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-400 transition-colors px-2 py-1 rounded-md border border-slate-800 bg-slate-900/60 hover:border-slate-700"
        >
          <Activity className="w-3 h-3" />
          <span>API Docs</span>
          <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
        </a>
      </div>
    </header>
  );
}
