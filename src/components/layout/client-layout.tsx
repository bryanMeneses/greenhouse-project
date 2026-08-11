import * as React from "react";
import { FileText } from "lucide-react";

import { AppShell, type NavItem } from "@/components/layout/app-shell";

/**
 * The Client (external) shell (ADR-0005): a simpler, task-focused chrome for a
 * taxpayer tracking their own Return. One of the two audience layouts; see
 * {@link import("./internal-layout").InternalLayout} for the Firm side.
 */

const CLIENT_NAV: NavItem[] = [{ label: "My Return", to: "/", icon: FileText }];

type ClientLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function ClientLayout({ title, children }: ClientLayoutProps) {
  return (
    <AppShell title={title} nav={CLIENT_NAV}>
      {children}
    </AppShell>
  );
}
