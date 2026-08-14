import { describe, expect, it } from "vitest";
import { render as baseRender, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";

// DocumentsSection reads within-Return view state through useReturnView, so a
// Router is always in scope — the app provides one; here the tests do.
const render = ((
  ui: Parameters<typeof baseRender>[0],
  options?: Parameters<typeof baseRender>[1],
) =>
  baseRender(ui, { wrapper: MemoryRouter, ...options })) as typeof baseRender;
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { DocumentsSection } from "./documents-section";
import { getReturn } from "@/mocks/returns";

const taxReturn = getReturn("rtn-nguyen-2024")!;

describe("DocumentsSection — the uploaded-files library", () => {
  it("lists the real uploads as files with name, kind, size, and upload date", () => {
    render(<DocumentsSection taxReturn={taxReturn} viewerFamily="firm" />);

    expect(
      screen.getByRole("heading", { name: "Documents" }),
    ).toBeInTheDocument();
    // The W-2 is a file in the library, not a review-map row.
    const file = screen.getByRole("button", { name: /W-2 \(Acme Corp\)/ });
    expect(file).toHaveTextContent("application/pdf");
    expect(file).toHaveTextContent(/1 page/);
    expect(file).toHaveTextContent(/KB/);
    expect(file).toHaveTextContent(/Feb/);
  });

  it("offers a primary Upload document action in the header", () => {
    render(<DocumentsSection taxReturn={taxReturn} viewerFamily="firm" />);

    expect(
      screen.getByRole("button", { name: "Upload document" }),
    ).toBeInTheDocument();
  });

  it("opens a selected file's metadata, CDN link, and connected Fields", async () => {
    const user = userEvent.setup();
    render(<DocumentsSection taxReturn={taxReturn} viewerFamily="firm" />);

    await user.click(screen.getByRole("button", { name: /W-2 \(Acme Corp\)/ }));

    const detail = screen.getByRole("complementary", {
      name: "Selected document detail",
    });
    expect(
      within(detail).getByRole("heading", { name: "W-2 (Acme Corp)" }),
    ).toBeInTheDocument();
    expect(within(detail).getByText("W-2 (Acme Corp).pdf")).toBeInTheDocument();
    // A CDN URL, not an in-app viewer — the shape a real upload would load from.
    const viewDocument = within(detail).getByRole("link", {
      name: /View document/i,
    });
    expect(viewDocument).toHaveAttribute(
      "href",
      "https://cdn.ledgerline.example/documents/doc-w2-acme.pdf",
    );
    // The fields it feeds are listed, and the connections are navigable.
    expect(
      within(detail).getByText(/Fields this document feeds/i),
    ).toBeInTheDocument();
    expect(
      within(detail).getAllByText(/Wages, tips, other comp/).length,
    ).toBeGreaterThan(0);
  });

  it("keeps the document selectable via a deep-link focus", () => {
    baseRender(
      <MemoryRouter
        initialEntries={[
          "/returns/rtn-nguyen-2024?area=documents&focus=source-document:doc-1099div-vanguard",
        ]}
      >
        <DocumentsSection taxReturn={taxReturn} viewerFamily="firm" />
      </MemoryRouter>,
    );

    const detail = screen.getByRole("complementary", {
      name: "Selected document detail",
    });
    expect(
      within(detail).getByRole("heading", { name: "1099-DIV (Vanguard)" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DocumentsSection taxReturn={taxReturn} viewerFamily="firm" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
