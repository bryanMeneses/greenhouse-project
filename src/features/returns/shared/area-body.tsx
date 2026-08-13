import type { ReactNode } from "react";

import type { RoleFamily } from "@/lib/roles";
import type { Return } from "./returns";
import type { Viewer, Thread } from "./collaboration";
import type { ReturnAreaId } from "./areas";
import type { FieldAction } from "@/features/returns/review/components/return-review";
import { ReturnReview } from "@/features/returns/review/components/return-review";
import { ReturnStatus } from "@/features/returns/client-view/components/return-status";
import { DocumentsSection } from "./documents-section";
import { RequestsActivityPanel } from "./requests-activity-panel";
import { CollaborationSection } from "./collaboration-section";

export type ReturnAreaBodyProps = {
  /** Which Area's composed surface to render. */
  area: ReturnAreaId;
  /** The viewer's Role family — decides which Area bodies exist and their props. */
  viewerFamily: RoleFamily;
  /** Threads already filtered to the viewer's audience (the caller owns the boundary). */
  threads: Thread[];
  /** Jump to a Thread from a Request row or activity row (Firm Requests Area). */
  onSelectThread?: (threadId: string) => void;
  /** The viewer, for composing Messages in the Messages Area. */
  viewer?: Viewer;
  /**
   * The Return each Area reads: the reviewed copy on the Firm, the fulfilled
   * (display) copy on the Client. Documents and Tasks on the Client read the raw
   * seed Return instead — a fulfilled Request still lists as an open Request there.
   */
  taxReturn: Return;
  /** The raw seed Return — the Client's Documents/Tasks read today's raw state. */
  seedReturn?: Return;
  /** Firm Overview is the review workspace; without this, Overview is Client status. */
  firmReview?: { onAction: (action: FieldAction) => void };
  /** Client Overview: hide the complexity map until first-run is done. */
  showComplexity?: boolean;
};

/**
 * The one Area → body mapping, shared by both shells. The Firm and Client renderers
 * only supply their chrome (a Tabs bar vs. conditional mounting + first-run gating);
 * adding an Area means adding it to the manifest (`areas.ts`) and one case here —
 * never editing two renderers with different idioms.
 */
export function ReturnAreaBody({
  area,
  viewerFamily,
  threads,
  onSelectThread,
  viewer,
  taxReturn,
  seedReturn,
  firmReview,
  showComplexity,
}: ReturnAreaBodyProps): ReactNode | null {
  switch (area) {
    case "overview":
      if (firmReview) {
        return (
          <ReturnReview return={taxReturn} onAction={firmReview.onAction} />
        );
      }
      return (
        <ReturnStatus taxReturn={taxReturn} showComplexity={showComplexity} />
      );
    case "documents":
      return (
        <DocumentsSection
          taxReturn={seedReturn ?? taxReturn}
          viewerFamily={viewerFamily}
        />
      );
    case "requests":
    case "tasks":
      return (
        <RequestsActivityPanel
          taxReturn={seedReturn ?? taxReturn}
          threads={threads}
          viewerFamily={viewerFamily}
          onSelectThread={onSelectThread}
        />
      );
    case "messages":
      return viewer ? (
        <CollaborationSection
          taxReturn={taxReturn}
          viewerFamily={viewerFamily}
          viewer={viewer}
        />
      ) : null;
  }
}
