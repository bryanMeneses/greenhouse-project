import * as React from "react";
import { useNavigate } from "react-router";

import { returnReducer } from "@/features/returns/review/components/return-review";
import { ReturnHeader } from "@/features/returns/review/components/return-header";
import { PreparerStatusBand } from "@/features/returns/shared/preparer-status-band";
import {
  openRequests,
  type Thread,
  type Viewer,
} from "@/features/returns/shared/collaboration";
import type { Return } from "@/features/returns/shared/returns";
import { FIRM_AREAS } from "@/features/returns/shared/areas";
import { ReturnAreaBody } from "@/features/returns/shared/area-body";
import { useCanGoBack } from "@/hooks/use-can-go-back";
import { useReturnView } from "@/hooks/use-return-view";
import type { RoleFamily } from "@/lib/roles";

type ReturnWorkspaceProps = {
  taxReturn: Return;
  viewerFamily: RoleFamily;
  viewer: Viewer;
  /** The Return's Threads, computed once by the page so the same set feeds both
   *  the header Trail and the Area bodies below. */
  threads: Thread[];
};

/** The Firm Return's Areas, composed from the existing review and collaboration surfaces. */
export function ReturnWorkspace({
  taxReturn,
  viewerFamily,
  viewer,
  threads,
}: ReturnWorkspaceProps) {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();
  const { area, setView } = useReturnView({
    areas: FIRM_AREAS.map((candidate) => candidate.id),
  });
  // The review working copy lives at the workspace level, above the Areas, so a
  // Preparer's in-progress corrections survive switching Areas and back (#5).
  const [reviewedReturn, dispatch] = React.useReducer(returnReducer, taxReturn);
  const collabCount = openRequests(taxReturn.openItems).length;

  const openMessages = () => {
    setView({ area: "messages", focus: null });
  };

  return (
    <>
      <ReturnHeader
        taxReturn={taxReturn}
        messageCount={collabCount}
        onOpenMessages={openMessages}
        onBack={canGoBack ? () => navigate(-1) : undefined}
      />

      {/* The active Area's body. Messages is the one Area force-mounted: it is the
          sole CollaborationSection (no duplicate focus targets), and keeping it
          mounted preserves an in-flight compose draft and optimistically-sent
          messages across a switch. Every other Area mounts only when active, so a
          followed Connection focuses the right, visible copy. */}
      {FIRM_AREAS.map((candidate) => {
        const isActive = candidate.id === area;
        const forceMount = candidate.id === "messages";
        if (!isActive && !forceMount) return null;
        return (
          <div
            key={candidate.id}
            className={isActive ? "flex flex-col gap-6" : "hidden"}
          >
            {/* Return status belongs to Overview alone — the other Areas are
                surfaces in their own right, not the status summary. */}
            {candidate.id === "overview" && (
              <PreparerStatusBand
                taxReturn={taxReturn}
                title="Return status"
                subtitle="Where this return stands right now — the same view your client sees."
              />
            )}
            <ReturnAreaBody
              area={candidate.id}
              taxReturn={reviewedReturn}
              viewerFamily={viewerFamily}
              threads={threads}
              viewer={viewer}
              onSelectThread={(threadId) =>
                setView({
                  area: "messages",
                  focus: { kind: "thread", id: threadId },
                })
              }
              firmReview={{ onAction: dispatch }}
            />
          </div>
        );
      })}
    </>
  );
}
