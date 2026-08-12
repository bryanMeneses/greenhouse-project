import * as React from "react";

/**
 * Return focus to whatever opened a Dialog, for Dialogs opened imperatively.
 *
 * Radix returns focus to a `<DialogTrigger>` automatically, but we open Dialogs
 * via state from components now near where Dialog is being comosed,
 * like a Field row, a checklist button, the Review Queue, etc.
 * Rather thanwrapping every opener in a trigger, so there is nothing for Radix to return to.
 * This records the element that held focus as the Dialog opens and hands focus
 * back to it on close.
 *
 * Spread the result onto `<DialogContent>`:
 *
 *     const returnFocus = useDialogReturnFocus();
 *     <DialogContent {...returnFocus}>
 */
export function useDialogReturnFocus(): {
  onOpenAutoFocus: (event: Event) => void;
  onCloseAutoFocus: (event: Event) => void;
} {
  const openerRef = React.useRef<HTMLElement | null>(null);

  return {
    // Fires just before Radix moves focus into the panel — focus is still on the
    // opener here, so capture it. We don't preventDefault: Radix still focuses in.
    onOpenAutoFocus: () => {
      openerRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event) => {
      event.preventDefault();
      openerRef.current?.focus();
      openerRef.current = null;
    },
  };
}
