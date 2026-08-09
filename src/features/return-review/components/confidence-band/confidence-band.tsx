import {
  bandForConfidence,
  formatConfidence,
  CONFIDENCE_BAND_CONFIG,
} from "@/features/return-review/model/confidence";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConfidenceBandProps = {
  /** The AI's raw certainty for the Field, as a fraction in [0, 1]. */
  confidence: number;
  /**
   * Where the exact percentage shows. `"hover"` (default) keeps the band the
   * headline and reveals the % in a tooltip — for compact Return rows, where
   * inline would crowd; the % is also in an sr-only label so assistive users
   * never depend on hover. `"inline"` prints the % beside the band — for the
   * Provenance card, where there's room and the Preparer is inspecting.
   */
  percentDisplay?: "hover" | "inline";
  className?: string;
};

/**
 * How honest the AI is being about one Field (challenge 10): a High/Medium/Low
 * band chip, with the exact percentage on hover or inline (see `percentDisplay`).
 * Reads from CONFIDENCE_BAND_CONFIG so every surface bands and colours a Field
 * the same way.
 */
export function ConfidenceBand({
  confidence,
  percentDisplay = "hover",
  className,
}: ConfidenceBandProps) {
  const band = bandForConfidence(confidence);
  const config = CONFIDENCE_BAND_CONFIG[band];
  const Icon = config.icon;
  const exact = formatConfidence(confidence);

  const chip = (
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
      {config.label} Confidence
      {percentDisplay === "inline" ? (
        <span className="font-normal tabular-nums">· {exact}</span>
      ) : (
        // The % is available to assistive tech without needing the hover tooltip.
        <span className="sr-only"> ({exact})</span>
      )}
    </span>
  );

  if (percentDisplay === "inline") return chip;

  // Provider is embedded so the band stays drop-in on any surface (and in
  // isolated tests) without each caller wiring one up.
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>{exact} Confidence</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
