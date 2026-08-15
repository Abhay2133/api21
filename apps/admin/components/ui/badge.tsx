import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-sky-500/20 text-sky-300 border border-sky-500/30',
    secondary: 'border-transparent bg-slate-800 text-slate-300',
    destructive: 'border-transparent bg-red-500/20 text-red-400 border border-red-500/30',
    success: 'border-transparent bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    warning: 'border-transparent bg-amber-500/20 text-amber-300 border border-amber-500/30',
    outline: 'text-slate-300 border border-slate-700',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
