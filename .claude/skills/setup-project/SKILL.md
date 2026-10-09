---
name: setup-project
description: Guide a new project created from this template through setup, checking each step until dev and production are live. Use when the user runs /setup-project, has just created a repo from the template, asks "what's next", "set up the project", "kiểm tra thiết lập", or when the app is still named my-app. Safe to re-run at any time; it re-checks everything and picks up where setup stopped.
---

# Setup project

Goal: take a repo freshly created from the template to "feature PRs get a
preview, `dev` and `main` are deployed", doing what Claude can do itself and
telling the user exactly what only they can do. Every run re-derives state
from checks, so the user can call `/setup-project` again after each fix.

This repo may also be the template itself, which is meant to stay named
`my-app`. If the user is working on the template (not a new project), skip
this skill.

## 0. Ask for the language first

Before any check or other output, ask which language the user wants to use
for this setup (use `AskUserQuestion`; options: Tiếng Việt, English — the
user can type another). Use that language for every message, question and
checklist from then on. Ask only once per conversation: if the user already
chose in this conversation, or the request names a language, don't ask
again. Code, commit messages and PR text stay in English.

Keep each message short: the checklist, then **one** next action.

## 0b. Ask for the project name (only while the app is still `my-app`)

Right after the language, before running anything else, settle the app
name. Derive a suggestion from the repo name (`git remote get-url origin` →
basename, lowercased, non `[a-z0-9-]` characters turned into dashes) and ask
with `AskUserQuestion`:

- "Use `<suggestion>`" (first option),
- "Choose another name" — the user types it.

Also offer the display title shown in the browser tab and page header
(default: the name in Title Case, e.g. `shop-admin` → "Shop Admin").
Explain in one line why it matters: the name prefixes the Workers and
databases in their Cloudflare account, so it must be unique there, and
keeping `my-app` would deploy over another project. Validate it the way
`npm run rename` does (2–42 chars, lowercase letters, digits, dashes) and
ask again if it doesn't fit. Remember the answer for step C — don't ask
twice. Skip this step if `wrangler.jsonc` no longer says `my-app`.

## 1. Run the checks

Run all of these each time (in parallel where possible), then print the
checklist with ✅ done, ❌ needs action, ⏳ waiting on CI, ❔ needs the user
to confirm.

| #   | Check                          | How                                                                                                                                                             |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GitHub access for Claude       | A GitHub MCP read on this repo succeeds (e.g. `list_branches`)                                                                                                  |
| 2   | `dev` and `main` share history | Both exist (`git ls-remote --heads origin dev main`) and, after `git fetch --depth=50 origin dev main`, `git merge-base origin/dev origin/main` prints a commit |
| 3   | Default branch is `dev`        | `git ls-remote --symref origin HEAD` shows `refs/heads/dev`                                                                                                     |
| 4   | App renamed                    | `name` in `wrangler.jsonc` is not `my-app`                                                                                                                      |
| 5   | Local checks pass              | `npm run check` (if `node_modules` is missing, `npm ci` first)                                                                                                  |
| 6   | shadcn CLI reachable           | `curl -s -o /dev/null -w "%{http_code}" https://ui.shadcn.com/r/index.json` is 200 (optional)                                                                   |
| 7   | Cloudflare secrets + token     | The `preview` job of a PR into `dev` succeeded (see §3)                                                                                                         |
| 8   | Dev deployed                   | `curl -s https://<app>-dev.<subdomain>.workers.dev/api/health` has `"env":"dev"`                                                                                |
| 9   | Production deployed            | `curl -s https://<app>.<subdomain>.workers.dev/api/health` has `"env":"production"`                                                                             |
| 10  | Repo merge settings            | Can't be read by Claude — ask the user once (§2, step D)                                                                                                        |

`<subdomain>` is the account's workers.dev subdomain. Take it from a
`**Preview:**` comment on any PR, or from the `deploy` job log
(`https://<app>-dev.<subdomain>.workers.dev`). If no run has printed it yet,
checks 8–9 are ⏳.

If check 8 and 9 already pass and 10 was confirmed, setup is done: say so,
list both URLs, and stop.

## 2. Fix in this order (first ❌ wins)

**A. GitHub access (1).** Claude can't open or merge PRs without it. Read the
environment docs (`read_documentation`, topic `github.access`) and relay
the fix: install or configure the Claude GitHub App for this repo.

