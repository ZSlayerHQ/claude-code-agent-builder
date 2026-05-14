---
name: stale-docs-audit
description: Audit project documentation for staleness signals — dead file-path citations, version mismatches with package manifests, dead commit SHAs, files unchanged in 6+ months in active areas, leftover TODO/FIXME markers, and renamed-file ghosts. Produces a structured RED/AMBER/GREEN report per check with file:line citations. Use proactively before major releases, when onboarding new contributors, after large refactors, or when the operator asks "are the docs current?".
---

# Stale Docs Audit

Documentation rots. Every refactor, rename, version bump, and architecture change leaves silent dead references — file paths that no longer exist, version numbers that haven't tracked package upgrades, commit SHAs that survived a rebase, files claiming the project does things it stopped doing 8 months ago. This skill catches the common rot signals systematically.

## When to use

**Activates on operator phrasings:**

- "Audit the docs" / "are the docs current?" / "check for doc staleness"
- "/stale-docs-audit" (manual invocation)
- "Did we update the docs after that rename?" / "Is the README still accurate?"

**Activates proactively on these triggers:**

- Before tagging a major release
- After a large refactor (>10 files renamed / moved)
- After a tech-stack migration (framework upgrade, language version bump)
- When onboarding a new contributor — staleness erodes their first-day trust
- Quarterly hygiene pass on long-lived projects

**Do NOT auto-activate on:**

- Single-file edits
- Cosmetic / wording-only PRs
- New-project sessions where there are no docs to be stale yet

## Procedure

The skill runs 6 checks. Each produces a verdict (RED / AMBER / GREEN / N/A) and a list of file:line citations for any hits. Output is a single report; the operator decides what to fix.

### Scope

By default, scan these directories:

- `*.md` at repo root (README, CONTRIBUTING, CHANGELOG, etc.)
- `docs/**/*.md`
- `session-docs/**/*.md`
- `.claude/**/*.md` (rules, skills, agents — these go stale too)

Operator can override scope via skill input: "audit docs/ only" or "audit just the README".

### Step 1 — Dead file-path citations

Extract every backticked path-like token from every doc in scope (patterns: `<word>/<word>...`, `<word>.<ext>`, `src/...`, `lib/...`, etc.). For each, check whether the path resolves against `git ls-files`. Citations that don't resolve are hits.

```bash
# Per doc, extract candidates + cross-check against git ls-files
git ls-files > .stale-docs-audit/tracked-files.txt
# Then grep each doc for path-like tokens and diff against tracked-files.txt
```

**Common false positives to ignore:**
- Path patterns in code blocks marked as examples (` ```bash ... ``` ` blocks)
- URLs / external links
- Glob patterns (`**/*.md` is not a file)
- Path placeholders inside `{curly}` or `<angle>` brackets

**Reports as:** `<doc>:<line>: cited path \`<path>\` does not exist`

### Step 2 — Version-string mismatch

Find every version-string mention in docs (`v1.2.3`, `version 2.0`, `Node 18+`, `Python 3.11`, etc.) and compare against authoritative sources:

| Source file | Versions to extract |
|---|---|
| `package.json` | `version`, `engines.node`, `engines.npm`, dependency major-versions |
| `Cargo.toml` | `package.version`, `rust-version` |
| `pyproject.toml` | `tool.poetry.version` / `project.version`, `python` |
| `go.mod` | module version, go directive |
| `.tool-versions` / `.nvmrc` | language runtime versions |
| `Dockerfile` | base image versions |

**Reports as:** `<doc>:<line>: cites Node 18, manifest declares Node 20 (package.json:engines)`

**AMBER (not RED):** "Node 18+" in docs when manifest says Node 20 — technically still valid, just outdated. RED only when the doc cites a version newer than the manifest (impossible) or older than the manifest's minimum (broken).

### Step 3 — Dead commit SHAs

Find every SHA-shaped token in docs (`[0-9a-f]{7,40}`). For each, run `git log -1 <sha>` — if it errors, the SHA is dead (rebased away, or always wrong).

```bash
git log --oneline --all > .stale-docs-audit/all-shas.txt
# Then grep each SHA cite and check existence
```

**Cross-repo SHA caveat:** If the cite is in a doc that explicitly references a sibling repo ("propscout SHA abc1234 shows..."), the SHA lives in the sibling — check there instead. The skill should heuristically detect cross-repo cites by proximity to a `../<repo>/` or `github.com/<org>/<repo>` token within ~3 lines.

**Reports as:** `<doc>:<line>: cited SHA \`abc1234\` not in repo history (rebased or always wrong)`

### Step 4 — Last-modified gap

For each doc in scope, run `git log -1 --format=%cr <doc>` to get the relative last-modified time. Flag docs unchanged for 6+ months IF the directory they describe has had recent commits.

```bash
# For each doc, get last-modified
git log -1 --format='%cr' -- <doc>
# For the doc's logical scope, get the most recent edit
git log -1 --format='%cr' -- <inferred-scope-path>
```

The gap between doc-last-modified and scope-last-modified is the signal. Doc-side untouched for 18 months while the scope it describes saw 200 commits = likely stale.

**Heuristic mapping doc → scope:**
- `README.md` → repo root (everything)
- `docs/api.md` → `src/api/`, `app/api/`, `routes/`
- `docs/architecture.md` → repo root
- `session-docs/STATE.md` → repo root (and should be near-realtime)
- `references/<topic>.md` → topic-specific scope inferred from filename

