import {
  FIELD_STATE_CONFIG,
  type FieldState,
} from "@/features/returns/shared/field-state";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FieldStateBadgeProps = {
  state: FieldState;
  className?: string;
};

/**
 * The consistent visual treatment for a Field State — icon + label + colour tint.
 * Reads from FIELD_STATE_CONFIG so every Field surface speaks the same language.
 */
export function FieldStateBadge({ state, className }: FieldStateBadgeProps) {
  const config = FIELD_STATE_CONFIG[state];
  const Icon = config.icon;

  return (
    <Badge className={cn(config.badgeClassName, className)}>
      <Icon aria-hidden="true" className={config.iconClassName} />
      {config.label}
    </Badge>
  );
}
