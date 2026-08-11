import * as React from "react";
import { LayoutDashboard, ListChecks } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  AppShell,
  NAV_ITEM_BASE,
  type NavItem,
} from "@/components/layout/app-shell";

/**
 * The Firm (internal) shell (ADR-0005): the CPA workspace chrome — dashboard nav,
 * with the Return review drilling in under it. One of the two audience layouts;
 * see {@link import("./client-layout").ClientLayout} for the Client side.
 */

const INTERNAL_NAV: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, activeOnReturns: true },
];

/**
 * A global, cross-Return queue isn't built yet — today the Review Queue lives
 * inside a single Return's review. Firm staff see it as a disabled hint at what's
 * coming; it isn't part of the client nav.
 */
function ReviewQueueHint() {
  return (
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
  );
}

type InternalLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function InternalLayout({ title, children }: InternalLayoutProps) {
  return (
    <AppShell title={title} nav={INTERNAL_NAV} navExtra={<ReviewQueueHint />}>
      {children}
    </AppShell>
  );
}
