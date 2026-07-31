# Motion repo — agent-skill patterns worth stealing

> Extracted from `motiondivision/motion` (`references/motion`), 2026-07-09.
> The repo ships **two dev-workflow skills** — `fix` (Matt Perry, Motion's creator)
> and `improve` (shadcn) — plus a `skills-lock.json`. **They are NOT animation skills.**
> They're how the Motion team runs AI-assisted maintenance, and the patterns map
> directly onto this kit / the plugin-marketplace direction.

---

## TL;DR — the pattern

A **two-skill plan→execute pipeline** with deliberate cost economics:

```
improve  →  writes self-contained plans in plans/  →  fix  →  one plan → merge-ready PR
(advisor)     (the product is the plan)              (executor)
expensive, read-only, high-ceiling model             cheap model, zero prior context
```

The stated economics (verbatim from `improve/SKILL.md`): *"an expensive, high-ceiling
model does the part where intelligence compounds (understanding, judging, specifying).
Cheaper models do the execution. The plan is the product."* This is the same split behind
plan-then-execute agent workflows generally — here's a battle-tested reference
implementation from two of the most credible authors in the space.

---

## The two skills

### `improve` — senior advisor (shadcn) · MIT
- **Read-only.** Never edits source. The ONLY files it may write live under `plans/`.
- Surveys a codebase, finds highest-value opportunities, and writes **handoff plans for a different, cheaper model with zero context** to execute.
- Variants (from `references/closing-the-loop.md`): `execute` (dispatches an executor subagent in an **isolated git worktree**, reviews the diff, renders a verdict — still never edits code itself), `reconcile` (keeps `plans/` alive vs the moving codebase), `--issues` (publishes plans as GitHub issues).
- Ships three reference docs it loads on demand: `plan-template.md`, `audit-playbook.md`, `closing-the-loop.md`.

### `fix` — executor (Matt Perry) · v1.0.0
- Takes a **plan file / plan number / GitHub issue# / PR#** and drives it to a merge-ready PR.
- Contract: reproduce with a **failing test first** → implement → verify against the repo's gates → open/update the PR. *"You are the executor. A more expensive planning model has already done the thinking… You have zero context from the planning session."*
- If a plan exists for an issue/PR, **the plan governs**.

---

## Reusable artifacts (steal these)

### 1. The handoff-plan template — the gold (`improve/references/plan-template.md`)
Three properties that make a plan executable by a weaker model:
1. **Self-contained context** — paths, code excerpts, conventions, commands all inlined. Never "as discussed" / "see audit".
2. **Verification gates** — every step ends with a command + expected result; the executor never has to *judge* success.
3. **Hard boundaries + escape hatches** — explicit out-of-scope list and "STOP and report" conditions instead of improvising.

Plan fields worth copying into your scaffolder's plan output:
- **Drift check (run first):** `git diff --stat <planned-at SHA>..HEAD -- <in-scope paths>` → mismatch = STOP condition. *(This is the standout idea — plans self-invalidate if the code moved under them.)*
- **Status block:** Priority (P1–3) · Effort (S/M/L) · Risk · Depends-on · Category · Planned-at (commit + date) · Issue URL.
- **Why this matters** (2–5 sentences of *intent* — "intent is what lets a correct judgment call happen when a detail is off").
- **Current state** — files + one-line roles + short `file:line` excerpts + the one exemplar to match.
- **Commands you'll need** — a table of exact, recon-verified commands + expected-on-success.
- **Suggested executor toolkit** — name skills/refs the executor should invoke if available.
- File naming `plans/NNN-short-slug.md`, numbered in execution order.

### 2. Audit taxonomy (`improve/references/audit-playbook.md`)
Fixed 9-category survey lens + a `[CATEGORY-NN] title` finding format + a prioritization rubric:
`1 Correctness/Bugs · 2 Security · 3 Performance · 4 Test Coverage · 5 Tech Debt & Architecture · 6 Dependencies & Migrations · 7 DX & Tooling · 8 Docs · 9 Direction (features / where next)`.
Drop this straight into an "audit" agent archetype so reviews are consistent instead of ad-hoc.

### 3. `skills-lock.json` — skills as versioned packages ★ most relevant to you
```json
{ "version": 1, "skills": { "improve": {
  "source": "shadcn/improve", "sourceType": "github",
  "skillPath": "skills/improve/SKILL.md",
  "computedHash": "431adaf3…a48bb02" } } }
```
Skills are **sourced from GitHub, version-pinned, and content-hashed** — a lockfile for skills, exactly like a package-lock. This is the answer to copy-drift across your generated projects: instead of copying `security.md` / skills into every scaffold, **pin + hash-verify them from a central source**. Directly feeds the `bens-project-agent-builder` plugin-marketplace idea.

### 4. `.claude/overviews/` — durable codebase maps
`.claude/overviews/projection.md` is a hand-maintained overview of the gnarliest subsystem (layout projection), kept so agents don't re-derive it every session. Worth adding as a scaffolder convention: an `overviews/` dir for the 1–2 subsystems agents always need context on.

### 5. Skill anatomy
`SKILL.md` = frontmatter (`name`, `description`, `metadata.author/version`, optional `license`) + body, with a sibling `references/` dir the skill pulls in on demand. Clean separation of "the skill" from "the playbooks it uses" — mirrors your own `references/` pattern.

---

## Map to the agent builder

| Already do | New / worth adopting |
|---|---|
| Plan→execute split (subagent-driven development) | **`skills-lock.json`** — hash-pinned skill distribution for the plugin marketplace (kills copy-drift) |
| Tool-scoped agents (auditors never Write) | **Plan drift-check** — `git diff --stat <SHA>..HEAD` so stale plans STOP instead of corrupting |
| `references/` per skill | **`.claude/overviews/`** convention for durable subsystem maps |
| Session-docs discipline | **Fixed audit taxonomy** (9 categories) for consistent review agents |
| CLAUDE.md-driven scaffolds | **Verification-gate + STOP-condition** plan format (executor never judges success) |

Net: your architecture already matches theirs; the three concrete things to lift are
**skills-lock (pinned/hashed distribution)**, the **drift-check + STOP-condition plan format**,
and the **`.claude/overviews/`** convention.
