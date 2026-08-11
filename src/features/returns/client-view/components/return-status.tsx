import type { Return } from "@/features/returns/shared/returns";
import { SEED_TODAY } from "@/mocks/returns";
import { deriveReturnStatus } from "@/features/returns/shared/derive-status";
import { Tracker, BlockingCallout } from "@/features/returns/shared/tracker";

// ─── Props ─────────────────────────────────────────────────────────────────

type ReturnStatusProps = {
  /** The Return this client owns, or undefined if none is on file yet. */
  taxReturn?: Return;
};

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * The Client audience's read-only view of their Return (challenge 06). The same
 * shared `deriveReturnStatus` truth the Preparer sees, told for the client: the
 * stepper in plain words, a reassuring deadline line, and — crucially — only the
 * client's own next action. The preparer's internal open items are never listed
 * here; the client sees a plain "your preparer is handling it" instead, so
 * firm-internal complexity doesn't leak across the boundary.
 */
export function ReturnStatus({ taxReturn }: ReturnStatusProps) {
  if (!taxReturn) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">
          You don't have a return in progress yet. When your preparer starts
          one, it'll show up here.
        </p>
      </div>
    );
  }

  const status = deriveReturnStatus(taxReturn, SEED_TODAY);
  const clientActions = status.openItemsByOwner.client;
  const blockedOnClient = status.blockedBy === "client";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <Tracker status={status} audience="client" />

        {/* Deadline: framed/reassuring for the Client. */}
        <ClientDeadlineLine
          deadline={taxReturn.deadline}
          daysUntilDeadline={status.deadline.daysUntilDeadline}
          isOverdue={status.deadline.isOverdue}
          isNearDeadline={status.deadline.isNearDeadline}
        />

        {/* The client's single primary next action — or reassurance when clear. */}
        {blockedOnClient ? (
          <div className="mt-4">
            <BlockingCallout
              message="We need this from you to keep your return moving"
              items={clientActions.map((i) => i.label)}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing needs your attention right now — your preparer is working on
            your return.
          </p>
        )}
      </section>

      {/* The firm side — summarized, never the preparer's internal task list. */}
      {blockedOnClient && (
        <p className="text-sm text-muted-foreground">
          Your preparer is handling everything else on their side — you only
          need to take care of the item above.
        </p>
      )}
    </div>
  );
}

// ─── Client deadline (framed/reassuring) ───────────────────────────────────

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

function ClientDeadlineLine({
  deadline,
  daysUntilDeadline,
  isOverdue,
  isNearDeadline,
}: {
  deadline: string;
  daysUntilDeadline: number;
  isOverdue: boolean;
  isNearDeadline: boolean;
}) {
  const formatted = formatDeadline(deadline);

  if (isOverdue) {
    return (
      <p className="mt-3 text-sm font-medium text-destructive">
        Your filing deadline ({formatted}) has passed. Your preparer will help
        sort this out.
      </p>
    );
  }

  if (isNearDeadline) {
    return (
      <p className="mt-3 text-sm font-medium text-warning">
        Your deadline is {formatted} — {daysUntilDeadline}{" "}
        {daysUntilDeadline === 1 ? "day" : "days"} away. We're on it.
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm text-muted-foreground">
      On track to file before {formatted}.
    </p>
  );
}
