import { useNavigate } from "react-router";
import { ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { FAMILY_LABEL, ROLE_CONFIG, type Role } from "@/lib/roles";
import { USERS } from "@/mocks/users";

/** The Roles modeled but not yet built (ADR-0005), shown as an inert footer. */
const COMING_SOON = (Object.keys(ROLE_CONFIG) as Role[])
  .filter((role) => !ROLE_CONFIG[role].implemented)
  .map((role) => ROLE_CONFIG[role].label);

/**
 * The header identity control (challenge 05). Shows who you are and the Role you're
 * acting as, and — for a multi-role User — lets you switch Role. A "Demo logins"
 * section swaps the active User so both the multi-role and single-role cases are
 * reachable. Switching lands you on `/`, home for the Role you picked, so a switch
 * never strands you on a route the new Role can't see.
 */
export function RoleSwitcher() {
  const { user, role, roleConfig, setRole, setUser } = useRole();
  const navigate = useNavigate();
  const canSwitchRole = user.roles.length > 1;

  function switchRole(next: Role) {
    if (next !== role) {
      setRole(next);
      navigate("/");
    }
  }

  function switchUser(userId: string) {
    if (userId !== user.id) {
      setUser(userId);
      navigate("/");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Switch role. Acting as ${user.name}, ${roleConfig.label}.`}
          className="h-auto justify-start gap-2 p-1 pl-2 text-left focus-visible:ring-offset-card"
        >
          <div className="leading-tight">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">
              {roleConfig.label} · {FAMILY_LABEL[roleConfig.family]}
            </div>
          </div>
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground"
          >
            {user.initials}
          </span>
          <ChevronsUpDown
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        {canSwitchRole && (
          <>
            <DropdownMenuLabel>Switch role</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={role}
              onValueChange={(value) => switchRole(value as Role)}
            >
              {user.roles.map((held) => {
                const config = ROLE_CONFIG[held];
                return (
                  <DropdownMenuRadioItem key={held} value={held}>
                    <div className="leading-tight">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {FAMILY_LABEL[config.family]} · {config.description}
                      </div>
                    </div>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuLabel>Demo logins</DropdownMenuLabel>
        {USERS.map((candidate) => {
          const isActive = candidate.id === user.id;
          const summary =
            candidate.roles.length > 1
              ? "Multi-role"
              : ROLE_CONFIG[candidate.roles[0]].label;
          return (
            <DropdownMenuItem
              key={candidate.id}
              onSelect={() => switchUser(candidate.id)}
            >
              <div className="leading-tight">
                <div className={cn("font-medium", isActive && "text-primary")}>
                  {candidate.name}
                  {isActive && " · current"}
                </div>
                <div className="text-xs text-muted-foreground">{summary}</div>
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          One product, six roles. {COMING_SOON.join(", ")} experiences are
          coming soon.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
