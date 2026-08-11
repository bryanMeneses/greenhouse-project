import {
  createBrowserRouter,
  Outlet,
  redirect,
  type RouteObject,
} from "react-router";

import { HomePage } from "@/app/home-page";
import { ReturnReviewPage } from "@/features/returns/review/return-review-page";
import { RoleProvider } from "@/app/providers";

/**
 * The app's surfaces, all under the role-aware root (ADR-0005):
 * - `/`                    Role-branched home (Firm dashboard / Client status)
 * - `/returns/:returnId`   that Return's review (a Firm-only workspace)
 *
 * Routes are shared across Roles — what renders, and in which shell, depends on
 * who you're acting as, not the URL (the fork lives in the pages + layouts). A
 * bare `/returns` (no id) has no meaning of its own — the dashboard is the list —
 * so it bounces to `/` rather than 404-ing.
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
      { path: "/returns", loader: () => redirect("/") },
      { path: "/returns/:returnId", element: <ReturnReviewPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
