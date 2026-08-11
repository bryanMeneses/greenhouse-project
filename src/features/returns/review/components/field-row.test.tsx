import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FieldRow } from "./field-row";
import type { Field } from "@/features/returns/shared/returns";

const inspectableField: Field = {
  id: "interest",
  label: "Taxable interest",
  value: 1204,
  state: "ai-suggested",
  sourceDocument: "1099-INT (First National)",
};

const editableField: Field = {
  id: "salt",
  label: "State & local taxes",
  value: 10000,
  state: "editable",
  sourceDocument: "Preparer worksheet",
};

const lockedField: Field = {
  id: "estimated-payments",
  label: "Estimated tax payments",
  value: 4000,
  state: "locked",
  sourceDocument: "IRS account transcript",
  lockedReason: "Imported from the IRS account transcript — read-only.",
};

describe("FieldRow", () => {
  it("calls onInspect with the Field id when an inspectable value is activated", async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    render(<FieldRow field={inspectableField} onInspect={onInspect} />);

    await user.click(
      screen.getByRole("button", { name: /Review Taxable interest/ }),
    );

    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onInspect).toHaveBeenCalledWith("interest");
  });

  it("does not call onInspect while editing an editable Field", async () => {
    const user = userEvent.setup();
    const onInspect = vi.fn();
    render(<FieldRow field={editableField} onInspect={onInspect} />);

    // An editable Field is an input, not a clickable value.
    const input = screen.getByRole("textbox", { name: "State & local taxes" });
    await user.type(input, "5");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(onInspect).not.toHaveBeenCalled();
  });

  it("offers no inspect affordance for a locked Field", () => {
    const onInspect = vi.fn();
    render(<FieldRow field={lockedField} onInspect={onInspect} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(lockedField.lockedReason!)).toBeInTheDocument();
  });
});
