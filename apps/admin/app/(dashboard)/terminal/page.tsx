'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Topbar } from '../../../components/layout/Topbar';

const XTermClient = dynamic(() => import('../../../components/terminal/XTermClient'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-[450px] flex items-center justify-center rounded-xl border border-slate-800 bg-[#070b12]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Initializing PTY engine...</p>
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
