# Design system derived from Greenhouse's brand

The UI uses shadcn/ui (Tailwind) with design tokens lifted directly from greenhouse.com's own stylesheet: primary `#008561` (green-700), foreground `#15372c` (green-950), a marigold accent (`#ffb756`/`#ff8500`), the full green ramp (25→980) for charts and confidence bands, and `0.5rem` radius. Headings use a serif over a sans body, mirroring Greenhouse's editorial pairing.

We mirror the brand of the company running the case study as a deliberate signal of polish and fit. Greenhouse's two brand fonts (Untitled Sans/Serif, Klim Type Foundry) are commercial, so we substitute the closest free Google Fonts — **Inter** for body and **Source Serif 4** for headings. Light mode only; the site's `-dark` tokens are dropped to keep the demo focused.
