import * as React from "react";
import { FileText, MessageCircle } from "lucide-react";

import {
  AppShell,
  NAV_ITEM_BASE,
  type NavItem,
} from "@/components/layout/app-shell";
import { cn } from "@/lib/utils";

/**
 * The Client (external) shell (ADR-0005): a simpler, task-focused chrome for a
 * taxpayer tracking their own Return. One of the two audience layouts; see
 * {@link import("./internal-layout").InternalLayout} for the Firm side.
 */

const CLIENT_NAV: NavItem[] = [{ label: "My Return", to: "/", icon: FileText }];

/**
 * During first-run setup, messaging with the preparer is deferred until the
 * Client has finished their first steps (challenge 03: hide what isn't relevant
 * yet). Shown as a disabled hint so a brand-new Client can see what unlocks next,
 * mirroring the Firm side's {@link import("./internal-layout").InternalLayout}
 * "Review Queue — Soon" hint. Once onboarding is done it drops away and real
 * collaboration appears in the Return itself.
 */
function MessagesHint() {
  return (
    <span
      aria-disabled="true"
      className={cn(
        NAV_ITEM_BASE,
        "cursor-not-allowed text-muted-foreground/50",
      )}
    >
      <MessageCircle className="size-4 shrink-0" />
      Messages
      <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        After setup
      </span>
    </span>
  );
}

type ClientLayoutProps = {
  title: string;
  /** During first-run, defer secondary destinations until setup is done. */
  firstRun?: boolean;
  children: React.ReactNode;
};

export function ClientLayout({ title, firstRun, children }: ClientLayoutProps) {
  return (
    <AppShell
      title={title}
      nav={CLIENT_NAV}
      navExtra={firstRun ? <MessagesHint /> : undefined}
    >
      {children}
    </AppShell>
  );
}
