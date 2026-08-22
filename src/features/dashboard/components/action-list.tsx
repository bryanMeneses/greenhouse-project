import { Link } from "react-router";
import { AlertTriangle, ChevronRight, CircleDot } from "lucide-react";

import type { ActionItem } from "@/features/dashboard/command-center";
import { focusToParam } from "@/hooks/use-return-view";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<ActionItem["kind"], string> = {
  review: "AI review",
  "open-item": "Open item",
};

/**
 * "Work that needs you" — the cross-Return action list (challenge 07). Ranks the
 * Preparer's own next actions (a review batch, an Open Item) across every Return,
 * not the Returns themselves, and each row deep-links straight into the review
 * workspace where the work happens (challenge 04). Every action is reachable: the
 * list scrolls within a capped height so the landing page's layout stays put while
 * nothing past the fold goes missing. The header carries the honest total.
 */
export function ActionList({ items }: { items: ActionItem[] }) {
  return (
    <section
      aria-labelledby="action-list-title"
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-0.5">
          <h2
            id="action-list-title"
            className="font-serif text-lg font-semibold tracking-tight"
          >
            Work that needs you
          </h2>
          <p className="text-sm text-muted-foreground">
            Ranked across every return you own.
          </p>
        </div>
        {items.length > 0 && (
          <span
            aria-label={`${items.length} action${items.length === 1 ? "" : "s"} in total`}
            className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums"
          >
            {items.length}
          </span>
        )}
      </header>

      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground sm:px-6">
          Nothing outstanding — you're all caught up.
        </p>
      ) : (
        <ul className="max-h-[22rem] overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="border-b border-border last:border-b-0"
            >
              <ActionRow item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ActionRow({ item }: { item: ActionItem }) {
  const Icon = item.urgent ? AlertTriangle : CircleDot;
  const summary = `${item.label}. ${item.client}, ${KIND_LABEL[item.kind]}. ${item.deadline}.`;
  const to = `/returns/${item.returnId}?area=${item.area}${
    item.focus ? `&focus=${focusToParam(item.focus)}` : ""
  }`;

  return (
    <Link
      to={to}
      aria-label={summary}
      className={cn(
        "flex items-center gap-3 px-5 py-3.5 transition-colors sm:px-6",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "size-4 shrink-0",
          item.urgent ? "text-destructive" : "text-muted-foreground",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.client} · {KIND_LABEL[item.kind]}
        </p>
      </div>
      <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {item.deadline}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </Link>
  );
}
