import * as React from "react";

import { roleConfig, type ActiveRole } from "@/lib/roles";
import { DEFAULT_ACTIVE_ROLE, getUser, isValidActiveRole } from "@/mocks/users";
import { RoleContext, type RoleContextValue } from "@/hooks/use-role";

/**
 * App-wide context providers (challenge 05, ADR-0005). Today that's the role
 * provider: it holds the active Role and adapts the shell to it. The active Role
 * persists to localStorage so a reload keeps who you're acting as, and is
 * validated on read so a stale or malformed value falls back to the default.
 */

const STORAGE_KEY = "greenhouse:active-role";

/** Read a persisted active Role, ignoring anything malformed or now-invalid. */
function readStoredActiveRole(): ActiveRole {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveRole;
      if (isValidActiveRole(parsed)) return parsed;
    }
  } catch {
    // Absent or malformed storage — fall through to the default.
  }
  return DEFAULT_ACTIVE_ROLE;
}

type RoleProviderProps = {
  children: React.ReactNode;
  /** Test seam: start from a fixed active Role instead of storage. */
  initialActiveRole?: ActiveRole;
};

export function RoleProvider({
  children,
  initialActiveRole,
}: RoleProviderProps) {
  const [activeRole, setActiveRole] = React.useState<ActiveRole>(
    () => initialActiveRole ?? readStoredActiveRole(),
  );

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeRole));
    } catch {
      // Persistence is best-effort; the app still works without it.
    }
  }, [activeRole]);

  const value = React.useMemo<RoleContextValue>(() => {
    // The active Role is validated on read, so the User is always present.
    const user = getUser(activeRole.userId)!;
    return {
      user,
      role: activeRole.role,
      roleConfig: roleConfig(activeRole.role),
      setRole: (role) => setActiveRole((prev) => ({ ...prev, role })),
      setUser: (userId) => {
        const next = getUser(userId);
        if (next) setActiveRole({ userId, role: next.roles[0] });
      },
    };
  }, [activeRole]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
