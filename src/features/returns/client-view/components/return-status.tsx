import { CircleCheck, Clock } from "lucide-react";

import type {
  OpenItem,
  Return,
  Stage,
} from "@/features/returns/shared/returns";

/**
 * Client-facing wording for a Return's Stage. Deliberately plain and reassuring —
 * the same lifecycle the Preparer sees, told without firm-internal vocabulary.
 * The shared-status challenge (06) will formalize this; this is the thin version.
 */
const STAGE_COPY: Record<Stage, { label: string; description: string }> = {
  intake: {
    label: "Getting started",
    description: "We're gathering and organizing your documents.",
  },
  "in-review": {
    label: "In review",
    description: "Your preparer is reviewing your return.",
  },
  "ready-to-file": {
    label: "Ready to file",
    description: "Your return is ready — just a few final steps.",
  },
};

type ReturnStatusProps = {
  /** The Return this client owns, or undefined if none is on file yet. */
  taxReturn?: Return;
};

/**
 * The Client audience's read-only view of their Return (client-view). A
 * deliberately thin surface: it proves the shell adapts to a Client — friendly
 * status and a clear "what's next for you" — without building the full client
 * return experience, which is deferred to challenges 06/02/03.
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

  const stage = STAGE_COPY[taxReturn.stage];
  const waitingOnYou = taxReturn.openItems.filter(
    (item) => item.owner === "client",
  );
  const withPreparer = taxReturn.openItems.filter(
    (item) => item.owner === "preparer",
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold">
            Your {taxReturn.taxYear} return
          </h2>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {stage.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {stage.description}
        </p>
      </section>

      <ClientItemGroup
        icon={Clock}
        iconClassName="text-destructive"
        title="Waiting on you"
        emptyText="Nothing needs you right now."
        items={waitingOnYou}
      />

      <ClientItemGroup
        icon={CircleCheck}
        iconClassName="text-primary"
        title="With your preparer"
        emptyText="Your preparer has no open items on your return."
        items={withPreparer}
      />

      <p className="text-xs text-muted-foreground">
        A detailed view of your return is coming soon.
      </p>
    </div>
  );
}

type ClientItemGroupProps = {
  icon: typeof Clock;
  iconClassName: string;
  title: string;
  emptyText: string;
  items: OpenItem[];
};

function ClientItemGroup({
  icon: Icon,
  iconClassName,
  title,
  emptyText,
  items,
}: ClientItemGroupProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden="true" className={`size-4 ${iconClassName}`} />
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border bg-card px-4 py-3 text-sm"
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
