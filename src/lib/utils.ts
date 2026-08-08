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
