'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { PanelLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean | ((value: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean | ((value: boolean) => boolean)) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = React.useState(false);
    const [openMobile, setOpenMobile] = React.useState(false);

    // Track internal open state
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp !== undefined ? openProp : _open;

    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // Set cookie for persistence
        if (typeof document !== 'undefined') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Handle keyboard shortcut (Cmd+B or Ctrl+B)
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleSidebar]);

    // Media query mobile check
    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          className={cn(
            'group/sidebar-wrapper flex min-h-screen w-full bg-[#090d16] text-slate-100',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'icon',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === 'none') {
      return (
        <aside
          className={cn(
            'flex h-screen sticky top-0 w-64 flex-shrink-0 flex-col bg-slate-950/80 text-slate-100 border-r border-slate-800/80',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </aside>
      );
    }

    if (isMobile) {
      if (!openMobile) return null;
      return (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setOpenMobile(false)}
          />
          {/* Mobile Sheet */}
          <aside
            ref={ref}
            className={cn(
              'relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-950 p-0 text-slate-100 shadow-2xl border-r border-slate-800 animate-in slide-in-from-left z-50',
              className
            )}
            {...props}
          >
            {children}
          </aside>
        </div>
      );
    }

    return (
      <aside
        ref={ref}
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
        className={cn(
          'group peer hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 duration-200 transition-[width] ease-linear border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl z-20',
          state === 'expanded' ? 'w-64' : 'w-16',
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col bg-slate-950/60 justify-between overflow-hidden"
        >
          {children}
        </div>
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60', className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        'absolute inset-y-0 -right-2 z-30 hidden w-4 cursor-ew-resize sm:flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity',
        className
      )}
      {...props}
    >
      <div className="w-[2px] h-full bg-slate-800 hover:bg-sky-500 transition-colors" />
    </button>
  );
});
SidebarRail.displayName = 'SidebarRail';

export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'main'>
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        'relative flex min-h-screen flex-1 flex-col bg-[#090d16] min-w-0 overflow-y-auto',
        className
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = 'SidebarInset';

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn('flex flex-col gap-2 p-4 border-b border-slate-800/80', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn('flex flex-col gap-2 p-4 border-t border-slate-800/80 mt-auto', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="separator"
      className={cn('mx-2 my-1 h-[1px] bg-slate-800/80', className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3 group-data-[collapsible=icon]:overflow-hidden',
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn('relative flex w-full min-w-0 flex-col p-1', className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        'duration-200 flex h-7 shrink-0 items-center rounded-md px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider outline-none transition-[margin,opacity] ease-linear group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn('w-full text-sm', className)}
    {...props}
  />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn('group/menu-item relative', className)}
    {...props}
  />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

const sidebarMenuButtonVariants = cva(
  'peer/menu-button flex w-full items-center gap-3 overflow-hidden rounded-lg p-2.5 text-left text-sm font-medium outline-none transition-all hover:bg-slate-900/70 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-sky-400 active:bg-slate-900/90 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sky-500/10 data-[active=true]:font-medium data-[active=true]:text-sky-400 data-[active=true]:border data-[active=true]:border-sky-500/20 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0 [&>span]:group-data-[collapsible=icon]:hidden [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'text-slate-400 hover:text-slate-200',
        outline:
          'bg-slate-950 shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-slate-900',
      },
      size: {
        default: 'h-10 text-sm',
        sm: 'h-8 text-xs',
        lg: 'h-12 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = 'default',
      size = 'default',
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';
