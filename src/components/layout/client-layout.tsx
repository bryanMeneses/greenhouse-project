import * as React from "react";
import { FileText, MessageCircle } from "lucide-react";

import {
  AppShell,
  disabledNavClassName,
  type NavItem,
  type ReturnContext,
} from "@/components/layout/app-shell";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { CLIENT_AREAS } from "@/features/returns/shared/areas";

// The Client has exactly one Return, so it is their standing destination — the
// contextual "My Return" tier with its Areas nested, no separate global item.
const CLIENT_NAV: NavItem[] = [];

const CLIENT_RETURN_CONTEXT: ReturnContext = {
  label: "My Return",
  basePath: "/",
  icon: FileText,
  areas: CLIENT_AREAS,
};

function MessagesHint() {
  return (
    <SidebarMenuItem>
      <span aria-disabled="true" className={disabledNavClassName()}>
        <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">Messages</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
          After setup
        </span>
      </span>
    </SidebarMenuItem>
  );
}

type ClientLayoutProps = {
  title: string;
  firstRun?: boolean;
  children: React.ReactNode;
};

export function ClientLayout({ title, firstRun, children }: ClientLayoutProps) {
  return (
    <AppShell
      title={title}
      nav={CLIENT_NAV}
      returnContext={CLIENT_RETURN_CONTEXT}
      contextualNav={!firstRun}
      navExtra={firstRun ? <MessagesHint /> : undefined}
    >
      {children}
    </AppShell>
  );
}
