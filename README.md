# Ledgerline

An AI-powered tax platform for a CPA firm **and** its clients: a preparer opens a
client's return, reviews each AI-extracted value against its source document, and
works down a prioritized list of what needs attention — while clients see a
role-appropriate view of the same return.

This is a **frontend case study**. It's a real, clickable prototype (not mockups),
built to be judged on visual design, interaction design, information architecture,
and how the product _feels_. Everything behind the interface is deliberately quick
and dirty: hardcoded data, faked AI, no backend.

## Running it

```bash
npm install
npm run dev        # start the app (Vite)
npm run test       # run the test suite (Vitest)
npm run build      # typecheck + production build
```

## Try it as two different people

There's no real auth — a **role switcher** (top-right of the header) swaps who
you're acting as:

- **Jordan Avery** — a firm **Preparer** who is _also_ the taxpayer on their own
  personal return (prepared by a colleague, Dana). Switch Jordan between
  **Preparer** and **Individual Taxpayer** to see the same platform adapt to each
  role — the case study's "employee with a personal return."
- **Dana Reyes** — a single-role Preparer, the "nothing to switch" contrast.

The most-built-out flow: as Jordan (Preparer) → open the **Nguyen Family** return
(overdue, on the Command Center) → work the **Review Queue** → click a low-confidence
value → inspect its **provenance** (source document, page, calculation) → Accept,
Edit, or Flag it. Then switch to **Individual Taxpayer** to see the client's
first-run onboarding and status view.

## The challenges

This build covers all ten product challenges from the brief. The full briefs and
our scope/order decisions are in [`docs/case-study.md`](docs/case-study.md); the
domain language is in [`CONTEXT.md`](CONTEXT.md) and the architectural decisions in
[`docs/adr/`](docs/adr/).

| #  | Challenge                    | Where to look                                            |
| -- | ---------------------------- | ------------------------------------------------------- |
| 01 | Source Document Traceability | Field → provenance card → side-by-side document region  |
| 02 | Client & CPA Collaboration   | A return's **Requests & Activity** and **Messages**     |
| 03 | Where to Start               | Individual Taxpayer first-run onboarding checklist       |
| 04 | Getting Lost in the App      | Two-tier sidebar, breadcrumb Trail, deep-linkable URLs  |
| 05 | Role-Aware Experiences       | The role switcher; multi-role Jordan                     |
| 06 | Return Status & Progress     | The status tracker (same model for firm and client)     |
| 07 | An Actionable Dashboard      | The firm **Command Center** landing page                 |
| 08 | Clickable vs. Editable       | Field states across the return review surface            |
| 09 | Complexity Made Navigable    | The **Return map** — search/filter/hierarchy at volume   |
| 10 | Trustworthy AI               | Confidence bands, rationale, evidence, correction flow   |

## What's real vs. simulated

**Genuinely wired up (real code):**

- The entire UI, routing, navigation, deep-linking (`?area=&focus=`), and breadcrumb
  orientation.
- **Prioritization** — the dashboard's ranking/grouping logic runs against the mock
  roster (`src/features/dashboard`).
- **Provenance resolution** — the field → source-document → page/region → calculation
  chain is derived, not hand-placed per screen (`src/features/returns/shared`).
- **Corrections persist in-session** — accepting/editing/flagging a field, and typing
  into an editable field, update live state (a reducer) that survives navigating
  between a return's areas.
- **Role-aware shell** — what renders, and in which layout, is branched off the active
  role; the client-visible / internal-note boundary in collaboration is enforced in
  logic before anything reaches the screen.
- **Status derivation** and **search / filter / hierarchy** in the Return map — real
  logic over the seed data.

**Simulated (hardcoded / faked):**

- **No backend, database, or authentication.** All data is seed data in
  `src/mocks/`. The role switch is a client-side context change, not a login.
- **The AI is faked.** Confidence scores, extracted values, rationales, and
  warnings are hand-authored to be plausible (`src/mocks/`). There is no model call.
- **No OCR.** Source documents are small hand-written line facsimiles
  (`src/mocks/documents.ts`), not real scanned files.
- **No file storage.** Uploads, downloads, and a few row-level menu actions are
  simulated affordances — they show the interaction without persisting anything.
- **Scale is generated.** The Return map's hundreds of items are generated so search,
  filtering, and hierarchy can be tested against realistic volume.

## Tech

React + TypeScript + Vite, Tailwind CSS with shadcn/ui primitives, React Router,
TanStack Table, and Vitest + Testing Library (with `vitest-axe` for accessibility).
File structure is feature-first (`src/features/*`), with shared UI in
`src/components/` and pure domain logic separated from its seed data.
