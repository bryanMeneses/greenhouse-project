import type { FieldState } from "./field-state";

/**
 * One contribution to a Field's value, traced back to a region of a Source
 * Document (challenge 01). One source is an identity; several combine as a sum,
 * or a transform when an `operator` subtracts. `deriveField` resolves the value.
 */
export type FieldSource = {
  /** id into SOURCE_DOCUMENTS. */
  documentId: string;
  /** 1-based page the value appears on. */
  page: number;
  /** Region key matching a SourceLine on that page — drives the viewer highlight. */
  region: string;
  /** Short excerpt from the Source Document, shown in the Provenance card. */
  snippet: string;
  /** This source's contribution to the Field value, in whole dollars. */
  amount: number;
  /** How the amount combines into the total. Defaults to "add"; "subtract" makes the Field a transform. */
  operator?: "add" | "subtract";
};

/**
 * A Preparer's correction to an AI-extracted Field (challenge 10). The AI's
 * original value stays in the Field's `value`; this records what the Preparer
 * changed it to, so both can be shown ("AI said $4,200 · you changed to $4,250").
 */
export type FieldCorrection = {
  /** The value the Preparer entered in place of the AI's. */
  value: number;
};

/** A single value on a Return, tied to the Source Document it was extracted from. */
export type Field = {
  id: string;
  /** What the value represents, e.g. "Wages, tips, other comp". */
  label: string;
  /** The AI-extracted amount, in whole dollars. Stays put even after a correction. */
  value: number;
  state: FieldState;
  /** The Source Document shown on the compact row, e.g. "W-2 (Acme Corp)". */
  sourceDocument: string;
  /**
   * The authoritative Provenance chain. Present on extracted Fields; absent on
   * preparer-entered (editable) and computed (locked) Fields. When present, the
   * Field value equals the sum of the contributions (see `deriveField`).
   */
  sources?: FieldSource[];
  /**
   * The AI's certainty in this extracted value, as a fraction in [0, 1]
   * (challenge 10). Present on AI-extracted Fields; absent on preparer-entered
   * and computed Fields. Banded for display by `bandForConfidence`.
   */
  confidence?: number;
  /** The AI's evidence/reasoning in plain language, shown on the Provenance card. */
  rationale?: string;
  /** The Preparer's correction, if any. When set, `currentValue` returns it. */
  correction?: FieldCorrection;
  /** Why a locked Field can't be changed. Required when `state` is "locked". */
  lockedReason?: string;
};

/**
 * The Field's current value: the Preparer's correction if one exists, otherwise
 * the AI's extracted value. Every display surface reads through this so a
 * corrected Field never shows its stale AI number as the live figure.
 */
export function currentValue(field: Field): number {
  return field.correction ? field.correction.value : field.value;
}

/** A group of related Fields on a Return, e.g. Income or Deductions. */
export type Section = {
  id: string;
  title: string;
  fields: Field[];
};

/** Where a Return sits in its lifecycle. */
export type Stage = "intake" | "in-review" | "ready-to-file";

/**
 * Who a next action sits with. A Preparer-owned Open Item is the Preparer's to
 * clear; a Client-owned one means the Return is blocked waiting on the taxpayer —
 * the signal that lands a Return in "Waiting on others" on the dashboard (#6).
 */
export type OpenItemOwner = "preparer" | "client";

/**
 * An outstanding action on a Return, with a clear owner. CONTEXT.md's definition
 * also carries urgency; that isn't a per-item field yet — the dashboard derives a
 * Return's urgency from its deadline, blockers, and Review Queue (`rankDashboard`).
 */
export type OpenItem = {
  id: string;
  /** What needs doing, e.g. "Confirm dividend amount on corrected 1099-DIV". */
  label: string;
  owner: OpenItemOwner;
};

/** A tax return prepared for one Client for one tax year. */
export type Return = {
  id: string;
  client: string;
  taxYear: number;
  stage: Stage;
  /**
   * The filing deadline, as an ISO date (YYYY-MM-DD). Drives the dashboard's
   * overdue / near-deadline ranking (#6), measured against a reference "today".
   */
  deadline: string;
  /** Outstanding actions on the Return; Client-owned ones mean it's blocked. */
  openItems: OpenItem[];
  sections: Section[];
};
