# Scope: four challenges, preparer persona only

> **Superseded by ADR-0004** — we now build all ten challenges, role-aware. The record below reflects the original preparer-only cut.

The case study offers ten independent challenges; we chose **08 Clickable vs. Editable, 01 Source Document Traceability, 10 Trustworthy AI, and 07 Actionable Dashboard**, all built around a single **Preparer/CPA** persona sharing one seed dataset, shell, and design system.

We picked these four because they compose into one coherent return-review workflow that showcases AI presentation and trust — the heart of an AI Engineer role — rather than four disconnected demos. We deliberately excluded the client-facing challenges (02/03/06) and the pure-plumbing ones (04/05/09); navigation (04) and scale (09) get partially demonstrated for free by the review workflow anyway. Build order is 08 first (the affordance system that 01 and 10 depend on), then 01, 10, 07. If time is short, 07 is the cut line — 08+01+10 still ship a complete workflow.
