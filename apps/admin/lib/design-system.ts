/**
 * api21 Admin Portal - Unified Design System Tokens & Utility Mappings
 * Pure Neutral Dark / Black Theme (#09090b / zinc-800 / zinc-900)
 */

export const DS = {
  layout: {
    headerHeight: 'h-14',
    sidebarWidth: 'w-64',
    pagePadding: 'p-5',
    maxPageWidth: 'max-w-7xl w-full',
    gridGap: 'gap-3.5',
  },

  surfaces: {
    canvas: 'bg-[#09090b]',
    card: 'bg-[#09090b] border border-zinc-800 rounded-lg',
    cardHover: 'bg-[#09090b] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 rounded-lg transition-colors',
    toolbar: 'bg-[#09090b] border border-zinc-800 rounded-lg p-2.5',
    tableHeader: 'border-b border-zinc-800 bg-transparent text-zinc-400 text-xs font-medium',
    tableRow: 'border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors',
  },

  typography: {
    pageTitle: 'text-sm font-semibold text-zinc-100',
    pageSubtitle: 'text-xs text-zinc-400',
    cardTitle: 'text-sm font-semibold text-zinc-100',
    cardSubtitle: 'text-xs text-zinc-400',
    metricValue: 'text-2xl font-bold text-zinc-100 font-sans tracking-tight',
    categoryLabel: 'text-xs font-medium uppercase tracking-wider text-zinc-400',
    monoValue: 'font-mono text-xs text-zinc-200',
    monoMuted: 'font-mono text-xs text-zinc-400',
  },

  badges: {
    online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono',
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono',
    revoked: 'bg-zinc-800 text-zinc-400 border-zinc-700 text-xs font-mono',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20 text-xs font-mono',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-mono',
    neutral: 'bg-zinc-900 text-zinc-300 border-zinc-800 text-xs font-mono',
  },

  colors: {
    border: 'border-zinc-800',
    borderSubtle: 'border-zinc-800/60',
    borderHover: 'border-zinc-700',
  },
} as const;
