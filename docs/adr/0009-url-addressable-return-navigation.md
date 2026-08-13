# Two-tier navigation, URL-addressable return state, and cross-object navigation

Challenge 04 ("Getting Lost Between Parts of the App") is the connective capstone (ADR-0004), and it is the app's _navigation_ challenge specifically. The objects on a Return already connect in the _data_ — a Field is extracted from a Source Document, a Thread anchors to a Subject, a Request asks for a document — but today those connections aren't traversable in the UI, the only thing in the URL is `returnId`, and within-return view state is component-local. So there is no deep linking, the browser's Back can't return a User to a previous step, and — the piece the case study explicitly asks for — there is no visible **global vs. contextual navigation**.

We build the full answer, accepting the shell refactor it requires:

1. **Two navigation tiers in one sidebar.** The **global tier** is the sidebar's top level — "the app", independent of any one Return. The **contextual tier** is the active Return's **Areas** (Overview, Documents, Requests & Activity, Messages) rendered _nested_ under it. One sidebar shows both, so "global vs. contextual" is something you can see and use, not a breadcrumb standing in for it.

   The two audiences differ in what "the open Return" means, so the tiers differ accordingly:
   - **Firm:** a Preparer has no single "the Return" — they work many, opened from the Dashboard. So the global tier is **Dashboard alone** (no standing Return item), and the contextual Area tier appears **only on a Return route** (`/returns/:id`), headed by that open Return's identity (client · year) linking to its Overview. On the Dashboard there is no Area tier.
   - **Client:** exactly one Return, so it is their standing destination — a persistent **"My Return"** with its (lighter) Areas nested, revealed once first-run onboarding completes.

   Exactly one item is marked current per tier: on a Return the open Return owns "where you are" (Dashboard is _not_ lit), plus its current Area.

2. **Migrate the hand-rolled shell to shadcn's Sidebar** (ADR-0002 — prefer shadcn over hand-rolled primitives). Its nested `SidebarMenuSub` expresses the contextual tier natively, and collapse/mobile come for free. This replaces the hand-rolled `AppShell`/`Sidebar`.
3. **Within-return view state lives in the URL.** The active Area and the focused object move into search params, so every Area/object is a **Deep link** and browser history becomes the backbone of the **Trail**. Both shells read this through one shared hook.
4. **Connections are navigable.** A single pure resolver turns the already-modelled edges (a Field's sources, a Thread's Subject, a Document's connected Fields, a Request's Thread) into links a User follows in place — including across Areas (a Message → the Documents Area, focused on that document).
5. **A visible Trail.** A breadcrumb (`Return › Area › object`) plus a Back control (browser `navigate(-1)`) on both shells — the orientation tool over the top of the two tiers.

**Areas are compositions, not new features.** Each Area reuses existing surfaces — Documents is the `ComplexityNavigator` scoped to source documents, Requests & Activity is the requests panel, Messages is `CollaborationSection`, Overview is the status + review summary. Splitting today's two workspace tabs into Areas is re-composition, not net-new product surface.

**How this coexists with challenge 03.** ch. 03 owns _first-run_ (the contextual tier stays hidden until onboarding is done — the same deferral it already applies to Messages); ch. 04 owns _steady-state_ navigation once the Return has objects to move between. They stop overlapping instead of fighting.

**Alternatives considered.** A breadcrumb-only "connective layer" with no contextual sidebar was considered and rejected — it under-answers the case study's explicit global-vs-contextual bullet, trading away the clearest artifact of the challenge to save refactoring. Keeping the hand-rolled sidebar was rejected (ADR-0002). A second, competing left rail (dual-sidebar) was rejected in favour of one context-aware sidebar, which reads as one product and doesn't overwhelm the deliberately lean Client shell. Keeping view state component-local was rejected — it fails 04's deep-linking and return-to-workflow requirements outright.

**Consequences.** A shadcn `sidebar` dependency and a refactor of `AppShell` + both layouts; the Firm return workspace's tabs become Areas driven by the URL; the Client return page gains the same tier post-onboarding. New glossary terms land: **Connection**, **Trail**, **Deep link**, **Area**. A refresh or shared link restores the exact Area + focused object. Cross-Return navigation stays out of scope while only one Return is seeded.

**Fix-phase amendments (2026-08-13).** After the first build and a two-axis review, three decisions were settled and this ADR updated to match what shipped:

- **Trail is browser history, not a labelled session stack.** The originally-planned "← Back to <previous>" label backed by a popped `{label, area, focus}` session stack was dropped. Every Connection-follow is already a history push, so a plain Back control (`navigate(-1)`) is the simpler correct backbone and restores focus to the target heading. The breadcrumb stays; only the labelled back-affordance was reduced to a generic Back button.
- **Modal close replaces instead of pushes.** A focus-driven modal (the Firm `ProvenanceCard`) opens as a pushed history entry (its Deep link) but **closes via `history.replace`**, so mouse-Back no longer oscillates the dialog open/closed. `useReturnView`'s `setView` takes a `{ replace }` option for this.
- **No separate "All work" Firm Area.** The full `ComplexityNavigator` map lives inside Overview; a fifth "All work" Area was dropped as redundant. Firm Areas are Overview, Documents, Requests & Activity, Messages.
- **The Requests Area is labelled "Requests & Activity"** — the sidebar item and its panel heading share one name, matching the case study's own "requests / questions" vocabulary rather than a vaguer "Recent Activity".
