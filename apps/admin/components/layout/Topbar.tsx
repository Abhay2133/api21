'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
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
    <header className="h-14 border-b border-zinc-800 bg-[#09090b] px-4 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="size-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" />
        <div className="h-4 w-[1px] bg-zinc-800" />
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <span className="font-medium text-zinc-100">{title}</span>
          {subtitle && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 hidden sm:inline text-xs">{subtitle}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2.5">
        {children}
        <Badge variant="outline" className="gap-1.5 py-1 px-2.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </Badge>

        <a
          href={`${apiBaseUrl}/`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-zinc-100 transition-colors px-2.5 py-1 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 font-medium"
        >
          <span>API Docs</span>
          <ExternalLink className="size-3 text-zinc-500" />
        </a>
      </div>
    </header>
  );
}
