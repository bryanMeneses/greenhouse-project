import * as React from "react";
import { FileText, LayoutDashboard, ListChecks } from "lucide-react";

import {
  AppShell,
  disabledNavClassName,
  type NavItem,
  type ReturnContext,
} from "@/components/layout/app-shell";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { FIRM_AREAS } from "@/features/returns/shared/areas";

// The firm global tier is Dashboard alone — a Preparer works many Returns, so
// there is no standing "the Return". The contextual Area tier is supplied per
// Return, only while one is open (see `activeReturn`).
const INTERNAL_NAV: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
];

function ReviewQueueHint() {
  return (
    <SidebarMenuItem>
      <span aria-disabled="true" className={disabledNavClassName()}>
        <ListChecks aria-hidden="true" className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">
          Review Queue
        </span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
          Soon
        </span>
      </span>
    </SidebarMenuItem>
  );
}

type InternalLayoutProps = {
  title: string;
  /** The open Return, when on a Return route — fills the contextual Area tier. */
  activeReturn?: { label: string; basePath: string };
  children: React.ReactNode;
};

export function InternalLayout({
  title,
  activeReturn,
  children,
}: InternalLayoutProps) {
  const returnContext: ReturnContext | undefined = activeReturn
    ? { ...activeReturn, icon: FileText, areas: FIRM_AREAS }
    : undefined;

  return (
    <AppShell
      title={title}
      nav={INTERNAL_NAV}
      returnContext={returnContext}
      navExtra={<ReviewQueueHint />}
    >
      {children}
    </AppShell>
  );
}
