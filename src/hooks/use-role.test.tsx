import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useRole } from "./use-role";
import { RoleProvider } from "@/app/providers";

/** A tiny probe that surfaces the active Role and exposes the switchers. */
function Probe() {
  const { user, roleConfig, setRole, setUser } = useRole();
  return (
    <div>
      <p>
        {user.name} — {roleConfig.label}
      </p>
      <button onClick={() => setRole("individual-taxpayer")}>to client</button>
      <button onClick={() => setUser("user-dana")}>login dana</button>
    </div>
  );
}

function renderProbe() {
  return render(
    <RoleProvider>
      <Probe />
    </RoleProvider>,
  );
}

describe("RoleProvider", () => {
  beforeEach(() => localStorage.clear());

  it("boots into the default active Role: Jordan as Preparer", () => {
    renderProbe();
    expect(screen.getByText("Jordan Avery — Preparer")).toBeInTheDocument();
  });

  it("switches the active Role within the current User", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("button", { name: "to client" }));

    expect(
      screen.getByText("Jordan Avery — Individual Taxpayer"),
    ).toBeInTheDocument();
  });

  it("switches the active User and resets to that User's first Role", async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole("button", { name: "login dana" }));

    expect(screen.getByText("Dana Reyes — Preparer")).toBeInTheDocument();
  });

  it("restores a persisted active Role on the next boot", () => {
    localStorage.setItem(
      "greenhouse:active-role",
      JSON.stringify({ userId: "user-dana", role: "preparer" }),
    );
    renderProbe();
    expect(screen.getByText("Dana Reyes — Preparer")).toBeInTheDocument();
  });

  it("falls back to the default when the stored active Role is invalid", () => {
    // Dana doesn't hold a client Role — an incoherent active Role is ignored.
    localStorage.setItem(
      "greenhouse:active-role",
      JSON.stringify({ userId: "user-dana", role: "individual-taxpayer" }),
    );
    renderProbe();
    expect(screen.getByText("Jordan Avery — Preparer")).toBeInTheDocument();
  });
});
