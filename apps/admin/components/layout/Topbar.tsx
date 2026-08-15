'use client';

import React from 'react';
import { Activity, Radio, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { SidebarTrigger } from '../ui/sidebar';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hidden md:inline-flex" />
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="success" className="gap-1.5 py-1 px-3">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          <span className="font-mono text-[11px]">API ENGINE ONLINE</span>
        </Badge>

        <a
          href={`${apiBaseUrl}/`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      </div>
    </header>
  );
}
