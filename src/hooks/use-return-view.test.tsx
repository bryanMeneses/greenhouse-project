import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router";

import { useReturnView } from "./use-return-view";
import { FIRM_AREAS } from "@/features/returns/shared/areas";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/returns/rtn-reyes-2024?area=unknown"]}>
      {children}
    </MemoryRouter>
  );
}

function useViewAndLocation() {
  const view = useReturnView({
    areas: FIRM_AREAS.map((area) => area.id),
  });
  const location = useLocation();
  const navigationType = useNavigationType();
  return { view, location, navigationType };
}

describe("useReturnView", () => {
  it("falls back to Overview for an unknown Area without throwing", () => {
    const { result } = renderHook(() => useViewAndLocation(), { wrapper });
    expect(result.current.view.area).toBe("overview");
    expect(result.current.view.focus).toBeNull();
  });

  it("writes Area and a typed focus to search params with a history push", () => {
    const { result } = renderHook(() => useViewAndLocation(), { wrapper });

    act(() => {
      result.current.view.setView({
        area: "documents",
        focus: { kind: "source-document", id: "doc-w2-acme" },
      });
    });

    expect(result.current.view.area).toBe("documents");
    expect(result.current.view.focus).toEqual({
      kind: "source-document",
      id: "doc-w2-acme",
    });
    // The kind separator is a URL-encoded colon; the round-trip decodes it.
    expect(result.current.location.search).toBe(
      "?area=documents&focus=source-document%3Adoc-w2-acme",
    );
    expect(result.current.navigationType).toBe("PUSH");
  });

  it("can clear focus without changing the active Area", () => {
    const { result } = renderHook(() => useViewAndLocation(), { wrapper });

    act(() => {
      result.current.view.setView({
        area: "messages",
        focus: { kind: "thread", id: "thread-1" },
      });
    });
    act(() => {
      result.current.view.setFocus(null);
    });

    expect(result.current.view.area).toBe("messages");
    expect(result.current.view.focus).toBeNull();
    expect(result.current.location.search).toBe("?area=messages");
  });

  it("replaces the history entry when asked to (closing a modal)", () => {
    const { result } = renderHook(() => useViewAndLocation(), { wrapper });

    act(() => {
      result.current.view.setView(
        { area: "overview", focus: { kind: "field", id: "wages" } },
        { replace: true },
      );
    });

    expect(result.current.location.search).toBe(
      "?area=overview&focus=field%3Awages",
    );
    // Replace: the entry is swapped in place, not pushed — so the browser Back
    // stack never grows from closing a modal.
    expect(result.current.navigationType).toBe("REPLACE");
  });

  it("reads a bare, un-typed focus param as unknown (falls back to no focus)", () => {
    const { result } = renderHook(() => useViewAndLocation(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter
          initialEntries={[
            "/returns/rtn-reyes-2024?area=documents&focus=doc-w2-acme",
          ]}
        >
          {children}
        </MemoryRouter>
      ),
    });

    // The legacy bare-id deep link has no kind namespace, so it is not a valid
    // focus — the Return still renders (default Area), nothing crashes.
    expect(result.current.view.area).toBe("documents");
    expect(result.current.view.focus).toBeNull();
  });
});
