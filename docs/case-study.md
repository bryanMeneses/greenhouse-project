# AI Engineer Case Study — Challenge Briefs

Reference copy of the ten product challenges from `AI_Engineer_Case_Study_Updated.pdf`
(July 2026), so grills and specs don't need the original PDF. Source of truth for
*which* challenges exist and what each evaluates; our scope/order decisions live in
`docs/adr/0004` and the domain language in `CONTEXT.md`.

## How the case study is graded (from the PDF)

- **The frontend is what's graded** — visual design, interaction design, information
  architecture, and how the product feels. A working clickable prototype beats a mockup.
- **Behind the frontend, quick and dirty** — hardcoded data, mocked responses, faked
  logic are all ideal. No real infra, OCR, or AI.
- **Simulate the AI** — fabricate plausible fake extraction, confidence scores,
  recommendations, warnings. We're judged on how AI output is *presented*, not built.
- **What good looks like** — a real (even rough) interface over static images; brief
  defensible decisions over polish; enough fake data + edge cases that it's testable;
  a short note on what's real vs. simulated.

## Overview

| # | Challenge | In one line |
|---|-----------|-------------|
| 01 | Source Document Traceability | Trace every number on the return back to its source |
| 02 | Client & CPA Collaboration | Unify fragmented communication around documents and issues |
| 03 | Where to Start | A first-time user knows their next action within 10 seconds |
| 04 | Getting Lost in the App | Navigation that preserves context across connected objects |
| 05 | Role-Aware Experiences | One product, six roles, no confusion |
| 06 | Return Status & Progress | Statuses everyone interprets the same way |
| 07 | An Actionable Dashboard | Answer "what should I work on right now?" |
| 08 | Clickable vs. Editable | A consistent system for interaction affordances |
| 09 | Complexity Made Navigable | Deep professional work that stays approachable |
| 10 | Trustworthy AI | Transparency that builds confidence without overload |

Our build order (ADR-0004): `08 → 01 → 10 → 07 → 05 → 06 → 02 → 03 → 09 → 04`.
Built: 01, 07, 08, 10.

---

## 01 · Source Document Traceability
*Trace every number on the return back to its source.*

**Challenge:** A CPA needs to trust every number. Without knowing where a figure came
from, they either trust the software blindly or re-derive everything by hand.

**Assignment:** A return review interface connecting: the tax return field → the
extracted value → the source document → the exact page/section → any transformation or
calculation applied.

**Behind the scenes:** No real OCR. Hardcode sample documents and fabricate the
traceability data linking them to fields. The interaction model is what's judged.

**Evaluating:** Traceability, transparency, side-by-side review, how defensible AI
output feels.

## 02 · Client & CPA Collaboration
*Unify fragmented communication around documents and issues.*

**Challenge:** Tax work is constant back-and-forth that scatters across email, calls,
and disconnected tools. Design the collaboration layer for a platform that never has
that problem.

**Assignment:** A communication layer that: connects conversations to specific
documents or tax issues; distinguishes internal firm notes from client-visible
messages; tracks outstanding requests; shows who owns the next action; and doesn't
become just another generic inbox.

**Behind the scenes:** Seed a few threads and a couple of fake users (one CPA, one
client) so permissions and the internal/external distinction are visible. Hardcoded
messages with real working UI; no messaging backend.

**Evaluating:** Collaboration design, permissions, contextual communication, task
ownership.

## 03 · Where to Start
*A first-time user knows their next action within 10 seconds.*

**Challenge:** A brand-new client logs in for the first time — no muscle memory,
nothing to unlearn, just a blank product and a task. Design that first experience.

**Assignment:** The first-time experience for a new client, understandable within 10
seconds with no training. Decide: what they see first; how navigation is organized from
day one; what's hidden/deferred until relevant; how progress and urgency are
communicated; how the interface changes once onboarding is done.

**Behind the scenes:** Hardcode a "new client" account with a few tasks, documents, and
questionnaire items in various states, and build the real onboarding flow around it.

**Evaluating:** First-run clarity, information hierarchy, reducing time-to-first-action.

## 04 · Getting Lost Between Parts of the App
*Navigation that preserves context across connected objects.*

**Challenge:** A client gets a question tied to a document; answering it means moving
between messages, the document, a questionnaire, and a task list — without ever losing
their place.

**Assignment:** A navigation model that moves across related documents, questions,
tasks, and messages without losing context. Address: global vs. contextual navigation;
breadcrumbs / orientation tools; deep linking; returning to a previous workflow; showing
how objects connect to each other.

**Behind the scenes:** Fake the connections between objects (a document linked to a task
linked to a message) with hardcoded relationships. Demonstrate the navigation pattern
end-to-end, not a real data model.

