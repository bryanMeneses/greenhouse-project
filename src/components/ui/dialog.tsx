import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  /** Accessible name — the id of the element (usually the title) labelling the dialog. */
  labelledBy: string;
  /** Optional id of the element describing the dialog. */
  describedBy?: string;
  /** Called on Escape, backdrop click, or the close button. */
  onClose: () => void;
  /** Extra classes for the panel (e.g. width). */
  className?: string;
  children: React.ReactNode;
};

/**
 * A modal dialog primitive. Radix isn't installed and jsdom lacks native
 * `<dialog>`, so this hand-rolls the accessibility contract: role="dialog"
 * + aria-modal, Escape and backdrop-click to close, a focus trap, focus moved
 * in on open and returned to the trigger on close, and a locked body scroll.
 * Rendered only while open (the caller conditionally mounts it).
 */
export function Dialog({
  labelledBy,
  describedBy,
  onClose,
  className,
  children,
}: DialogProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Move focus into the panel on open; return it to the trigger on close.
  React.useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Escape closes; Tab is trapped within the panel.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable =
      panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!focusable || focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4 animate-in fade-in-0 [animation-duration:200ms]"
      // Backdrop click (but not clicks that bubble from the panel) closes.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          "relative w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-lg outline-none",
          // shadcn-style entrance: subtle fade + zoom. The width transition
          // (for callers that grow the panel) is driven by the caller's classes.
          "animate-in fade-in-0 zoom-in-95 [animation-duration:200ms]",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** A consistently placed close button for the dialog's top-right corner. */
export function DialogCloseButton({
  onClose,
  label = "Close",
}: {
  onClose: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className={cn(
        "absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card cursor-pointer",
      )}
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  );
}
