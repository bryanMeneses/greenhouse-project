import * as React from "react";
import type { LucideIcon } from "lucide-react";

type AreaSectionProps = {
  /** Uppercase eyebrow above the title (e.g. "Uploaded files"). */
  eyebrow: string;
  /** The icon rendered beside the eyebrow. */
  icon: LucideIcon;
  /** The serif section title. */
  title: string;
  /** Supporting description under the title. */
  description: string;
  /** Optional right-aligned header action (e.g. "Upload document"). */
  action?: React.ReactNode;
  /** The section body — composed by each Area, not this shell. */
  children: React.ReactNode;
};

/**
 * The shared visual shell every Return Area body renders in: the Area's identity
 * (icon eyebrow + serif title + description, plus an optional right-aligned action)
 * stands on its own above a bordered body card, separated by a margin so the header
 * reads as a heading rather than a bar wedged onto the content. Documents, Messages,
 * and Requests & Activity all read as the same surface; only the body differs, and
 * it is passed as composable `children`.
 */
export function AreaSection({
  eyebrow,
  icon: Icon,
  title,
  description,
  action,
  children,
}: AreaSectionProps) {
  const headingId = React.useId();

  return (
    <section aria-labelledby={headingId} className="flex w-full flex-col gap-4">
      <header className="flex items-start justify-between gap-4 px-1">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {eyebrow}
            </p>
          </div>
          <h2
            id={headingId}
            className="font-serif text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {children}
      </div>
    </section>
  );
}
