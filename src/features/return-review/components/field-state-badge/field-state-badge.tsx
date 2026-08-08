import {
  FIELD_STATE_CONFIG,
  type FieldState,
} from "@/features/return-review/model/field-state";
import { cn } from "@/lib/utils";

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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.badgeClassName,
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-3.5", config.iconClassName)}
      />
      {config.label}
    </span>
  );
}
