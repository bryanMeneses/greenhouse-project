import * as React from "react";
import { useSearchParams } from "react-router";

import type { ReturnAreaId } from "@/features/returns/shared/areas";
import type {
  ConnectionTarget,
  ConnectionTargetKind,
} from "@/features/returns/shared/connections";

/** A focused object is a typed Connection target — one id namespace per kind, so a
 * field id can never collide with a document or thread id when matching a row. */
export type ReturnFocus = ConnectionTarget;

export type ReturnViewState = {
  area: ReturnAreaId;
  focus: ReturnFocus | null;
};

type UseReturnViewOptions = {
  areas?: readonly ReturnAreaId[];
  defaultArea?: ReturnAreaId;
};

type SetViewOptions = {
  /** Replace the current history entry instead of pushing (closing a modal). */
  replace?: boolean;
};

const DEFAULT_AREA: ReturnAreaId = "overview";

const FOCUS_KINDS: readonly ConnectionTargetKind[] = [
  "field",
  "source-document",
  "thread",
  "open-item",
  "return",
];

/** Serialize a focus object into the URL's `focus` search param (`kind:id`). */
export function focusToParam(focus: ReturnFocus): string {
  return `${focus.kind}:${focus.id}`;
}

/** Parse the URL's `focus` param back into a typed focus, or null when unknown. */
export function focusFromParam(raw: string | null): ReturnFocus | null {
  if (!raw) return null;
  const separator = raw.indexOf(":");
  if (separator <= 0) return null;
  const kind = raw.slice(0, separator) as ConnectionTargetKind;
  const id = raw.slice(separator + 1);
  if (!id || !FOCUS_KINDS.includes(kind)) return null;
  return { kind, id };
}

/**
 * The single owner of within-Return navigation state. Areas and focused objects
 * are search params rather than route segments, so both audience shells share the
 * same deep-link shape and browser history records every move. A Router is always
 * in scope in the app; unit tests that exercise this wrap their render in one.
 */
export function useReturnView({
  areas,
  defaultArea = DEFAULT_AREA,
}: UseReturnViewOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedAreas = areas ?? [];
  const rawArea = searchParams.get("area") as ReturnAreaId | null;
  const area =
    rawArea && (allowedAreas.length === 0 || allowedAreas.includes(rawArea))
      ? rawArea
      : defaultArea;
  const focus = focusFromParam(searchParams.get("focus"));

  const setView = React.useCallback(
    (next: Partial<ReturnViewState>, options: SetViewOptions = {}) => {
      setSearchParams(
        (current) => {
          const updated = new URLSearchParams(current);
          if (next.area !== undefined) updated.set("area", next.area);
          if (next.focus !== undefined) {
            if (next.focus) updated.set("focus", focusToParam(next.focus));
            else updated.delete("focus");
          }
          return updated;
        },
        { replace: options.replace },
      );
    },
    [setSearchParams],
  );

  const setArea = React.useCallback(
    (nextArea: ReturnAreaId, options?: SetViewOptions) =>
      setView({ area: nextArea }, options),
    [setView],
  );
  const setFocus = React.useCallback(
    (
      nextFocus: ReturnFocus | null,
      nextArea?: ReturnAreaId,
      options?: SetViewOptions,
    ) =>
      setView(
        { focus: nextFocus, ...(nextArea ? { area: nextArea } : {}) },
        options,
      ),
    [setView],
  );

  React.useEffect(() => {
    if (!focus || typeof document === "undefined") return;
    const target = document.querySelector<HTMLElement>(
      `[data-return-focus="${focus.id}"][data-return-focus-kind="${focus.kind}"]`,
    );
    if (target) target.focus({ preventScroll: false });
  }, [area, focus]);

  return { area, focus, setView, setArea, setFocus };
}
