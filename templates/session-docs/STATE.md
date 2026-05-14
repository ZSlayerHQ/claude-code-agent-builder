# STATE.md — Current Session State

> Auto-updated by the `pre-compact-state-write` PreCompact hook before every context compaction.
> Read FIRST at every Session Start to re-anchor before any work.
> Overwritten (not appended) — historical state lives in `SESSION-LOG.md`.

**Last updated:** _(hook fills timestamp)_
**Last commit:** _(hook fills SHA + message)_
**Branch:** _(hook fills branch name)_
**Uncommitted changes:** _(hook fills file count)_
**Recent changes:** _(hook fills last 5 files touched)_

---

## Invariants

Facts the AI must not contradict. Locked decisions, key data shapes, identifiers that cannot change without explicit operator decision.

_(Examples — replace with project-specific invariants:)_

- _(Locked decision — e.g. "Score = 6 dimensions + risk penalty; ScoreBreakdownV2 required for any 7th")_
- _(Key entity shape — e.g. "Property canonical id = uprn, fallback address_hash")_
- _(Naming convention — e.g. "All currency stored as integer pence at DB layer")_

## Active work

The in-flight task. File paths + line numbers + next concrete step. Read this first to know where to pick up.

- **Task:** _(one-line description)_
- **Files in scope:** _(path:line, path:line — minimum 1, maximum 5)_
- **Next step:** _(the very next concrete action — not a goal, an action)_
- **Acceptance criterion:** _(how the AI + operator know this task is done)_

## Last verified state

What was last confirmed working. Don't trust these unless the date is recent.

- [ ] Build green — _(date / sha last verified)_
- [ ] Tests passing — _(date / sha last verified)_
- [ ] Linter clean — _(date / sha last verified)_
- [ ] Type checker clean — _(date / sha last verified)_
- [ ] Lexicon check (if applicable) — _(date / sha last verified)_

## Open assumptions

Things believed true but not re-verified this session. Next session should re-check before relying on them.

- _(Assumption — what's assumed; what would invalidate it; how to verify)_

## Active hazards

Flaky tests, pending migrations, unresolved merge conflicts, third-party API outages, deprecated dependencies on a countdown.

- _(Hazard — affected area; current workaround; deadline if any)_

---

## How to update this file

This file has TWO update mechanisms:

1. **Automatic (hook-driven):** the `pre-compact-state-write` PreCompact hook captures objective state (git branch, last commit, dirty file count, recent file changes) into the header before every context compaction. The narrative sections (Invariants, Active work, Last verified, Open assumptions, Active hazards) are preserved across hook runs.

2. **Narrative (AI-driven):** after the hook runs (or at session end), the AI updates the narrative sections to reflect what was learnt this session. Overwrite — do not append. Old narrative state lives in `SESSION-LOG.md` (chronological log) if needed for historical reference.

The hook captures *facts*. The AI captures *judgement*. Both are needed.
