# Scope expanded: all ten challenges, foundation-first order

Supersedes ADR-0001. We now build **all ten** case-study challenges rather than the original preparer-only four, and reverse that ADR's exclusion of the client-facing (02/03/06) and cross-cutting (04/05/09) challenges. The trigger is time: the preparer-only cut was a scope-saving decision, not a product one.

Because five of the six remaining challenges pull in a **client** actor and an internal-vs-client-visible distinction, we order the build **foundation-first** so features don't get reworked into an architecture that arrives later:

`… 07 → 05 → 06 → 02 → 03 → 09 → 04`

- **05 Role-Aware first** — the app is single-persona today; every client-facing challenge assumes a client actor. Building the role-adaptive shell + persona switch up front makes 06/02/03 correct-by-construction instead of retrofits.
- **06 → 02 → 03** — 06 is the lowest-surface client feature (extends the existing `Stage`/dashboard spine); 02 defines the collaboration/request/next-action-owner model; 03's first-run experience then *consumes* those requests and status rather than inventing a throwaway task list.
- **09 → 04 last** — 09 (scale/progressive disclosure) and 04 (navigation across connected objects) are cross-cutting IA layers that only pay off once the objects they organize — documents, messages, tasks, status — actually exist. 04 is the connective capstone.

**Consequence:** `CONTEXT.md`'s "client-facing side is deliberately out of scope" note and the "Preparer — the only role this product serves" definition are revised as of this ADR; new terms (Role, Message/Thread, Request, status Milestone) land in the glossary as each challenge is built.
