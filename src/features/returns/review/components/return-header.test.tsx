import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReturnHeader } from "./return-header";
import { getReturn } from "@/mocks/returns";

const NGUYEN = getReturn("rtn-nguyen-2024")!;

describe("ReturnHeader", () => {
  it("shows the return's identity", () => {
    render(<ReturnHeader taxReturn={NGUYEN} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Nguyen Family" }),
    ).toBeInTheDocument();
    expect(screen.getByText("RET-2024-011")).toBeInTheDocument();
    expect(screen.getByText(/2024 INDIVIDUAL Return/i)).toBeInTheDocument();
  });

  it("badges the Messages action with the open count and fires the callback", async () => {
    const user = userEvent.setup();
    const onOpenMessages = vi.fn();
    render(
      <ReturnHeader
        taxReturn={NGUYEN}
        messageCount={3}
        onOpenMessages={onOpenMessages}
      />,
    );

    const messages = screen.getByRole("button", { name: /Messages/ });
    expect(messages).toHaveTextContent("3");

    await user.click(messages);
    expect(onOpenMessages).toHaveBeenCalledOnce();
  });
});
