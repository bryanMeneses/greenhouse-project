import * as React from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Sprout, type LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
 * The open Return that owns the contextual tier. Its Areas nest beneath a header
 * that links to the Return's Overview. Firm supplies this only on a Return route;
 * the Client always has exactly one Return, so it is their standing "My Return".
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
  returnContext?: ReturnContext;
  /** Hidden during Client first-run (ch. 03) until onboarding completes. */
  contextualNav?: boolean;
  navExtra?: React.ReactNode;
  children: React.ReactNode;
};

/** The shared two-tier shell frame used by the Firm and Client layouts. */
export function AppShell({
  title,
  nav,
  returnContext,
  contextualNav = true,
  navExtra,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        nav={nav}
        returnContext={contextualNav ? returnContext : undefined}
        navExtra={navExtra}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight">
            {title}
          </h1>
          <RoleSwitcher />
        </header>
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebar({
  nav,
  returnContext,
  navExtra,
}: {
  nav: NavItem[];
  returnContext?: ReturnContext;
  navExtra?: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  // The contextual tier only opens when we're actually viewing its Return, so the
  // Areas never dangle beneath a Return the User has navigated away from.
  const onReturn =
    returnContext !== undefined && pathname === returnContext.basePath;
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
            <Sprout aria-hidden="true" className="size-4" />
          </span>
          <span className="font-serif text-base font-semibold group-data-[collapsible=icon]:hidden">
            Greenhouse Tax
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Primary">
              <SidebarMenu>
                {/* Global tier — "the app". Active only on its own exact route, so
                  no destination stays lit once you've drilled into a Return. */}
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

                {/* Contextual tier — the open Return and its Areas nested beneath. */}
                {returnContext && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={onReturn}
                      tooltip={returnContext.label}
                    >
                      <Link
                        to={`${returnContext.basePath}?area=overview`}
                        aria-current={onReturn ? "page" : undefined}
                      >
                        <returnContext.icon aria-hidden="true" />
                        <span>{returnContext.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {onReturn && areas.length > 0 && (
                      <SidebarMenuSub
                        aria-label={`${returnContext.label} Areas`}
                      >
                        {areas.map((area) => {
                          const areaIsActive = currentArea === area.id;
                          return (
                            <SidebarMenuSubItem key={area.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={areaIsActive}
                              >
                                <Link
                                  to={`${returnContext.basePath}?area=${area.id}`}
                                  aria-current={
                                    areaIsActive ? "page" : undefined
                                  }
                                  title={area.description}
                                >
                                  <span>{area.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                )}

                {navExtra}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function disabledNavClassName() {
  return cn(NAV_ITEM_BASE, "cursor-not-allowed text-muted-foreground/50");
}