**Evaluating:** Navigation design, orientation, preserving context across a connected
workflow.

## 05 · Role-Aware Experiences
*One product, six roles, no confusion.*

**Challenge:** The same platform serves individual taxpayers, business owners, tax
preparers, reviewers, firm administrators, and seasonal staff. Each should feel built
for them without splintering into six products.

**Assignment:** A role-aware frontend architecture. Show: how navigation changes by
role; how permissions are communicated; how a multi-role user switches context; how the
system stays one cohesive product across six roles; how it handles a firm employee who
also has a personal return in the system.

**Behind the scenes:** Hardcode two or three sample roles/logins to switch between (a
preparer view and a client view is a good minimum) to show how the same shell adapts. No
real auth or permissions system.

**Evaluating:** Role architecture, permission clarity, context-switching design.

## 06 · Return Status & Progress
*Statuses everyone interprets the same way.*

**Challenge:** "In Progress," "Pending Review," "Open Items" mean different things to
different people; clients and staff read them differently. Design status so it means the
same thing to everyone.

**Assignment:** A status and progress experience where clients and firm staff can
immediately tell: where the return is in the process; what's already happened; what has
to happen next; who owns the next action; whether anything is blocking completion.

**Behind the scenes:** Hardcode sample returns at different stages and drive the status
experience off that fake data. Solve it without exposing unnecessary internal complexity
to the client.

**Evaluating:** Shared mental models, status legibility, appropriate detail by audience.

## 07 · An Actionable Dashboard
*Answer "what should I work on right now?"*

**Challenge:** Dashboards are easy to make pretty and easy to make useless. Design the
CPA-facing dashboard so staff actually use it instead of a spreadsheet.

**Assignment:** A dashboard organized around decisions and actions, not reporting.
Determine: what belongs on the landing page; how the most urgent work surfaces; how
someone moves from summary into action; how it supports both managers and individual
preparers; how it stays usable when someone owns hundreds of returns.

**Behind the scenes:** Generate a batch of fake returns and tasks with varied urgency
and status; build real prioritization logic against that mock dataset. A script that
ranks and filters is enough.

**Evaluating:** Action-orientation, prioritization logic, dashboard information design.

## 08 · Clickable vs. Editable
*A consistent system for interaction affordances.*

**Challenge:** The platform shows AI-generated values, extracted data, calculations,
reviewer comments, and client answers side by side — some editable, some needing
approval, some permanently read-only. Design the visual language for that.

**Assignment:** A consistent interaction system that makes immediately clear: what can
be clicked; what can be edited; what is AI-generated; what has been verified; what
requires approval; what can't be changed, and why.

**Behind the scenes:** Fake the data states (AI-generated, verified, locked, editable)
with hardcoded sample fields so the system has real variety. Demonstrate across several
screens, not one component.

**Evaluating:** Affordance clarity and consistency of the interaction system across
contexts.

## 09 · Complexity Made Navigable
*Deep professional work that stays approachable.*

**Challenge:** A single return can involve hundreds of documents, questions,
calculations, warnings, and messages. Hold all of that without overwhelming people or
hiding what they need.

**Assignment:** A frontend structure supporting deep professional work while staying
approachable for occasional users. Demonstrate: progressive disclosure; search and
filtering; hierarchy of information; summary vs. detail views; persistent context;
moving between high-level review and source-level detail.

**Behind the scenes:** Generate a large fake dataset (hundreds of mock documents/items)
so search, filtering, and hierarchy get tested against real volume. The challenge isn't
reducing complexity — it's making it navigable.

**Evaluating:** Progressive disclosure, information hierarchy, handling of scale.

## 10 · Trustworthy AI
*Transparency that builds confidence without overload.*

**Challenge:** The platform leans on AI for recommendations, confidence scores,
warnings, extracted values, and suggested corrections. Design the interaction model so
people trust it enough to use it instead of re-checking everything by hand.

**Assignment:** An AI interaction model that helps users understand: what the AI did;
why it made a recommendation; what evidence supports it; what uncertainty exists; what
action to take; how to correct the AI without breaking their workflow.

**Behind the scenes:** Fake the AI outputs with a mocked response format — a stub
returning plausible fake JSON is enough to power a working UI. Balance transparency with
simplicity; showing every technical detail is not acceptable.

**Evaluating:** Trust design, appropriate transparency, correction workflows.

---

## What to submit (from the PDF)

- A hosted, clickable prototype covering the assigned challenges.
- A video walkthrough explaining what was built, the decisions, and how it works.
- A short note (README) on what's genuinely wired up vs. simulated.
