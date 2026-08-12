import * as React from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  Clock3,
  FileUp,
  ListChecks,
  MessageCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  onboardingProgress,
  type ClientOnboardingItem,
  type ClientOnboardingSeed,
} from "@/features/returns/client-view/onboarding";
import { useDialogReturnFocus } from "@/hooks/use-dialog-return-focus";
import { cn } from "@/lib/utils";

// ─── Props ───────────────────────────────────────────────────────────────────

type ClientOnboardingProps = {
  seed: ClientOnboardingSeed;
  /** Called when a simulated action fulfills one of the Return's Requests. */
  onActionComplete?: (item: ClientOnboardingItem) => void;
  /** Called after the Client has completed their first-run actions and chooses to continue. */
  onComplete: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * The first surface a new Client sees (Challenge 03). It leads with one clear
 * next action, keeps the preparer's work visible but non-actionable, and defers
 * collaboration until the Client has finished these first steps. Actions are
 * simulated in dialogs; their Request ids still point to the Return's shared
 * Open Items rather than creating an onboarding-only task list.
 */
export function ClientOnboarding({
  seed,
  onActionComplete,
  onComplete,
}: ClientOnboardingProps) {
  const [completedIds, setCompletedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
  const progress = onboardingProgress(seed.items, completedIds);
  const activeItem = seed.items.find((item) => item.id === activeItemId);

  function finishItem(itemId: string) {
    const item = seed.items.find((candidate) => candidate.id === itemId);
    if (!item) return;

    setCompletedIds((current) => {
      const next = new Set(current);
      next.add(itemId);
      return next;
    });
    onActionComplete?.(item);
    setActiveItemId(null);
  }

  return (
    <section
      aria-labelledby="onboarding-title"
      className="overflow-hidden rounded-lg border border-primary/20 bg-card shadow-sm"
    >
      <div className="border-b border-border bg-primary/5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <Badge className="w-fit gap-1 bg-primary/10 text-primary">
              <ListChecks aria-hidden="true" />
              First steps
            </Badge>
            <div>
              <h2
                id="onboarding-title"
                className="font-serif text-2xl font-semibold tracking-tight"
              >
                Let&apos;s get your return started
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Two quick things from you, then your preparer can take it from
                here. We&apos;ll keep the next step clear at every point.
              </p>
            </div>
          </div>
          <ProgressSummary
            completed={progress.completed}
            total={progress.total}
          />
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">
              Your checklist
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Start with the highlighted action. Nothing else is required yet.
            </p>
          </div>
          <ol
            aria-label="Getting started checklist"
            className="flex flex-col gap-2"
          >
            {seed.items.map((item, index) => (
              <OnboardingStep
                key={item.id}
                item={item}
                number={index + 1}
                isComplete={completedIds.has(item.id)}
                onAction={() => setActiveItemId(item.id)}
              />
            ))}
          </ol>

          {progress.isReadyToFinish && (
            <div
              role="status"
              className="mt-2 flex flex-col gap-3 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-2">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                <div>
                  <p className="text-sm font-medium">Your part is complete</p>
                  <p className="text-xs text-muted-foreground">
                    Your preparer has the information needed to continue.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={onComplete}
                className="w-full sm:w-auto"
              >
                View your return
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <DocumentSnapshot
          documents={seed.documents.map((document) => ({
            ...document,
            state:
              document.state === "needed" &&
              completedIds.has("onboarding-documents")
                ? "received"
                : document.state,
          }))}
        />
      </div>

      <ActionDialog
        item={activeItem}
        onClose={() => setActiveItemId(null)}
        onComplete={() => activeItem && finishItem(activeItem.id)}
      />
    </section>
  );
}

// ─── Progress ───────────────────────────────────────────────────────────────

function ProgressSummary({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total === 0 ? 100 : Math.round((completed / total) * 100);

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-md border border-border bg-background px-3 py-2 sm:min-w-36">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Your progress
        </span>
        <span className="text-xs font-semibold tabular-nums text-primary">
          {completed} of {total}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label="First steps complete"
        className="h-1.5 bg-secondary"
      />
    </div>
  );
}

// ─── Checklist ──────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  ClientOnboardingItem["kind"],
  { icon: typeof FileUp; waitingLabel?: string }
> = {
  document: { icon: FileUp },
  questionnaire: { icon: CircleHelp },
  "preparer-review": { icon: Clock3, waitingLabel: "After your steps" },
};

function OnboardingStep({
  item,
  number,
  isComplete,
  onAction,
}: {
  item: ClientOnboardingItem;
  number: number;
  isComplete: boolean;
  onAction: () => void;
}) {
  const config = KIND_CONFIG[item.kind];
  const Icon = config.icon;
  const isActionable = Boolean(item.actionLabel) && !isComplete;
  const isTimeSensitive = isActionable && item.urgency === "high";
  const statusLabel = isComplete
    ? "Done"
    : (config.waitingLabel ??
      (item.state === "in-progress" ? "Start here" : "Next"));

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-3",
        isActionable
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-background",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          isComplete
            ? "bg-primary text-primary-foreground"
            : isActionable
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
        )}
      >
        {isComplete ? <Check className="size-3.5" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Icon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0",
              isActionable ? "text-primary" : "text-muted-foreground",
            )}
          />
          <p className="text-sm font-medium">{item.title}</p>
          <Badge
            variant={isComplete ? "secondary" : "outline"}
            className={cn(
              "text-[10px]",
              isActionable && "border-primary/30 text-primary",
            )}
          >
            {statusLabel}
          </Badge>
          {isTimeSensitive && (
            <Badge
              variant="outline"
              className="gap-1 border-warning/30 text-[10px] text-warning"
            >
              <Clock3 aria-hidden="true" className="size-3" />
              Time-sensitive
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>
      {isActionable && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAction}
          className="shrink-0 self-center border-primary/30 text-primary hover:bg-primary/10"
        >
          {item.actionLabel}
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </li>
  );
}

// ─── Document snapshot ──────────────────────────────────────────────────────

function DocumentSnapshot({
  documents,
}: {
  documents: ClientOnboardingSeed["documents"];
}) {
  return (
    <aside
      aria-labelledby="document-snapshot-title"
      className="flex flex-col gap-3 rounded-md border border-border bg-background p-4"
    >
      <div className="flex items-start gap-2">
        <FileUp aria-hidden="true" className="mt-0.5 size-4 text-primary" />
        <div>
          <h3 id="document-snapshot-title" className="text-sm font-semibold">
            Documents at a glance
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            We&apos;ll show what&apos;s received and what&apos;s still needed.
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {documents.map((document) => {
          const received = document.state === "received";
          return (
            <li key={document.id} className="flex items-center gap-2 text-sm">
              {received ? (
                <Check aria-hidden="true" className="size-3.5 text-primary" />
              ) : (
                <MessageCircle
                  aria-hidden="true"
                  className="size-3.5 text-warning"
                />
              )}
              <span className={cn(received && "text-muted-foreground")}>
                {document.title}
              </span>
              <Badge
                variant={received ? "secondary" : "outline"}
                className={cn(
                  "ml-auto text-[10px]",
                  !received && "border-warning/30 text-warning",
                )}
              >
                {received ? "Received" : "Needed"}
              </Badge>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ─── Simulated actions ──────────────────────────────────────────────────────

function ActionDialog({
  item,
  onClose,
  onComplete,
}: {
  item?: ClientOnboardingItem;
  onClose: () => void;
  onComplete: () => void;
}) {
  const isDocument = item?.kind === "document";
  const returnFocus = useDialogReturnFocus();

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent {...returnFocus}>
        <DialogHeader>
          <DialogTitle>{item?.title}</DialogTitle>
          <DialogDescription>
            {isDocument
              ? "This prototype simulates a secure document upload — no file is sent anywhere."
              : "This prototype uses sample answers so you can see the completed first-run experience."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
          {isDocument ? (
            <>
              <p className="font-medium text-foreground">2024 Form 1098</p>
              <p className="mt-1 text-xs">Mortgage interest from your lender</p>
            </>
          ) : (
            <ul className="flex list-disc flex-col gap-1 pl-4 text-xs">
              <li>Filing status: Married filing jointly</li>
              <li>Direct deposit: use the account on file</li>
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Button type="button" onClick={onComplete}>
            {isDocument ? "Upload document" : "Save answers"}
            <Check aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
