import {
  currentValue,
  type Field,
} from "@/features/return-review/model/returns";
import { cn, formatCurrency } from "@/lib/utils";

type CorrectionNoteProps = {
  field: Field;
  className?: string;
};

/**
 * The one place the "AI said $X · you changed to $Y" note is written
 * (challenge 10), so the Return row and the Provenance card never drift on the
 * wording. Keeps the AI's original (`field.value`) beside the Preparer's
 * correction (`currentValue`). Renders nothing when the Field is uncorrected.
 */
export function CorrectionNote({ field, className }: CorrectionNoteProps) {
  if (!field.correction) return null;

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      AI said{" "}
      <span className="font-medium tabular-nums text-foreground">
        {formatCurrency(field.value)}
      </span>{" "}
      · you changed to{" "}
      <span className="font-medium tabular-nums text-foreground">
        {formatCurrency(currentValue(field))}
      </span>
    </p>
  );
}
