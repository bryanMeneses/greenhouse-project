import { MessagesSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Return } from "@/features/returns/shared/returns";

type ReturnHeaderProps = {
  taxReturn: Return;
  /** Open request count, badged on the Messages action. */
  messageCount?: number;
  /** Jump to the Collaboration tab. */
  onOpenMessages?: () => void;
};

/**
 * The Return's identity block, anchoring the whole review page (#19). An eyebrow +
 * serif name give the return a face the top chrome bar never did, with the
 * human-facing return number as a badge and the return's form / year / owner on a
 * quiet meta line. Right-aligned actions carry the two return-level verbs —
 * Messages (into Collaboration) and Mark ready — kept out of the tab body so they
 * stay reachable whichever tab is open.
 */
export function ReturnHeader({
  taxReturn,
  messageCount,
  onOpenMessages,
}: ReturnHeaderProps) {
  const category = taxReturn.returnType.split(" ")[0].toUpperCase();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {taxReturn.taxYear} {category} Return
          </span>
          <Badge variant="outline" className="font-normal tabular-nums">
            {taxReturn.returnNumber}
          </Badge>
        </div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          {taxReturn.client}
        </h1>
        <p className="text-sm text-muted-foreground">
          {taxReturn.returnType} · Tax year {taxReturn.taxYear} · Owned by{" "}
          {taxReturn.ownerName}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenMessages}
        >
          <MessagesSquare aria-hidden="true" />
          Messages
          {messageCount ? (
            <Badge className="ml-0.5 min-w-5 justify-center px-1 tabular-nums">
              {messageCount}
            </Badge>
          ) : null}
        </Button>
        {/* "Mark ready" is deferred until the ready-to-file flow exists.
        <Button type="button" size="sm">
          <CheckCircle2 aria-hidden="true" />
          Mark ready
        </Button>
        */}
      </div>
    </header>
  );
}
