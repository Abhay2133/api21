import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants = {
      default: 'bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 shadow-md shadow-sky-500/20',
      destructive: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200',
      secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
      ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white',
      link: 'text-sky-400 underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-12 rounded-lg px-8 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
