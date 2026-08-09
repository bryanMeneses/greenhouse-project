import * as React from "react";
import { Link, useLocation } from "react-router";
import { LayoutDashboard, ListChecks, Sprout } from "lucide-react";

import { cn } from "@/lib/utils";

/** Base nav-item layout, shared by the live link and the disabled placeholder. */
const NAV_ITEM_BASE =
  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium";

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
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <UserBadge />
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

function Sidebar() {
  const { pathname } = useLocation();
  // A Return's review (`/returns/:id`) is a drill-in from the dashboard, so the
  // one nav item reads as current there too — not just on the landing route.
  const dashboardActive = pathname === "/" || pathname.startsWith("/returns");

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
        {/*
         * The dashboard is the app's one destination; a Return's review is a
         * drill-in from it, so this stays current across `/returns/:id` too and
         * the nav always shows where you are.
         */}
        <Link
          to="/"
          aria-current={dashboardActive ? "page" : undefined}
          className={navLinkClass(dashboardActive)}
        >
          <LayoutDashboard className="size-4 shrink-0" />
          Dashboard
        </Link>

        {/*
         * A global, cross-Return queue isn't built yet — today the Review Queue
         * lives inside a single Return's review. Shown disabled so the nav hints
         * at what's coming without a dead link.
         */}
        <span
          aria-disabled="true"
          className={cn(
            NAV_ITEM_BASE,
            "cursor-not-allowed text-muted-foreground/50",
          )}
        >
          <ListChecks className="size-4 shrink-0" />
          Review Queue
          <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Soon
          </span>
        </span>
      </nav>
    </aside>
  );
}

function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium">Dana Reyes, CPA</div>
        <div className="text-xs text-muted-foreground">Preparer</div>
      </div>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
      >
        DR
      </span>
    </div>
  );
}
