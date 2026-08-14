import {
  Briefcase,
  ListChecks,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  DashboardStat,
  DashboardStatId,
} from "@/features/dashboard/command-center";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Per-stat colour so the four tiles read apart at a glance — nothing loud, a tinted
 * icon chip and a top accent. Green = your active book, marigold = outstanding work,
 * red = the AI needs a human, slate = waiting on clients (the calmer signal). Keyed
 * by the closed `DashboardStatId` set, so every stat has an accent and none is missed.
 */
const STAT_ACCENT: Record<
  DashboardStatId,
  { icon: LucideIcon; bar: string; chip: string }
> = {
  active: {
    icon: Briefcase,
    bar: "border-t-primary",
    chip: "bg-primary/10 text-primary",
  },
  "open-items": {
    icon: ListChecks,
    bar: "border-t-brand",
    chip: "bg-brand/10 text-brand",
  },
  "needs-review": {
    icon: ShieldAlert,
    bar: "border-t-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
  requests: {
    icon: MessageSquare,
    bar: "border-t-muted-foreground/40",
    chip: "bg-muted text-muted-foreground",
  },
};

/**
 * The Command Center's headline row: four practice-wide numbers so the first thing
 * a Preparer sees is the shape of the whole book, not one Return. Read-only glance
 * cards — the work lives in the action list and queue below.
 */
export function StatTiles({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const accent = STAT_ACCENT[stat.id];
        const Icon = accent.icon;
        return (
          <Card
            key={stat.id}
            className={cn("gap-2 border-t-2 p-5", accent.bar)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-md",
                  accent.chip,
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
            </div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground">{stat.hint}</p>
          </Card>
        );
      })}
    </div>
  );
}
