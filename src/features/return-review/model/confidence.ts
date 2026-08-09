import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react";

/**
 * The AI's certainty in an extracted Field, expressed in bands (challenge 10).
 * The raw certainty is a fraction in [0, 1]; the band is what the Preparer reads,
 * with the exact percentage available on hover. Vocabulary is fixed by CONTEXT.md
 * ("High", "Medium", "Low") — avoid score/accuracy/probability.
 */
export type ConfidenceBand = "high" | "medium" | "low";

/** Fraction at or above which a Field's Confidence reads as High. */
const HIGH_CUTOFF = 0.9;
/** Fraction at or above which a Field's Confidence reads as Medium (else Low). */
const MEDIUM_CUTOFF = 0.7;

/**
 * Map a raw AI certainty (0–1) to its Confidence band. The boundaries are
 * inclusive-below: exactly 0.90 is High, exactly 0.70 is Medium. This is the one
 * place the thresholds live, so every surface bands a Field the same way.
 */
export function bandForConfidence(confidence: number): ConfidenceBand {
  if (confidence >= HIGH_CUTOFF) return "high";
  if (confidence >= MEDIUM_CUTOFF) return "medium";
  return "low";
}

/** The exact certainty as a whole-number percentage, e.g. 0.586 → "59%". */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export type ConfidenceBandConfig = {
  /** Human label shown on the band chip. */
  label: string;
  /** Decorative icon; always paired with the label, never used alone. */
  icon: LucideIcon;
  /** Chip background + text. Text stays dark for AA contrast; the tint carries the band. */
  badgeClassName: string;
  /** Icon tint. Icons are aria-hidden, so this is purely visual. */
  iconClassName: string;
};

/**
 * The single source of truth for Confidence-band visual treatment, mirroring
 * FIELD_STATE_CONFIG. High leans on the brand green (trust), Medium on the
 * marigold accent (caution), Low on the destructive tint (needs a look) — so the
 * band that most needs attention reads the loudest, consistently everywhere.
 */
export const CONFIDENCE_BAND_CONFIG: Record<
  ConfidenceBand,
  ConfidenceBandConfig
> = {
  high: {
    label: "High",
    icon: ShieldCheck,
    badgeClassName: "bg-secondary text-secondary-foreground",
    iconClassName: "text-primary",
  },
  medium: {
    label: "Medium",
    icon: ShieldQuestion,
    badgeClassName: "bg-brand/15 text-foreground",
    iconClassName: "text-brand",
  },
  low: {
    label: "Low",
    icon: ShieldAlert,
    badgeClassName: "bg-destructive/10 text-foreground",
    iconClassName: "text-destructive",
  },
};
