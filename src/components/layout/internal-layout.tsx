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

// The firm global tier is the Command center, the Returns roster, and the
// firm-wide Documents + Messages pools, labelled "Firm-wide" so the pools read as
// every-Return surfaces. The contextual Area tier is supplied per Return, only
// while one is open (see `activeReturn`); its own "Documents"/"Messages" Areas are
// that one Return's files/conversations, distinct from the "All …" pools above.
const INTERNAL_NAV: NavItem[] = [
  { label: "Command center", to: "/", icon: LayoutDashboard },
  { label: "Returns", to: "/returns", icon: Briefcase },
  { label: "All documents", to: "/documents", icon: Files },
  { label: "All messages", to: "/messages", icon: MessagesSquare },
];

type InternalLayoutProps = {
  title: string;
  /** The open Return, when on a Return route — fills the contextual Area tier. */
  activeReturn?: { label: string; basePath: string };
  /** The orientation Trail for Return routes, pinned to the fixed header. */
  trail?: React.ReactNode;
  children: React.ReactNode;
};

export function InternalLayout({
  title,
  activeReturn,
  trail,
  children,
}: InternalLayoutProps) {
  const returnContext: ReturnContext | undefined = activeReturn
    ? { ...activeReturn, icon: FileText, areas: FIRM_AREAS }
    : undefined;

  return (
    <AppShell
      title={title}
      nav={INTERNAL_NAV}
      navLabel="Firm-wide"
      returnContext={returnContext}
      headerActions={<CommandSearch />}
      trail={trail}
    >
      {children}
    </AppShell>
  );
}
