/**
 * @api21/admin - Centralized Design System Constants & Helpers
 * Standardized across all Admin Portal pages for consistent layout, metrics, and styling.
 */

export const DS = {
  layout: {
    headerHeight: 'h-14',
    sidebarWidth: 'w-64',
    pagePadding: 'p-5',
    sectionGap: 'space-y-4',
    gridGap: 'gap-3.5',
    maxContainerWidth: 'max-w-7xl',
  },
  surfaces: {
    canvas: 'bg-[#070b12]',
    card: 'bg-[#0c121d] border border-slate-800/80 rounded-lg shadow-sm',
    cardHover: 'hover:border-slate-700/80 hover:bg-[#0f1726] transition-colors',
    innerRow: 'border-b border-slate-800/60 last:border-0',
    headerDivider: 'border-b border-slate-800/80',
  },
  typography: {
    pageTitle: 'text-sm font-bold text-slate-100',
    pageSubtitle: 'text-xs text-slate-400 font-normal',
    cardHeader: 'text-sm font-bold text-slate-100',
    cardCategory: 'text-xs font-bold uppercase tracking-wider text-slate-400',
    metricValue: 'text-2xl font-black text-white tracking-tight',
    monoLabel: 'text-xs text-slate-400 font-mono font-medium',
    monoValue: 'text-xs text-slate-200 font-mono font-medium',
  },
  badges: {
    online: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono font-medium',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-mono font-medium',
    failed: 'bg-red-500/10 text-red-400 border-red-500/20 text-xs font-mono font-medium',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-mono font-medium',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20 text-xs font-mono font-medium',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700/60 text-xs font-mono font-medium',
  },
  colors: {
    cpu: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    memory: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    disk: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    uptime: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    users: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    sessions: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    deployments: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
} as const;

export type BadgeVariantType = 'online' | 'completed' | 'failed' | 'warning' | 'info' | 'neutral';

export function getStatusBadgeClass(status?: string): string {
  if (!status) return DS.badges.neutral;
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'online' || s === 'active' || s === 'live') return DS.badges.completed;
  if (s === 'failed' || s === 'error' || s === 'offline') return DS.badges.failed;
  if (s === 'warning' || s === 'delayed' || s === 'pending' || s === 'building') return DS.badges.warning;
  return DS.badges.info;
}
