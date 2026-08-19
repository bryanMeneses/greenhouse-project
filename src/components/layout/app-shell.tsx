import * as React from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Landmark, type LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { cn } from "@/lib/utils";
import type { ReturnArea } from "@/features/returns/shared/areas";

export const NAV_ITEM_BASE =
  "flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium";

/** A global-tier destination — "the app", independent of any one Return. */
export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

/**
 * The open Return that owns the contextual tier, rendered as a labelled group
 * whose items are its Areas. Firm supplies this only on a Return route; the
 * Client always has exactly one Return, so it is their standing "My Return".
 */
export type ReturnContext = {
  /** Heading for the group — "Nguyen Family · 2024" (firm) or "My Return" (client). */
  label: string;
  /** The Return's route; every Area deep link hangs off it (`/returns/:id` or `/`). */
  basePath: string;
  icon: LucideIcon;
  areas: ReturnArea[];
};

type AppShellProps = {
  title: string;
  nav: NavItem[];
  /** Group label for the global tier (e.g. "Firm-wide"), when nav items exist. */
  navLabel?: string;
  returnContext?: ReturnContext;
  /** Hidden during Client first-run (ch. 03) until onboarding completes. */
  contextualNav?: boolean;
  navExtra?: React.ReactNode;
  /** Header actions before the role switcher (e.g. the Firm's ⌘K search). */
  headerActions?: React.ReactNode;
  /** The orientation Trail (breadcrumb), shown as a persistent row in the fixed
   *  header rather than nested inside a page's scrollable content. */
  trail?: React.ReactNode;
  children: React.ReactNode;
};

/** The shared two-tier shell frame used by the Firm and Client layouts. */
export function AppShell({
  title,
  nav,
  navLabel,
  returnContext,
  contextualNav = true,
  navExtra,
  headerActions,
  trail,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        nav={nav}
        navLabel={navLabel}
        returnContext={contextualNav ? returnContext : undefined}
        navExtra={navExtra}
      />
      <SidebarInset>
        {/* The top bar stays pinned to the viewport while the content scrolls
            beneath it; it stays in flow, so the content below never needs a
            hand-tuned top offset for the header's height. */}
        <header className="sticky top-0 z-20 border-b border-border bg-card">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <SidebarTrigger className="-ml-1" />
            {trail ? (
              <>
                {/* On Return routes the Trail takes the title slot so the fixed
                    header stays one row. On `sm`+ the breadcrumb is the visible
                    identity (the h1 is kept, sr-only, for screen readers); below
                    `sm` a full trail doesn't fit, so the page title shows
                    instead and the trail is hidden. */}
                <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:sr-only">
                  {title}
                </h1>
                <div className="hidden min-w-0 flex-1 overflow-hidden sm:block">
                  {trail}
                </div>
              </>
            ) : (
              <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">
                {title}
              </h1>
            )}
            {headerActions}
            <RoleSwitcher />
          </div>
        </header>
        <div className="min-w-0 flex-1 p-6">
          {/* One uniform content width for every surface — the shell owns it so no
              page sets its own (dashboard, roster, and Return all read the same). */}
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({
  nav,
  navLabel,
  returnContext,
  navExtra,
}: {
  nav: NavItem[];
  navLabel?: string;
  returnContext?: ReturnContext;
  navExtra?: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const areas = returnContext?.areas ?? [];
  const requestedArea = searchParams.get("area");
  const currentArea = areas.some((area) => area.id === requestedArea)
    ? requestedArea
    : (areas[0]?.id ?? "overview");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark aria-hidden="true" className="size-4" />
          </span>
          <span className="font-serif text-base font-semibold group-data-[collapsible=icon]:hidden">
            Ledgerline
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {/* Global tier — "the app". Active only on its own exact route, so no
            destination stays lit once you've drilled into a Return. */}
        {nav.length > 0 && (
          <SidebarGroup>
            {navLabel && <SidebarGroupLabel>{navLabel}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <nav aria-label="Primary">
                <SidebarMenu>
                  {nav.map((item) => {
                    const isActive = pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Link
                            to={item.to}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <Icon aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Contextual tier — the open Return and its Areas, as a labelled group.
            Firm supplies this only on a Return route; the Client's "My Return" is
            their standing destination, so it is always present after first-run. */}
        {returnContext && areas.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <returnContext.icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="min-w-0 truncate" title={returnContext.label}>
                {returnContext.label}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <nav aria-label={`${returnContext.label} Areas`}>
                <SidebarMenu>
                  {areas.map((area) => {
                    const areaIsActive = currentArea === area.id;
                    const AreaIcon = area.icon;
                    return (
                      <SidebarMenuItem key={area.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={areaIsActive}
                          tooltip={area.label}
                        >
                          <Link
                            to={`${returnContext.basePath}?area=${area.id}`}
                            aria-current={areaIsActive ? "page" : undefined}
                            title={area.description}
                          >
                            <AreaIcon aria-hidden="true" />
                            <span>{area.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {navExtra && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>{navExtra}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function disabledNavClassName() {
  return cn(NAV_ITEM_BASE, "cursor-not-allowed text-muted-foreground/50");
}
