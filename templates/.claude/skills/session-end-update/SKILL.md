---
name: session-end-update
description: Use when the operator signals the session is wrapping up ("/session-end-update", "we're done", "wrap the session", "end of day", "calling it") — captures what changed this session, updates the narrative sections of STATE.md / SESSION-LOG.md / DECISIONS.md / GOTCHAS.md, and offers to commit. Without this, session ends leave the session-docs silently stale and the next session's first 20-30 min is reconstructing what already happened. Pairs with `post-compact-reload` — that one rehydrates context; this one persists it.
---

# Session End Update

The persist side of session continuity. `post-compact-reload` reads (pulls current state into context after `/compact`); this skill writes (pushes current state to disk before the session closes).

## Why this exists

Without an end-of-session update:

- `STATE.md` narrative sections (Invariants / Active work / Last verified / Open assumptions / Active hazards) decay — the PreCompact hook keeps the *git-state header* current, but the *narrative body* needs an AI + operator update
- `SESSION-LOG.md` gets no chronological entry — next session can't see "what changed and why" without re-reading all the diffs
- `DECISIONS.md` is missing any architectural choice made today (alternatives considered + why this one was picked)
- `GOTCHAS.md` is missing any new failure mode that surfaced — the next session re-hits the same wall

Result: every session spends its first 20-30 minutes reconstructing context that should have been a 2-minute write-up at the end of the previous one.

## When to invoke

**Operator-driven (primary):**

- "/session-end-update" (explicit)
- "we're done" / "calling it" / "wrap the session" / "end of day"
- Operator's about to close the terminal / shut down the machine
- Right before a planned `/compact` that's intended as a session boundary

**Self-driven (secondary, ask first):**

- Long session (3+ hours) with significant changes that haven't been captured
- Multiple commits landed but `SESSION-LOG.md` is empty for the date
- A locked decision was made in conversation but never written to `DECISIONS.md`

Don't auto-invoke on every small task — this skill is for SESSION boundaries, not task boundaries.

## Procedure

### Step 1 — Ask the operator for a 1-sentence summary

Don't summarise from your context window — ask the operator. They know things you don't (why they chose direction X, what they're blocked on, when they're coming back, whether the session counts as "progress" or "regression"). A single sentence from them anchors the whole update.

> "Before I wrap session-docs — one sentence on what this session was actually about? (I'll handle the rest of the narrative.)"

### Step 2 — Update `STATE.md` narrative sections

Open the file, update each narrative section (NOT the auto-populated header — that's the PreCompact hook's job):

- **Invariants** — any new locked decisions? Add them. Existing invariants that changed? Update them. Invariants that were dropped? Note the reason.
- **Active work** — overwrite with the in-flight task for **next** session: file paths + line numbers + next concrete step + acceptance criterion. Don't describe what was just done — describe what's queued.
- **Last verified state** — tick boxes that passed this session (with date / SHA). Untick boxes that broke.
- **Open assumptions** — any new ones surfaced? Any old ones re-verified (and therefore can be removed)?
- **Active hazards** — any new flaky tests, broken deploys, expired credentials, deprecated dependencies? Any old hazards resolved?

Overwrite. Do not append. The historical record lives in `SESSION-LOG.md`.

### Step 3 — Append `SESSION-LOG.md` entry

Append a dated entry at the end of the file:

```markdown
## YYYY-MM-DD

- {bullet — what was accomplished}
- {bullet — what was tried but didn't work}
- {bullet — what's queued for next session}
- {bullet — decisions made (link to DECISIONS.md entry if applicable)}
- {bullet — gotchas hit (link to GOTCHAS.md entry if applicable)}
```

Keep it terse — bullets, not paragraphs. The diff captures the *what*; the bullets capture the *signal*.

### Step 4 — Add `DECISIONS.md` entries (if any new decisions)

Only add entries for **non-trivial choices** that future-you would benefit from understanding the reasoning behind. Format:

```markdown
## D-NN — {Decision title}

**Date:** YYYY-MM-DD
**What:** {The decision, one sentence}
**Alternatives considered:** {2-3 options that were on the table}
**Why this one:** {The deciding factor — usually a trade-off named explicitly}
**Cost of reversal:** {Cheap / Medium / Expensive — what would it take to undo}
```

If no new decisions, skip this step. Don't pad the file with trivial calls.

### Step 5 — Add `GOTCHAS.md` entries (if any new failure modes)

Same format as the existing entries (G-NNN). Add only if a real failure mode surfaced — not every dead-end exploration is a gotcha.

### Step 6 — Show the diff + offer to commit

Run `git diff session-docs/` (and `git status` if files were added). Show the diff to the operator. Suggest a commit:

```
chore(session): wrap session YYYY-MM-DD — {1-line summary}
```

**Do not auto-commit.** The operator may want to amend, may have other staged changes, may want to merge with another commit. Show the diff, propose the message, wait for go.

## Anti-patterns

- **"The session was uneventful — skip"** — _"Nothing happened worth recording."_ Uneventful sessions still produce signal. "Tried approach X for 2 hours, didn't work, switching to Y" is a high-value STATE.md update because it prevents next-session from re-trying X. Always run the skill; let the output be short if the session was short.
- **"Update everything from memory"** — _"I'll fill in STATE.md without asking the operator."_ The operator knows their intent + their next move. You know only what's in this window. Ask before writing.
- **"Auto-commit without showing the diff"** — _"Saves a step."_ The operator should see what's being committed. Show the diff first, then commit on their explicit go.
- **"Update PROJECT-DETAILS.md / CLAUDE.md too"** — _"They might be stale."_ Those are operating rules + architecture, not session state. Stale-docs-audit handles them as a separate concern. Session-end-update is scoped to session-docs/ only.
- **"Skip the SESSION-LOG entry — STATE.md captures it"** — _"They duplicate each other."_ They don't. STATE.md is a snapshot (overwritten); SESSION-LOG.md is a journal (appended). The snapshot tells you *where you are*; the journal tells you *how you got here*. Need both.

## What this skill does NOT touch

- `PROJECT-DETAILS.md` — operating rules + architecture; rarely changes mid-session; manual edit only
- `CLAUDE.md` — project identity + operational principles; manual edit only
- `references/**` — knowledge base; immutable per session
- `templates/**` (if applicable to this project) — templates for downstream generation; immutable per session
- Code files — that's the work itself; commit cadence is separate

<!-- AUTHOR NOTE: customise this section for the project. Add any project-
     specific session-end behaviours that should run alongside the session-docs
     update — e.g. running a lexicon check, regenerating a manifest, exporting
     an audit log digest, posting a status update to a coordination channel.
     Leave the universal steps above unchanged. -->

## Cross-references

- `post-compact-reload` — the read-side analog (rehydrate after compact)
- `stale-docs-audit` — separate scope (audits the whole doc tree for rot)
- `SESSION-LOG.md` — chronological journal of work
- `STATE.md` — current-state snapshot (PreCompact hook auto-fills header; this skill updates narrative)
