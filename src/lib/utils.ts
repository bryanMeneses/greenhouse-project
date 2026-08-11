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
