import type { Role, RoleFamily } from "@/lib/roles";
import { getThreadsForReturn } from "@/mocks/collaboration";
import type { Return } from "./returns";
import { Thread } from "./thread";
import { RequestsActivityPanel } from "./requests-activity-panel";

type CollaborationSectionProps = {
  taxReturn: Return;
  /** The viewer's Role family — decides audience filtering and the layout. */
  viewerFamily: RoleFamily;
  /** The viewer, for authoring optimistically-sent Messages. */
  viewer: { role: Role; name: string };
};

/**
 * The collaboration slice mounted on a Return workspace (challenge 02), shared by
 * the Preparer review and the Client view via the 05 role switch. It renders the
 * Return's Threads in place plus — for the firm — the Requests & Activity panel
 * alongside them. The Client sees the same Threads through the same components,
 * but audience-filtered (no Internal notes) and without the firm's panel, since
 * their own Requests already surface in the return-status view.
 */
export function CollaborationSection({
  taxReturn,
  viewerFamily,
  viewer,
}: CollaborationSectionProps) {
  const threads = getThreadsForReturn(taxReturn.id);
  if (threads.length === 0) return null;

  const isFirm = viewerFamily === "firm";

  return (
    <section
      aria-label="Collaboration"
      className={
        isFirm
          ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
          : "flex flex-col gap-4"
      }
    >
      <div className="order-2 flex flex-col gap-4 lg:order-1">
        {threads.map((thread) => (
          <Thread
            key={thread.id}
            thread={thread}
            viewerFamily={viewerFamily}
            viewer={viewer}
          />
        ))}
      </div>

      {isFirm && (
        <div className="order-1 lg:order-2 lg:sticky lg:top-4">
          <RequestsActivityPanel
            taxReturn={taxReturn}
            threads={threads}
            viewerFamily={viewerFamily}
          />
        </div>
      )}
    </section>
  );
}
