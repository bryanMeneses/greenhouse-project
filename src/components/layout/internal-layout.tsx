import * as React from "react";
import {
  Briefcase,
  FileText,
  Files,
  LayoutDashboard,
  MessagesSquare,
} from "lucide-react";

import {
  AppShell,
  type NavItem,
  type ReturnContext,
} from "@/components/layout/app-shell";
import { CommandSearch } from "@/components/layout/command-search";
import { FIRM_AREAS } from "@/features/returns/shared/areas";

// The firm global tier is the Command center, the Returns roster, and the firm-wide
// Documents + Messages pools — a Preparer works many Returns, so there is no
// standing "the Return". The contextual Area tier is supplied per Return, only
// while one is open (see `activeReturn`); its own "Documents"/"Messages" Areas are
// that one Return's files/conversations, distinct from these firm-wide pools across
// every Return.
const INTERNAL_NAV: NavItem[] = [
  { label: "Command center", to: "/", icon: LayoutDashboard },
  { label: "Returns", to: "/returns", icon: Briefcase },
  { label: "Documents", to: "/documents", icon: Files },
  { label: "Messages", to: "/messages", icon: MessagesSquare },
];

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
      headerActions={<CommandSearch />}
    >
      {children}
    </AppShell>
  );
}
