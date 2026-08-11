# Feature-first file structure with a single audience fork

We reorganized `src/` around a feature-first layout with conventional top-level homes, replacing the earlier `routes/` / `features/` / `components/` three-layer split (ADR-0003). The shape:

```
src/
  app/            composition root — router.tsx, providers.tsx, home-page.tsx (the `/` chooser)
  components/
    ui/           shadcn primitives (its default home)
    layout/       app-shell + internal-layout + client-layout + role-switcher
  features/
    dashboard/    dashboard-page.tsx · components/ · ranking.ts
    returns/
      shared/     Return/Field/Provenance types + pure logic (no data)
      review/     return-review-page.tsx · components/   (INTERNAL editable surface)
      client-view/ return-status-page.tsx · components/  (CLIENT read-only status)
  hooks/          use-role.ts
  lib/            utils.ts (cn) · roles.ts (role domain: types + ROLE_CONFIG)
  mocks/          returns.ts · documents.ts · users.ts   (all simulated data + its accessors)
```

**One audience split, and it lives only in the layout.** There are two audiences (Firm / Client) across six roles, but most code is shared — Return types, status logic, AI badges, primitives. So we do **not** split the tree into `internal/` vs `client/`. The fork lives in `components/layout` (`internal-layout` and `client-layout` over one shared `app-shell`) plus each page's guard/branch. URLs stay shared (ADR-0005): `/` and `/returns/:id` render a different page + shell depending on the active Role, never a forked route tree.

**Page vs component vs logic.** A **page** (`*-page.tsx`) is the one thing the router points at — it gets data, picks a layout, and drops in the view. Its building-block components live beside it in a flat `components/` folder (one level, no per-component subfolders). Pure functions/types (no JSX) are flat `.ts` files (`ranking.ts`, `returns/shared/*`, `lib/roles.ts`).

**All simulated data lives in `mocks/`.** Seed Returns, source documents, and demo users were pulled out of the domain files; the accessors that only exist because the data is a hardcoded array (`getReturn`, `getUser`, the `SOURCE_DOCUMENTS` lookups) live with the data. The domain modules (`features/returns/shared`, `lib/roles`) stay pure types + logic. Dependency direction is one-way: `mocks → domain`, never the reverse.

**Rejected / pushed back on.** (1) **snake_case filenames** — the source spec asked for them but admits they're non-standard; they fight shadcn's generator and React norms, so we kept **kebab-case**. (2) **A top-level `shared/`** — a vague catch-all whose contents (`ui`, `lib`, `hooks`) have conventional homes of their own; nesting them under `shared/` also moved shadcn's `ui`/`lib/utils` off their default paths and forced `components.json` alias overrides. We use `components/ui` and `lib/utils` (shadcn defaults) so `npx shadcn add` works with no reconfiguration.
