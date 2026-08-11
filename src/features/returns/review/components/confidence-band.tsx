import {
  bandForConfidence,
  formatConfidence,
  CONFIDENCE_BAND_CONFIG,
} from "@/features/returns/shared/confidence";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

  const confidenceBadge = (
    <Badge className={cn(config.badgeClassName, className)}>
      <Icon aria-hidden="true" className={config.iconClassName} />
      {config.label} Confidence
      {percentDisplay === "inline" ? (
        <span className="font-normal tabular-nums">· {exact}</span>
      ) : (
        // The % is available to assistive tech without needing the hover tooltip.
        <span className="sr-only"> ({exact})</span>
      )}
    </Badge>
  );

  if (percentDisplay === "inline") return confidenceBadge;

  // Provider is embedded so the band stays drop-in on any surface (and in
  // isolated tests) without each caller wiring one up.
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{confidenceBadge}</TooltipTrigger>
        <TooltipContent>{exact} Confidence</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
