---
name: commit-and-push
description: Ship the intended local changes safely — survey what changed, mandatory secret/risky-file sweep, explicit staging, an intent-driven Conventional-Commit message, a safe push, and a clean-tree verification. Activates on "commit and push", "ship this", "commit my changes", or finishing a unit of work. Respects any project-specific push governance in the repo's CLAUDE.md (protected-branch / never-push rules override this skill).
---

# Commit & Push

Ship the **intended logical change set** in the current repository: survey → secret-sweep → stage explicitly → commit with intent → push safely → verify clean. End state: clean working tree (for the intended set), a new commit on the current branch, pushed to the remote.

> **Scope & precedence:** this is the generic ship action for any repo. It **complements** a session-wrap skill (which captures session docs) — it doesn't replace it. **Project-specific git governance always wins:** if the repo's CLAUDE.md says "never push to a remote", or a branch is protected, or a sync checklist is required before pushing — follow that, not this skill's defaults.
>
> **"All changes" ≠ "sweep everything in blindly."** Commit the set that belongs together; deliberately leave out unrelated in-flight work and never-commit files. A clean *intended* tree, not a kitchen-sink commit.

## Phase 1 — Verify you're in a repo
`git rev-parse --is-inside-work-tree`. If it fails, stop: "Not inside a git repository." Don't `git init` unless explicitly asked. Capture branch (`git rev-parse --abbrev-ref HEAD`) and remote (`git remote -v`). No remote → you can commit locally but warn before push.

## Phase 2 — Survey what changed
Run together; never trust one signal: `git status`, `git diff --stat`, `git diff --cached --stat`, `git log -10 --oneline` (match the repo's message style). Read every modified/added/deleted/untracked diff before staging — you write the message, you must understand it. Avoid `-uall` on huge repos.

## Phase 3 — Secret & risky-file sweep (mandatory, before staging anything)
Scan for: `.env`/`.env.*`, `*.pem`/`*.key`/`*.p12`/`*.pfx`/`id_rsa`/`id_ed25519`, `credentials.json`/`service-account.json`/`secrets.json`/`config.local.*`, token-bearing `.npmrc`/`.pypirc`, files named token/secret/password, and high-entropy cloud/payment/model-provider keys, VCS/CI tokens (`ghp_`/`gho_`/`ghs_`), JWTs, private keys.

If any are in the candidate set: **refuse to stage them** (use explicit paths, never `git add -A`/`.`), tell the builder what was skipped + why, suggest `.gitignore`. If a secret may already be in history, warn loudly — that needs history rewrite + rotation, not a new commit.

Also flag: files >~50MB (LFS/GitHub limit), build artifacts (`dist/`,`build/`,`.next/`,`node_modules/`,`target/`) that belong in `.gitignore`, unrequested lockfile churn.

## Phase 4 — Commit strategy
Default: **one commit** for the related set. Split only if changes touch unrelated concerns or the diff is too large for one honest message. Never amend a published commit unless explicitly asked — create a new commit.

## Phase 5 — Stage explicitly
Prefer named paths: `git add path/a path/b`. Use `-A`/`.` only after a clean secret sweep AND when all changed files belong in this commit. Re-verify `git diff --cached --stat`; if it doesn't match intent, `git restore --staged <path>` and redo.

## Phase 6 — Commit message
**Conventional Commits** (`type(scope): subject`) unless the repo's log shows otherwise — match the repo. Types: `feat fix refactor docs test chore perf style build ci revert`.
- Subject ≤72 chars (≤50 ideal), imperative, no trailing period, lowercase after prefix, focus on the **why**.
- Body (when warranted): wrap ~72, explain motivation/trade-offs, bullets for multi-part. Don't pad with "as requested" boilerplate; don't reference the AI/conversation.

## Phase 7 — Commit (HEREDOC for multi-line safety)
```bash
git commit -m "$(cat <<'EOF'
feat(area): short imperative subject

Optional body explaining the why. Wrap ~72.
- notable change
EOF
)"
```
Never pass `--no-verify`/hook-bypass flags unless explicitly asked. If a pre-commit hook fails: read its output, fix the issue, re-stage, create a **new** commit (don't `--amend` after a hook failure).

## Phase 8 — Push safely
Upstream check: `git rev-parse --abbrev-ref --symbolic-full-name @{u}`. Tracked → `git push`; new branch → `git push -u origin "$(git rev-parse --abbrev-ref HEAD)"`.
- **Protected branches** (`main`/`master`/`production`/`release/*`): pause and confirm before pushing.
- **Never** force-push to `main`/`master`. Force-push anywhere only when explicitly asked, preferring `--force-with-lease`.
- Rejected (non-fast-forward): `git fetch` → `git pull --rebase` → resolve → re-push.

## Phase 9 — Verify end state
`git status` (clean for the intended set), `git log -1 --stat`, `git rev-parse HEAD`. Report: branch · short SHA · files/lines changed · remote URL · one-line summary. If anything is incomplete (push pending, hook failing, secrets skipped), say so. **Never claim "done" with a dirty intended tree.**

## Hard Rules
1. Never commit secrets — scan before staging; when in doubt, ask.
2. Never bypass hooks unless explicitly asked.
3. Never amend pushed commits unless explicitly asked.
4. Never force-push to main/master.
5. Never `git add -A`/`.` before a clean secret sweep.
6. Never run destructive git (`reset --hard`, `clean -fd`, `checkout -- .`, `branch -D`) without explicit authorization.
7. Never modify `git config`.
8. Never create empty commits.
9. Match the repo's existing commit style.
10. Obey project-specific push governance (never-push / protected-branch / sync checklist) over this skill's defaults.
11. Stop and ask if you can't determine intent.

## One-Line Distillation
> **Survey → secret-sweep → stage explicitly → commit with intent → push safely → verify clean. No shortcuts, no surprises.**
