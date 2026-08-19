import { Link, useLocation } from "react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { areasFor } from "./areas";
import { targetLabel } from "./connections";
import type { RoleFamily } from "@/lib/roles";
import type { Return } from "./returns";
import type { Thread } from "./collaboration";
import { useReturnView } from "@/hooks/use-return-view";
import { cn } from "@/lib/utils";

type TrailProps = {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  threads?: Thread[];
  /** Fit on one non-wrapping line (header chrome): every crumb shares the
   *  available width and truncates as needed — with the full label kept in a
   *  `title` tooltip on the variable-length ones — so the trail stays on one row
   *  inside its clipped header slot instead of wrapping to a second line. */
  singleLine?: boolean;
};

/** The top-most destination each shell breadcrumbs from — the Firm's Command
 * center, or the Client's standing "My Return". Both are `/`, the same route the
 * Role forks. */
const HOME_CRUMB: Record<RoleFamily, { label: string; to: string }> = {
  firm: { label: "Command center", to: "/" },
  client: { label: "My Return", to: "/" },
};

/**
 * One breadcrumb atop a Return. The shell's top-most level always comes first;
 * on a Return it reads `Dashboard › Nguyen Family · 2024 › Area › object` — the
 * Return crumb links back to Overview, then the active Area, then the focused
 * object (current crumb marked). The Client's top-most level is their "My
 * Return", which doubles as the Return crumb since `/` is their whole shell.
 */
export function Trail({
  taxReturn,
  viewerFamily,
  threads = [],
  singleLine = false,
}: TrailProps) {
  const { pathname } = useLocation();
  const { area, focus } = useReturnView({
    areas: areasFor(viewerFamily).map((candidate) => candidate.id),
  });
  const areas = areasFor(viewerFamily);
  const home = HOME_CRUMB[viewerFamily];
  const areaLabel =
    areas.find((candidate) => candidate.id === area)?.label ?? "Overview";
  const currentObject = focus ? targetLabel(focus, taxReturn, threads) : null;
  // The Firm's Return crumb sits between Dashboard and the Area; the Client's
  // "My Return" already names the Return, so no extra crumb there.
  const returnCrumb =
    viewerFamily === "firm"
      ? {
          label: `${taxReturn.client} · ${taxReturn.taxYear}`,
          to: `${pathname}?area=overview`,
        }
      : null;

  const itemClassName = singleLine ? "min-w-0" : undefined;
  const textClassName = singleLine ? "min-w-0 truncate" : undefined;
  const separatorClassName = singleLine ? "shrink-0" : undefined;

  return (
    <Breadcrumb aria-label="Trail">
      <BreadcrumbList className={singleLine ? "flex-nowrap" : undefined}>
        <BreadcrumbItem className={itemClassName}>
          <BreadcrumbLink asChild>
            <Link to={home.to} className={textClassName}>
              {home.label}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {returnCrumb && (
          <>
            <BreadcrumbSeparator className={separatorClassName} />
            <BreadcrumbItem className={itemClassName}>
              <BreadcrumbLink asChild>
                <Link
                  to={returnCrumb.to}
                  title={returnCrumb.label}
                  className={cn("max-w-52 min-w-0 truncate", textClassName)}
                >
                  {returnCrumb.label}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator className={separatorClassName} />
        {currentObject ? (
          <BreadcrumbItem className={itemClassName}>
            <BreadcrumbLink asChild>
              <Link to={`${pathname}?area=${area}`} className={textClassName}>
                {areaLabel}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem className={itemClassName}>
            {/* The current crumb is darker than the muted links via text-foreground
                (shadcn's default); font-medium adds the "bolder" emphasis. */}
            <BreadcrumbPage className={cn("font-medium text-foreground", textClassName)}>
              {areaLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {currentObject && (
          <>
            <BreadcrumbSeparator className={separatorClassName} />
            <BreadcrumbItem className={itemClassName}>
              <BreadcrumbPage
                title={currentObject}
                className={cn(
                  "max-w-56 min-w-0 truncate font-medium text-foreground",
                  textClassName,
                )}
              >
                {currentObject}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
