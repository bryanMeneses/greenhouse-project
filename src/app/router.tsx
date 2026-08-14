import { createBrowserRouter, Outlet, type RouteObject } from "react-router";

import { HomePage } from "@/app/home-page";
import { ReturnsIndexPage } from "@/features/returns/returns-index-page";
import { ReturnReviewPage } from "@/features/returns/review/return-review-page";
import { RoleProvider } from "@/app/providers";

/**
 * The app's surfaces, all under the role-aware root (ADR-0005):
 * - `/`                    Role-branched home (Firm Command Center / Client status)
 * - `/returns`             the firm-wide Return roster (Firm only; Clients bounce home)
 * - `/returns/:returnId`   that Return's review (a Firm-only workspace)
 *
 * Routes are shared across Roles — what renders, and in which shell, depends on
 * who you're acting as, not the URL (the fork lives in the pages + layouts). The
 * bare `/returns` roster is Firm-only; a Client has one Return and no roster, so
 * `ReturnsIndexPage` redirects them home.
 */
export const routes: RouteObject[] = [
  {
    // Root: makes the active Role available to every route.
    element: (
      <RoleProvider>
        <Outlet />
      </RoleProvider>
    ),
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/returns", element: <ReturnsIndexPage /> },
      { path: "/returns/:returnId", element: <ReturnReviewPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
