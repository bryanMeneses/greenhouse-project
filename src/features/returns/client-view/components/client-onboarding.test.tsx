import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";

import { ClientOnboarding } from "./client-onboarding";
import { NEW_CLIENT_ONBOARDING } from "@/mocks/onboarding";

describe("ClientOnboarding", () => {
  it("puts the first Client action before deferred preparer work", () => {
    render(
      <ClientOnboarding seed={NEW_CLIENT_ONBOARDING} onComplete={vi.fn()} />,
    );

    expect(
      screen.getByRole("heading", { name: "Let's get your return started" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload Form 1098/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your preparer reviews the return"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /preparer reviews/i }),
    ).not.toBeInTheDocument();
  });

  it("simulates the document and questionnaire actions, then offers the full return", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <ClientOnboarding seed={NEW_CLIENT_ONBOARDING} onComplete={onComplete} />,
    );

    await user.click(screen.getByRole("button", { name: /Upload Form 1098/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/no file is sent anywhere/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload document" }));

    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(
      screen.getByText("2024 Form 1098 from your lender").closest("li"),
    ).toHaveTextContent("Received");

    await user.click(screen.getByRole("button", { name: /Confirm details/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save answers" }));

    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Your part is complete")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /View your return/i }));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("flags the time-sensitive first step but not the routine one", () => {
    render(
      <ClientOnboarding seed={NEW_CLIENT_ONBOARDING} onComplete={vi.fn()} />,
    );

    expect(
      screen.getByText("Add your tax documents").closest("li"),
    ).toHaveTextContent("Time-sensitive");
    expect(
      screen.getByText("Confirm a few details").closest("li"),
    ).not.toHaveTextContent("Time-sensitive");
  });

  it("returns focus to the step's button after its dialog closes", async () => {
    const user = userEvent.setup();
    render(
      <ClientOnboarding seed={NEW_CLIENT_ONBOARDING} onComplete={vi.fn()} />,
    );

    const uploadButton = screen.getByRole("button", {
      name: /Upload Form 1098/i,
    });
    await user.click(uploadButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Dismiss without completing, so the triggering button still exists to
    // receive focus back — the imperatively-opened dialog has no DialogTrigger.
    await user.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(uploadButton).toHaveFocus());
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ClientOnboarding seed={NEW_CLIENT_ONBOARDING} onComplete={vi.fn()} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