**B. Branches (2, 3).** A repo made with "Use this template" has only the
template's default branch, unless the user ticked _Include all branches_ —
then `dev` and `main` are separate root commits with no shared history
(GitHub keeps offering to compare them and the release PR can't merge).

- One branch missing: ask the user, then create it from the other, e.g.
  `git push origin origin/dev:refs/heads/main` (or `origin/main:refs/heads/dev`).
- Both exist but share no history: only right after the repo was created
  (each branch has a single commit and their trees are identical —
  `git diff --stat origin/main origin/dev` is empty). Ask the user, then
  join them with one commit that both branches fast-forward to (no force
  push needed):
  ```bash
  git checkout -B join origin/dev
  git merge -s ours --allow-unrelated-histories origin/main \
    -m "chore: join dev and main histories"
  git push origin join:dev join:main
  ```
  If the trees differ or either branch has more commits, stop and ask —
  never discard work.
- Default branch not `dev`: only the user can change it — Settings →
  General → Default branch → `dev`. New sessions then start from `dev`.

These are the only direct pushes to `dev`/`main` this skill makes, and only
with the user's OK.

**C. Rename (4).** Use the name and title the user chose in step 0b (never
pick one silently). Then:

```bash
npm run rename -- <name>            # optional: --title "Display Name"
npm run format && npm run check && npm run build
```

Ship it with the `ship` skill (PR into `dev`, title
`chore: rename app to <name>`). This PR is also the first end-to-end test.

**D. Things only the user can do.** Ask once, as a short list, and record
the answers in the checklist (they can't be verified):

- Repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist.
  If the user hasn't added them, **don't write your own instructions**.
  `Read` `SETUP.md` and show the user these sections **as written** —
  same steps, same order, same links, nothing added or summarised — one
  part per message, waiting for "done" before the next:
  1. §2.1 workers.dev subdomain (only if they have never used Workers),
  2. §2.2 Account ID and §2.3 API token,
  3. §3.1 adding the two repository secrets on GitHub.
     `SETUP.md` is in Vietnamese: for Vietnamese show it verbatim; for another
     language translate it faithfully, keeping UI labels (button and menu
     names) in English as they appear on screen. If the user already has a
     token from another project on the same Cloudflare account, skip 2.3.
- Settings → General → Pull Requests: squash merging **and** merge commits
  allowed, rebase merging off, **Automatically delete head branches off**
  (it would delete `dev` after a release unless a ruleset blocks deletion).
- Optional: add `ui.shadcn.com` to the environment's allowed domains (if
  check 6 failed).

Only ask about secrets before the first PR exists; afterwards, check 7
verifies them.

## 3. Read the CI result of the setup PR

Wait for the PR's `check` and `preview` jobs (PR activity events wake the
session). If `preview` failed, read its log and map the error to the fix:

| Log says                                                        | Fix (user)                                                                                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set`    | Add both as **Repository** secrets (not environment secrets)                                                                |
| `HTTP 401` / `HTTP 403` / `Authentication error` / code `10000` | Token needs the "Edit Cloudflare Workers" template + Account → D1 → Edit, scoped to the right account; check the Account ID |
| `did not print a preview URL`                                   | Set a workers.dev subdomain: Cloudflare dashboard → Workers & Pages                                                         |
| `R2 is not enabled`                                             | Enable R2 in the dashboard, or remove `r2_buckets` from `wrangler.jsonc`                                                    |

After the user fixes it, re-run the failed jobs (`actions_run_trigger`,
`rerun_failed_jobs`) — no new commit needed. Anything else is a real failure:
fix it like any CI failure in the `ship` skill.

When `preview` is green, smoke-test the preview URL (`/api/health` →
`"env":"dev"`) and give the user the link.

## 4. Go live

Ask the user once: "merge into dev and release to production?" On yes:

1. Squash-merge the setup PR into `dev` (`ship` §6). Wait for the `deploy`
   job on `dev`, then run check 8.
2. Open and merge the release PR `dev → main` with a merge commit (`ship`
   §7). Wait for `deploy` on `main`, then run check 9. Confirm in the job
   log that it uploaded `<app>` (not `<app>-dev`) with `APP_ENV` =
   `production`.

## 5. Finish

Print the final checklist with both URLs and the daily flow in three lines:
"one session per feature → PR into dev with a preview → 'merge' → 'release'".
Mention that merged `claude/…` branches stay on GitHub (cloud sessions can't
delete branches) and can be removed from the repo's Branches page.
