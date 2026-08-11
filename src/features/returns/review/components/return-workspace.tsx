import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReturnReview } from "@/features/returns/review/components/return-review";
import { ReturnHeader } from "@/features/returns/review/components/return-header";
import { CollaborationSection } from "@/features/returns/shared/collaboration-section";
import { PreparerStatusBand } from "@/features/returns/shared/preparer-status-band";
import {
  openRequests,
  type Viewer,
} from "@/features/returns/shared/collaboration";
import type { Return } from "@/features/returns/shared/returns";
import type { RoleFamily } from "@/lib/roles";

/**
 * The firm review workspace: the Return's identity header, the persistent Shared
 * Return Status band, and a tab shell (#19). The status band stays on screen
 * across tabs — challenge 06's shared mental model is always visible — while the
 * Overview (review queue + income) and Collaboration (the inbox) swap below it.
 * The tab is controlled so the header's Messages action can jump to Collaboration;
 * both panels are force-mounted so review progress and drafts survive a tab switch.
 */
export function ReturnWorkspace({
  taxReturn,
  viewerFamily,
  viewer,
}: {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  viewer: Viewer;
}) {
  const [tab, setTab] = React.useState("overview");
  const collabCount = openRequests(taxReturn.openItems).length;

  return (
    <>
      <ReturnHeader
        taxReturn={taxReturn}
        messageCount={collabCount}
        onOpenMessages={() => setTab("collaboration")}
      />

      <PreparerStatusBand
        taxReturn={taxReturn}
        title="Return status"
        subtitle="Where this return stands right now — the same view your client sees."
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collaboration">
            Collaboration
            {collabCount > 0 && (
              <Badge className="ml-1 min-w-5 justify-center px-1 tabular-nums">
                {collabCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <ReturnReview return={taxReturn} />
        </TabsContent>

        <TabsContent
          value="collaboration"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <CollaborationSection
            taxReturn={taxReturn}
            viewerFamily={viewerFamily}
            viewer={viewer}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
