import * as React from "react";
import { Link, useLocation } from "react-router";
import { Sprout, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { RoleSwitcher } from "@/components/layout/role-switcher";

/**
 * The shared shell chrome (ADR-0005). Both audience layouts —
 * {@link import("./internal-layout").InternalLayout} and
 * {@link import("./client-layout").ClientLayout} — render this frame and only
 * differ in the nav manifest they pass, so the audience fork lives in the
 * layouts, not here.
 */

/** Base nav-item layout, shared by the live link and any disabled placeholder. */
export const NAV_ITEM_BASE =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium";

/** A navigable sidebar entry. */
export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Stay the active item on `/returns/*` too — a Return review is a drill-in from it. */
  activeOnReturns?: boolean;
};

/** Live link treatment; the active route gets the accented, filled look. */
function navLinkClass(isActive: boolean) {
  return cn(
    NAV_ITEM_BASE,
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
}

type AppShellProps = {
  /** Heading shown in the content header. */
  title: string;
  /** The audience's primary nav entries. */
  nav: NavItem[];
  /** Extra sidebar content below the links, e.g. a firm-only "coming soon" hint. */
  navExtra?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({ title, nav, navExtra, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar nav={nav} navExtra={navExtra} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <RoleSwitcher />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  nav,
  navExtra,
}: {
  nav: NavItem[];
  navExtra?: React.ReactNode;
}) {
  const { pathname } = useLocation();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sprout className="size-4" />
        </span>
        <span className="font-serif text-base font-semibold text-sidebar-foreground">
          Greenhouse Tax
        </span>
      </div>
      <nav aria-label="Primary" className="flex flex-col gap-1 p-3">
        {nav.map((item) => {
          // A Return's review (`/returns/:id`) is a drill-in with no nav item of
          // its own, so the item it drills in from stays active there too — not
          // just on its own route — and the nav always shows where you are.
          const isActive =
            pathname === item.to ||
            (!!item.activeOnReturns && pathname.startsWith("/returns"));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={navLinkClass(isActive)}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        {navExtra}
      </nav>
    </aside>
  );
}
