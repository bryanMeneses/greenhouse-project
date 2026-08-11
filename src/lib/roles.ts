/**
 * The role-aware domain model (challenge 05, ADR-0005). A User is an identity
 * that holds one or more Roles; the shell renders against the User's active Role.
 * Every Role belongs to one of two families (Firm / Client), so the active Role
 * also says which side of the firm the User is on. Mirrors CONTEXT.md's Preparer
 * and Client actors. This module is pure config + types; the demo Users live in
 * `@/mocks/users`.
 */

/** Which actor family a Role belongs to (see CONTEXT.md). */
export type RoleFamily = "firm" | "client";

/** The six Roles the product serves, across the Firm and Client families. */
export type Role =
  | "preparer"
  | "reviewer"
  | "firm-admin"
  | "seasonal-staff"
  | "individual-taxpayer"
  | "business-owner";

export type RoleConfig = {
  /** Human label shown in the switcher and header. */
  label: string;
  family: RoleFamily;
  /** One-line description of the Role, shown in the role switcher. */
  description: string;
  /**
   * Whether this Role has a real adapted experience yet. Only `preparer` and
   * `individual-taxpayer` are built (ADR-0005, foundation-first); the rest are
   * modeled so the product's full role surface stays legible, but shown inert.
   */
  implemented: boolean;
};

export const ROLE_CONFIG: Record<Role, RoleConfig> = {
  preparer: {
    label: "Preparer",
    family: "firm",
    description: "Own and work a client's return.",
    implemented: true,
  },
  reviewer: {
    label: "Reviewer",
    family: "firm",
    description: "Approve a preparer's work before filing.",
    implemented: false,
  },
  "firm-admin": {
    label: "Firm Admin",
    family: "firm",
    description: "Manage staff, clients, and firm settings.",
    implemented: false,
  },
  "seasonal-staff": {
    label: "Seasonal Staff",
    family: "firm",
    description: "Temporary preparer with a limited view.",
    implemented: false,
  },
  "individual-taxpayer": {
    label: "Individual Taxpayer",
    family: "client",
    description: "Track your personal return.",
    implemented: true,
  },
  "business-owner": {
    label: "Business Owner",
    family: "client",
    description: "Track your business's return.",
    implemented: false,
  },
};

/** Display label for a Role family. */
export const FAMILY_LABEL: Record<RoleFamily, string> = {
  firm: "Firm",
  client: "Client",
};

export function roleConfig(role: Role): RoleConfig {
  return ROLE_CONFIG[role];
}

/** A person with an identity in the platform; holds one or more Roles. */
export type User = {
  id: string;
  name: string;
  /** Two-letter avatar initials. */
  initials: string;
  /** The Roles this User holds. A multi-role User switches active Role among them. */
  roles: Role[];
  /**
   * The Return this User owns as a Client, if any. Present on Users with a Client
   * Role so their client landing has a Return to summarize. Ids reference RETURNS.
   */
  clientReturnId?: string;
};

/**
 * The active Role: which User is acting as which Role right now. This is the one
 * thing the shell renders against — pick a Role and its family tells you the side.
 */
export type ActiveRole = { userId: string; role: Role };