**Reports as:** `<doc>: last-modified 14 months ago; scope <path> last-modified 3 days ago — likely stale`

### Step 5 — TODO / FIXME markers

Grep every doc in scope for `TODO`, `FIXME`, `XXX`, `HACK`, `TBD`, `<placeholder>` — anything that signals "this section isn't finished." Flag with the line content for context.

```bash
grep -rn -E "TODO|FIXME|XXX|HACK|TBD|\{[A-Z_]+\}" <scope>
```

**AMBER** by default — these are author intent markers, not always rot. **RED** if the marker is older than 6 months (cross-reference with `git blame` for the line).

**Reports as:** `<doc>:<line>: TODO marker, blame age 18 months — \`<line-content>\``

### Step 6 — Renamed-file ghosts

For each path-like citation that didn't resolve in Step 1, run `git log --diff-filter=R --name-only --follow -- <path>` to check whether the file was renamed. If yes, the doc cites a ghost — the file exists under a new name but the doc didn't follow.

```bash
# For each Step 1 hit, check rename history
git log --all --diff-filter=R --name-only --follow -- <stale-path>
```

**Reports as:** `<doc>:<line>: cites \`<old-path>\`, renamed to \`<new-path>\` in commit <sha> on <date>`

This is the most fixable category — a single sed across the codebase updates all cites.

## Output format

Single markdown report. Default path: `docs/stale-docs-audit-<YYYY-MM-DD>.md` (write to `session-docs/` if `docs/` doesn't exist).

```markdown
# Stale Docs Audit — <YYYY-MM-DD>

**Scope:** <list of directories scanned>
**Verdict:** GREEN | AMBER | RED

## Summary

| Check | Hits | Verdict |
|---|---|---|
| 1. Dead file-path citations | 3 | RED |
| 2. Version-string mismatch | 1 | AMBER |
| 3. Dead commit SHAs | 0 | GREEN |
| 4. Last-modified gap | 4 | AMBER |
| 5. TODO / FIXME markers | 12 | AMBER |
| 6. Renamed-file ghosts | 2 | RED |

## Hits

### Check 1 — Dead file-path citations (RED, 3 hits)

- `README.md:42: cited path \`src/legacy/auth.ts\` does not exist`
- `docs/architecture.md:88: cited path \`scripts/build-old.sh\` does not exist`
- `CONTRIBUTING.md:15: cited path \`docs/contributing/style-guide.md\` does not exist`

### Check 6 — Renamed-file ghosts (RED, 2 hits)

- `README.md:42: cites \`src/legacy/auth.ts\`, renamed to \`src/auth/provider.ts\` in commit a1b2c3d on 2026-02-14`
- `docs/architecture.md:88: cites \`scripts/build-old.sh\`, renamed to \`scripts/build.sh\` in commit e5f6789 on 2026-03-01`

[continue per check]

## Recommended fixes

1. **Path-rename sweep** (Check 6 + most of Check 1): one `sed` or find-replace pass updates the renamed-file ghosts. ~5 min.
2. **Version-string update** (Check 2): bump the cited version to match the manifest. ~2 min.
3. **TODO triage** (Check 5): the 12 markers are 4 active, 8 stale (>6 months old). Drop the stale ones; either finish or delete the 4 active.
4. **Last-modified reads** (Check 4): the 4 flagged docs need a content review — likely a half-day to read + rewrite or confirm-still-accurate.
```

## Inputs (optional)

When invoked, accept optional scope overrides:

- `--scope <path>` — limit the audit to a single directory
- `--checks <list>` — only run specific checks (e.g. `--checks 1,3,6`)
- `--since <date>` — for Check 4, override the 6-month threshold
- `--output <path>` — override the report's output path

## Anti-patterns

- **"Just trust the docs"** — _"They were written by a careful person; they're probably fine."_ Documentation decays on git's clock, not the author's intent. Run the audit anyway; the audit cost is bounded, the false-trust cost compounds.
- **"Fix every hit immediately"** — _"I'll just sweep through all 35 findings now."_ The audit's job is to surface; the operator's job is to triage. Some hits are intentional (intentional TODOs, version pinning during a migration, paths cited as examples not actuals). Read each hit's context before fixing.
- **"Skip Check 4 because nothing's stale"** — _"This is a young project, the last-modified gap won't catch anything."_ Run all 6 checks regardless. The point of the check matrix is structural completeness — if Check 4 is N/A this run, that's the verdict; skipping it leaves a blind spot for future runs.
- **"Just delete the TODOs"** — _"They're stale; they need to go."_ Some stale TODOs are real unfinished work, just nobody owned them. Read the line before deleting. Move work to an issue tracker if real, delete if obsolete.

## Notes for the implementer

This skill activates against a project's docs but DEPENDS ON the project being a git repository (Checks 3, 4, 6 use `git log`). For non-git projects, the skill should warn and run only Checks 1, 2, 5.

For large repos (50+ docs in scope, 10k+ tracked files), Step 1's cross-check is the slowest part. Consider parallelising — each doc's citation extraction + check is independent. Use the project's context-mode MCP sandbox for parallel shell dispatch if available; otherwise sequential is fine for projects under ~200 docs.

The report itself is also a doc that will eventually go stale. Stamp it with the audit date in the filename + frontmatter, and treat as ephemeral (don't commit historical audits to the repo unless the operator wants a trail).
