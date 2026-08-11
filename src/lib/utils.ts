import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Format a whole-dollar amount for display, e.g. 84250 → "$84,250". */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * Format a date (ISO string or Date) as a short "Aug 2". Accepts a bare
 * `YYYY-MM-DD` (parsed at local midnight so the day never shifts) or a full ISO
 * timestamp. Used for message timestamps in the collaboration surfaces.
 */
export function formatShortDate(value: string | Date): string {
  const date =
    typeof value === "string" && value.length === 10
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return shortDateFormatter.format(date);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * A relative timestamp for a message, measured against the supplied reference time
 * (never the wall clock) so callers can keep seeded surfaces deterministic. Falls
 * back to the short date once something is more than a week old — "3 days ago" is
 * useful, "37 days ago" is not.
 */
export function formatRelativeToSeed(value: string | Date, now: Date): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const days = Math.round((now.getTime() - then.getTime()) / MS_PER_DAY);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatShortDate(value);
}
