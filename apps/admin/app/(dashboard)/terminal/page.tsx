'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Topbar } from '../../../components/layout/Topbar';

const XTermClient = dynamic(() => import('../../../components/terminal/XTermClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-[450px] flex items-center justify-center rounded-xl border border-zinc-800 bg-[#09090b]">
      <div className="flex flex-col items-center gap-2">
        <div className="size-6 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Initializing PTY engine...</p>
      </div>
    </div>
  ),
});

export default function TerminalPage() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
      <Topbar title="Terminal" subtitle="Interactive host PTY console" />
      <div className="p-3 flex-1 flex flex-col min-h-0">
        <XTermClient />
      </div>
    </div>
  );
}
