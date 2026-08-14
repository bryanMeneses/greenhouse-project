import * as React from "react";
import { useNavigate } from "react-router";
import { Briefcase, FileText, LayoutDashboard, Search } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { STAGE_LABEL } from "@/features/dashboard/return-presentation";
import { RETURNS } from "@/mocks/returns";

/**
 * Global ⌘K / Ctrl+K search (challenge 04-adjacent): jump straight to any Return by
 * client, return number, or stage from anywhere in the firm shell — no drilling
 * through the roster. A launch pad, not a results page; selecting navigates.
 */
export function CommandSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Search returns…</span>
        <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a return or a section of the app."
      >
        <CommandInput placeholder="Search returns by client, number, or stage…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>

          <CommandGroup heading="Go to">
            <CommandItem
              value="command center dashboard home"
              onSelect={() => go("/")}
            >
              <LayoutDashboard aria-hidden="true" />
              Command center
            </CommandItem>
            <CommandItem
              value="returns roster all book queue"
              onSelect={() => go("/returns")}
            >
              <Briefcase aria-hidden="true" />
              All returns
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Returns">
            {RETURNS.map((taxReturn) => (
              <CommandItem
                key={taxReturn.id}
                value={`${taxReturn.client} ${taxReturn.returnNumber} ${STAGE_LABEL[taxReturn.stage]} ${taxReturn.taxYear}`}
                onSelect={() => go(`/returns/${taxReturn.id}`)}
              >
                <FileText aria-hidden="true" />
                <span className="flex-1">{taxReturn.client}</span>
                <CommandShortcut>
                  {STAGE_LABEL[taxReturn.stage]}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
