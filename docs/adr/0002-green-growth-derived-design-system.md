# Design system derived from Green Growth CPAs' brand

> **Correction (2026-08-13):** an earlier draft misattributed this palette to
> "Greenhouse"/greenhouse.com. The real source is **Green Growth CPAs**
> (greengrowthcpas.com); the tokens below are unchanged, only the attribution is
> corrected. The product itself is now named **Ledgerline** (see the brand rename).

The UI uses shadcn/ui (Tailwind) with design tokens lifted directly from greengrowthcpas.com's own stylesheet: primary `#008561` (green-700), foreground `#15372c` (green-950), a marigold accent (`#ffb756`/`#ff8500`), the full green ramp (25→980) for charts and confidence bands, and `0.5rem` radius. Headings use a serif over a sans body, mirroring Green Growth CPAs' editorial pairing.

We mirror the brand of a real CPA firm as a deliberate signal of polish and fit for a tax-preparation audience. Green Growth CPAs' brand fonts are commercial, so we substitute the closest free Google Fonts — **Inter** for body and **Source Serif 4** for headings. Light mode only; the site's `-dark` tokens are dropped to keep the demo focused.
