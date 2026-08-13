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

type TrailProps = {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  threads?: Thread[];
};

/** The top-most destination each shell breadcrumbs from — the Firm's Dashboard, or
 * the Client's standing "My Return". Both are `/`, the same route the Role forks. */
const HOME_CRUMB: Record<RoleFamily, { label: string; to: string }> = {
  firm: { label: "Dashboard", to: "/" },
  client: { label: "My Return", to: "/" },
};

/**
 * One breadcrumb atop a Return. The shell's top-most level always comes first;
 * on a Return it reads `Dashboard › Nguyen Family · 2024 › Area › object` — the
 * Return crumb links back to Overview, then the active Area, then the focused
 * object (current crumb marked). The Client's top-most level is their "My
 * Return", which doubles as the Return crumb since `/` is their whole shell.
 */
export function Trail({ taxReturn, viewerFamily, threads = [] }: TrailProps) {
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

  return (
    <Breadcrumb aria-label="Trail">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={home.to}>{home.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {returnCrumb && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={returnCrumb.to}>{returnCrumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        <BreadcrumbSeparator />
        {currentObject ? (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`${pathname}?area=${area}`}>{areaLabel}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem>
            {/* The current crumb is darker than the muted links via text-foreground
                (shadcn's default); font-medium adds the "bolder" emphasis. */}
            <BreadcrumbPage className="font-medium text-foreground">
              {areaLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
        {currentObject && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-56 truncate font-medium text-foreground">
                {currentObject}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
