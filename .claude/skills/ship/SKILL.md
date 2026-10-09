---
name: ship
description: Ship the current change for review — sync with dev, run checks, commit, push, open or update the PR into dev, and watch it until the preview URL is up. Use when the user says the work is done, asks to "ship", "push", "deploy a preview", "open a PR", or wants to review the change. Also covers merging after the user approves ("merge", "LGTM") and releasing dev to production ("release", "lên production", "merge dev vào main").
---

# Ship

Branches: feature `claude/...` → **`dev`** (dev environment) → **`main`**
(production). Goal: the user reviews every change on a live URL from their
phone, and nothing reaches `dev` or `main` without their approval.

The repo may have no enforced branch protection (rulesets need a paid plan
on private repos), so these rules are yours to keep: never push to `dev` or
`main`, never merge a PR whose `check` (and `preview`, for PRs into `dev`)
is not green on the latest commit, and use the merge method stated below.

## 1. Before pushing

1. Confirm you are on the session's feature branch (`git branch --show-current`),
   never `dev` or `main`. If on one of them, create a branch first.
2. Sync with dev so conflicts surface here, not on the PR:
   ```bash
   git fetch origin dev
   git merge origin/dev   # never rebase a branch that was already pushed
   ```
   Resolve conflicts by keeping both features' behaviour. Regenerate
   `package-lock.json` with `npm install` instead of hand-merging it. If both
   sides changed the same logic and keeping both is impossible, stop and ask.
3. Validate — all must pass before pushing:
   ```bash
   npm run format
   npm run check
   npm run build
   ```
   Fix failures; don't skip or weaken tests.
4. Re-read your diff (`git diff origin/dev...`) for leftovers, debug code,
   real resource IDs or secrets in `wrangler.jsonc`, and hand-numbered
   migrations.

## 2. Commit and push

- Commit with a clear message (`feat: …`, `fix: …`, `chore: …`).
- `git push -u origin <branch>` (retry on network errors with backoff).

## 3. Open or update the PR

- If no PR exists for the branch, create one with **base `dev`** using the
  GitHub MCP tools (`create_pull_request`). Fill
  `.github/pull_request_template.md`: what changed, how to check it on the
  preview, notes (migrations, new bindings).
- If a PR exists, the push already updated it; edit the description only if
  scope changed.
- Subscribe to the PR's activity (`subscribe_pr_activity`) so CI results,
  conflicts and review comments wake this session.

## 4. Report the preview

- The `preview` CI job comments `**Preview:** https://pr-<n>-…-dev…workers.dev`
  on the PR within a few minutes. When CI finishes, read that comment and
  give the user the PR link and preview URL in one short message.
- If CI fails: read the job logs, fix the root cause, re-validate, push. Do
  not ask the user to fix CI.

## 5. Revisions

User feedback → change code on the same branch → repeat steps 1–4. The
preview URL stays the same and shows the latest push.

## 6. Merge into dev (only when the user explicitly approves)

1. Check the PR is mergeable and `check` + `preview` are green on the latest
   commit. If `dev` moved and the branch is behind, merge `origin/dev`,
   re-validate and push first.
2. Squash-merge with `merge_pull_request` (`merge_method: "squash"`).
3. Leave the merged feature branch in place: cloud sessions cannot delete
   remote branches, and stale `claude/…` branches are harmless. Never delete
   `dev` or `main`.
4. Tell the user the dev deploy has started (the `deploy` job on `dev`, URL
   `<app>-dev.<sub>.workers.dev`), then unsubscribe from the PR.

## 7. Release dev → main (only when the user asks to release)

1. Find or create the PR **head `dev`, base `main`**, titled
   `release: <short summary>`; list the feature PRs it contains (commits in
   `git log origin/main..origin/dev`). Subscribe to it.
2. Wait for `check` to be green (there is no preview job — dev is already
   live on the dev URL). Give the user the PR link and the dev URL.
3. On explicit approval, merge with `merge_pull_request`
   (`merge_method: "merge"` — **never squash** dev into main, or every later
   release conflicts). Never merge if `main` has commits that `dev` lacks
   (`git log origin/dev..origin/main`, ignoring earlier `release:` merge
   commits): first open a PR `main → dev` (hotfix sync) and merge that.
4. Fast-forward `dev` to the release merge commit, so both branches point
   at the same commit and GitHub stops offering a `main → dev` PR:
   ```bash
   git fetch origin main dev
   git push origin origin/main:refs/heads/dev   # fast-forward only, no --force
   ```
   This is the one direct push to `dev` allowed, and it changes no code. If
   it is rejected as non-fast-forward, `dev` got new commits meanwhile —
   leave it; the next release includes them.
5. Do **not** delete `dev` after the release merge. Tell the user the
   production deploy has started, then unsubscribe.
