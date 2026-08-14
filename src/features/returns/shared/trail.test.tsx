import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { axe } from "vitest-axe";

import { Trail } from "./trail";
import { ConnectionLink } from "./connection-link";
import type { Connection } from "./connections";
import { getReturn } from "@/mocks/returns";
import { getThreadsForReturn } from "@/mocks/collaboration";

const taxReturn = getReturn("rtn-nguyen-2024")!;
const threads = getThreadsForReturn(taxReturn.id);
const connection: Connection = {
  id: "field->document",
  label: "W-2 (Acme Corp)",
  relationship: "Source Document",
  target: { kind: "source-document", id: "doc-w2-acme" },
  area: "documents",
};
const threadConnection: Connection = {
  id: "field->thread",
  label: "W-2 wages — a quick check on Box 1",
  relationship: "Thread",
  target: { kind: "thread", id: "thread-nguyen-w2" },
  area: "messages",
};
const PATHNAME = "/returns/rtn-nguyen-2024";

function renderTrail() {
  return render(
    <MemoryRouter
      initialEntries={[
        `${PATHNAME}?area=messages&focus=thread:thread-nguyen-1098`,
      ]}
    >
      <Trail taxReturn={taxReturn} viewerFamily="firm" threads={threads} />
      <ConnectionLink connection={connection} />
    </MemoryRouter>,
  );
}

describe("Return Trail and Connection links", () => {
  it("crumbs Command center › Return › Area › focused object, with the object current", () => {
    renderTrail();

    const trail = screen.getByRole("navigation", { name: "Trail" });
    expect(trail).toHaveTextContent(
      /Command center.*Nguyen Family · 2024.*Messages.*Requesting your Form 1098/,
    );
    // The Return crumb links back to Overview.
    expect(
      screen.getByRole("link", { name: "Nguyen Family · 2024" }),
    ).toHaveAttribute("href", `${PATHNAME}?area=overview`);
    // The focused object is the current crumb.
    expect(trail.querySelector("[aria-current='page']")).toHaveTextContent(
      "Requesting your Form 1098",
    );
  });

  it("uses the Client's top-most level instead of Command center, with no Return crumb", () => {
    render(
      <MemoryRouter
        initialEntries={[
          `/?area=tasks&focus=open-item:rtn-nguyen-2024-req-1098`,
        ]}
      >
        <Trail taxReturn={taxReturn} viewerFamily="client" threads={threads} />
      </MemoryRouter>,
    );

    const trail = screen.getByRole("navigation", { name: "Trail" });
    expect(trail).toHaveTextContent(/My Return.*Tasks.*2024 Form 1098/);
    expect(trail).not.toHaveTextContent("Command center");
    // "My Return" is the Client's Return, so there is no extra Return crumb.
    expect(trail).not.toHaveTextContent("Nguyen Family · 2024");
  });

  it("marks the Area as current when nothing is focused", () => {
    render(
      <MemoryRouter initialEntries={[`${PATHNAME}?area=documents`]}>
        <Trail taxReturn={taxReturn} viewerFamily="firm" threads={threads} />
      </MemoryRouter>,
    );

    const trail = screen.getByRole("navigation", { name: "Trail" });
    expect(trail.querySelector("[aria-current='page']")).toHaveTextContent(
      "Documents",
    );
  });

  it("names a Connection's target kind, so a document link never reads as a thread", () => {
    render(
      <MemoryRouter initialEntries={[`${PATHNAME}?area=overview`]}>
        <ConnectionLink connection={connection} />
        <ConnectionLink connection={threadConnection} />
      </MemoryRouter>,
    );

    const documentLink = screen.getByRole("link", {
      name: "Source Document: W-2 (Acme Corp)",
    });
    const threadLink = screen.getByRole("link", {
      name: "Thread: W-2 wages — a quick check on Box 1",
    });
    expect(documentLink).toHaveTextContent("Source Document");
    expect(threadLink).toHaveTextContent("Thread");
    expect(threadLink).not.toHaveTextContent("Source Document");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderTrail();
    expect(await axe(container)).toHaveNoViolations();
  });
});
