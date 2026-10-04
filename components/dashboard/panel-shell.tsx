import type { ReactNode } from "react";
import { PanelNav, type PanelNavItem } from "@/components/dashboard/panel-nav";
import { PanelLogoutButton } from "@/components/dashboard/panel-logout-button";

type PanelShellProps = {
  panelLabel: string;
  userName: string;
  userMeta: string;
  navItems: PanelNavItem[];
  logoutEndpoint: string;
  logoutRedirect: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PanelShell({
  panelLabel,
  userName,
  userMeta,
  navItems,
  logoutEndpoint,
  logoutRedirect,
  title,
  description,
  actions,
  children,
}: PanelShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-6 sm:px-6 lg:flex-row lg:items-start lg:py-10">
      <aside className="glass-strong rounded-3xl p-4 lg:sticky lg:top-28 lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3 border-b border-saffron-200/60 px-2 pb-4">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 font-serif font-bold text-white"
          >
            {userName.trim().charAt(0) || "R"}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-saffron-700 uppercase">{panelLabel}</p>
            <p className="truncate font-semibold text-cocoa-900">{userName}</p>
            <p className="truncate text-xs text-cocoa-700">{userMeta}</p>
          </div>
        </div>
        <PanelNav items={navItems} />
        <div className="mt-3 border-t border-saffron-200/60 pt-3">
          <PanelLogoutButton endpoint={logoutEndpoint} redirectTo={logoutRedirect} />
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-cocoa-900 sm:text-3xl text-balance">{title}</h1>
            {description ? <p className="mt-1.5 text-sm leading-relaxed text-cocoa-700 text-pretty">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        {children}
      </main>
    </div>
  );
}

export function PanelCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md sm:p-6 ${className}`}>{children}</section>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-saffron-300 bg-saffron-50/60 px-6 py-12 text-center">
      <p className="font-semibold text-cocoa-900">{title}</p>
      <p className="mt-1.5 max-w-md text-sm text-cocoa-700 text-pretty">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
