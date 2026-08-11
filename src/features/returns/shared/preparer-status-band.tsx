import { AlertTriangle, Clock } from "lucide-react";

import type { Return } from "./returns";
import type { ReturnStatus } from "./derive-status";
import { SEED_TODAY } from "@/mocks/returns";
import { deriveReturnStatus } from "./derive-status";
import { Tracker, BlockingCallout } from "./tracker";

// ─── Props ─────────────────────────────────────────────────────────────────

type PreparerStatusBandProps = {
  taxReturn: Return;
};

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * The Preparer's status band atop {@link ReturnView}. Standing context while the
 * Preparer works: the shared stepper, an audience-relative blocking callout, and
 * grouped open items with blockers emphasized. Consumes the one
 * `deriveReturnStatus` module.
 */
export function PreparerStatusBand({ taxReturn }: PreparerStatusBandProps) {
  const status = deriveReturnStatus(taxReturn, SEED_TODAY);

  // Audience-relative: the Preparer is blocked when the client owns open items.
  const blockedByClient = status.blockedBy === "client";
  const hasPreparerItems = status.openItemsByOwner.preparer.length > 0;

  return (
    <section
      aria-label="Return status"
      className="w-full rounded-lg border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Progress: stepper, blocking, deadline. */}
        <div className="flex flex-col gap-4">
          <Tracker status={status} audience="preparer" />

          {/* Audience-relative: client-owned items block the preparer. Surfaced
              once, emphasized, here — no muted duplicate elsewhere. */}
          {blockedByClient && (
            <BlockingCallout
              message="Waiting on this client"
              items={status.openItemsByOwner.client.map((i) => i.label)}
            />
          )}

          <DeadlineFlag status={status} deadline={taxReturn.deadline} />
        </div>

        {/* A persistent side panel of what the Preparer still owns. */}
        <div className="flex flex-col gap-2 md:border-l md:border-border md:pl-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your open items
          </p>
          {hasPreparerItems ? (
            <ul className="flex flex-col gap-1.5">
              {status.openItemsByOwner.preparer.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nothing on you right now.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Deadline flag ─────────────────────────────────────────────────────────

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDeadline(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function DeadlineFlag({
  status,
  deadline,
}: {
  status: ReturnStatus;
  deadline: string;
}) {
  const { deadline: dl } = status;
  const formatted = formatDeadline(deadline);

  if (dl.isOverdue) {
    return (
      <p
        role="alert"
        className="flex items-center gap-1.5 text-sm font-medium text-destructive"
      >
        <AlertTriangle aria-hidden="true" className="size-4" />
        Overdue — was due {formatted} ({Math.abs(dl.daysUntilDeadline)}{" "}
        {Math.abs(dl.daysUntilDeadline) === 1 ? "day" : "days"} ago)
      </p>
    );
  }

  if (dl.isNearDeadline) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-warning">
        <Clock aria-hidden="true" className="size-4" />
        Due {formatted} ({dl.daysUntilDeadline}{" "}
        {dl.daysUntilDeadline === 1 ? "day" : "days"})
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Due {formatted} ({dl.daysUntilDeadline} days)
    </p>
  );
}
