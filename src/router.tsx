import { createBrowserRouter, redirect, type RouteObject } from "react-router";

import { DashboardRoute } from "@/routes/dashboard/dashboard-route";
import { ReturnReviewRoute } from "@/routes/return-review/return-review-route";

/**
 * The app's two surfaces:
 * - `/`                    the ranked landing dashboard
 * - `/returns/:returnId`   that Return's review
 *
 * A bare `/returns` (no id) has no meaning of its own — the dashboard is the
 * list — so it bounces to `/` rather than 404-ing.
 */
export const routes: RouteObject[] = [
  { path: "/", element: <DashboardRoute /> },
  { path: "/returns", loader: () => redirect("/") },
  { path: "/returns/:returnId", element: <ReturnReviewRoute /> },
];

export const router = createBrowserRouter(routes);
