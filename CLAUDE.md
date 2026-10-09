# CLAUDE.md

Full-stack app on Cloudflare Workers: React + Vite + Tailwind v4 + shadcn/ui
(**Base UI**) on the client, Hono on the Worker, D1 + KV for data (R2 not
enabled yet). Two long-lived branches = two environments: `dev` (Worker
`<app>-dev`) and `main` (production). Code reaches `dev` through a reviewed
feature PR and `main` only through a release PR `dev → main` (see "Workflow").

Product brief (what the app is, e-ink constraints, game rules):
[docs/BRIEF.md](docs/BRIEF.md) — read it before building UI.

## Commands

```bash
npm run dev            # Vite dev server: React + Worker + local D1/KV (Miniflare)
npm run check          # format:check + lint + typecheck + tests — what CI runs
npm run build          # production build (dist/)
npm run format         # prettier --write (run before committing)
npm test               # Worker tests in workerd (vitest + @cloudflare/vitest-plugin)
npm run db:new <name>  # new timestamped D1 migration in migrations/
npm run db:migrate:local
npm run cf-typegen     # regenerate worker-configuration.d.ts after editing wrangler.jsonc
npm run rename -- <name>   # rename the app (Worker, D1 names, title); new projects only
```

## Layout

```
src/                     React client
  features/<name>/index.tsx   one folder per feature, auto-mounted by App.tsx
  components/ui/         shadcn/ui components (Base UI flavour) — edit freely
  lib/api.ts             fetch helpers for /api
worker/                  Hono API (only /api/* reaches the Worker)
  app.ts                 base app, error handling, feature auto-discovery
  features/<name>/routes.ts   default-export a Hono app, mounted at /api/<name>
  test/                  vitest tests (run inside workerd with real bindings)
shared/types.ts          types used by both client and Worker (no runtime code)
migrations/              D1 SQL migrations, <UTC timestamp>_<name>.sql
scripts/                 cf-resources.mjs (CI provisioning), new-migration.mjs, rename-app.mjs
wrangler.jsonc           production at top level, `env.dev` for dev + PR previews
```

## Conventions (they exist to avoid merge conflicts between parallel sessions)

- **New feature = new folders**: `src/features/<name>/` and
  `worker/features/<name>/`. Both are discovered with `import.meta.glob`, so do
  not add hand-written registries/route lists. Export `order` from the client
  feature to control its position.
- Avoid editing shared hot files (`App.tsx`, `worker/app.ts`, `index.css`,
  `shared/types.ts`) unless the change is genuinely cross-cutting; prefer
  adding a new file.
- **Migrations**: always `npm run db:new <snake_name>`; never hand-number
  files, never edit a migration that is already on `dev` — add a new one.
  Migrations must be backward compatible (the dev DB is shared by the dev
  deployment and all open PRs, and production runs migrations before the new code is live).
- **UI**: shadcn/ui on **Base UI**, not Radix. Base UI composes with the
  `render` prop, not `asChild`:
  `<Button render={<a href="/x" />}>Go</Button>`. Import primitives from
  `@base-ui/react/<part>`. Never add `@radix-ui/*` or `react-aria-components`.
  Add components with `npx shadcn@latest add <name>` (needs `ui.shadcn.com`
  in the environment's allowed domains). Icons: `lucide-react`.
- **Worker**: validate input, throw `HTTPException` for client errors, keep
  JSON responses. Bindings are `c.env.DB`, `c.env.KV`;
  `c.env.APP_ENV` is `"production"` or `"dev"`.
- **Bindings**: after adding/changing a binding in `wrangler.jsonc`, add it to
  **both** the top level and `env.dev` (with a `-dev` resource name),
  then run `npm run cf-typegen`. Leave resource IDs as the zero placeholders —
  CI fills in real IDs; never commit real IDs or secrets.
- Secrets: `wrangler secret put` per environment; local values in `.dev.vars`
  (gitignored).
- Tests: add/extend `worker/test/*.test.ts` for every API change.
- If `npm install <pkg>` fails with `Cannot read properties of null
(reading 'edgesOut')` (npm 10 bug), use `npx npm@11 install <pkg>`.

## Workflow (Claude Code on the web / mobile)

New project from the template (app still named `my-app`)? Run the
**`setup-project`** skill first.

Branches: `main` = production, `dev` = integration/dev environment (default
branch), `claude/...` = one session's feature.

1. Work only on the session's own branch (`claude/...`), created from `dev`.
   Never push to `dev` or `main` directly.
2. One feature per branch/PR; keep PRs small so they merge quickly.
3. When the change is done, use the **`ship`** skill: sync with `dev`, run
   `npm run check` + build, commit, push, open/update the PR **into `dev`**,
   watch it.
4. CI comments a **preview URL** on the PR (`pr-<n>-<app>-dev.<sub>.workers.dev`,
   backed by the dev D1/KV). The user reviews there and asks for changes in
   the same session; each push refreshes the preview.
5. The user approves → **squash-merge** into `dev` → CI deploys the dev
   environment (`<app>-dev.<sub>.workers.dev`).
6. Release: when the user says dev is good ("release", "lên production"),
   use `ship` to open a PR `dev → main` and, on approval, merge it with a
   **merge commit** (never squash `dev → main`, or the branches diverge) →
   CI deploys production. Then fast-forward `dev` to `main` (`ship` §7) —
   the only direct push to `dev`.
7. If a PR gets a merge conflict or red CI, fix it in the same session:
   merge `origin/dev` into the branch (never rebase/force-push a pushed
   branch), resolve, re-run `npm run check`, push.
