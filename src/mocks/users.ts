/**
 * Seeded demo logins (no real auth, ADR-0005):
 * - Jordan Avery is multi-role — a firm Preparer who is also the Individual
 *   Taxpayer on their own Return. This is the case study's "employee with a
 *   personal return", and the User whose role switch is worth showing.
 * - Dana Reyes holds a single Firm Role — the "nothing to switch" contrast.
 *
 * The domain types (User, ActiveRole) live in `@/lib/roles`; the demo roster
 * plus the accessors/validators over it live here with the data.
 */
import type { ActiveRole, User } from "@/lib/roles";

export const USERS: User[] = [
  {
    id: "user-jordan",
    name: "Jordan Avery",
    initials: "JA",
    roles: ["preparer", "individual-taxpayer"],
    clientReturnId: "rtn-nguyen-2024",
  },
  {
    id: "user-dana",
    name: "Dana Reyes",
    initials: "DR",
    roles: ["preparer"],
  },
];

export function getUser(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

/** The active Role the app boots into: Jordan acting as Preparer. */
export const DEFAULT_ACTIVE_ROLE: ActiveRole = {
  userId: "user-jordan",
  role: "preparer",
};

/** Whether an active Role is coherent: the User exists and actually holds the Role. */
export function isValidActiveRole(activeRole: ActiveRole): boolean {
  const user = getUser(activeRole.userId);
  return !!user && user.roles.includes(activeRole.role);
}
