import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

import { FieldStateBadge } from "./field-state-badge";
import {
  FIELD_STATES,
  FIELD_STATE_CONFIG,
} from "@/features/return-review/model/field-state";

describe("FieldStateBadge", () => {
  it("shows the configured label for each Field State", () => {
    for (const state of FIELD_STATES) {
      const { unmount } = render(<FieldStateBadge state={state} />);
      expect(
        screen.getByText(FIELD_STATE_CONFIG[state].label),
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("has no accessibility violations for any state", async () => {
    for (const state of FIELD_STATES) {
      const { container, unmount } = render(<FieldStateBadge state={state} />);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });
});
