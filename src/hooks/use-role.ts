import * as React from "react";

import type { Role, RoleConfig, RoleFamily, User } from "@/lib/roles";

/**
 * Role-aware context for the whole app (challenge 05, ADR-0005). The active Role
 * lives here, in context — not in the URL — so routes stay shared and what you see
 * at a path depends on who you are. The provider is in `@/app/providers`; this
 * module holds the context and its hooks.
 */
export type RoleContextValue = {
  /** The User currently acting. */
  user: User;
  /** The Role that User is currently acting as. */
  role: Role;
  /** The active Role's config (label, family, description). */
  roleConfig: RoleConfig;
  /** Switch the active Role within the current User (the role switch). */
  setRole: (role: Role) => void;
  /** Switch which demo User you're acting as; resets to that User's first Role. */
  setUser: (userId: string) => void;
};

export const RoleContext = React.createContext<RoleContextValue | null>(null);

export function useRole(): RoleContextValue {
  const ctx = React.useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}

/** Convenience for surfaces that only branch on the active Role's family. */
export function useRoleFamily(): RoleFamily {
  return useRole().roleConfig.family;
}
