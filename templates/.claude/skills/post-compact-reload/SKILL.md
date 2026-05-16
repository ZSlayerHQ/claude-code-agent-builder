---
name: post-compact-reload
description: Use right after `/compact` runs mid-session, OR when noticing that rule files (`.claude/rules/*.md`, `CLAUDE.md`, etc.) may have been edited since session start. Re-reads the project's core documents so post-compact context reflects the current state of disk. Without this, long sessions silently drift away from the latest rule edits.
---

# Post-Compact Reload

Auto-loaded rule files (`.claude/rules/*.md`, project + user `CLAUDE.md`) load **at session start only**. They do NOT auto-refresh after:

- `/compact` (manual or automatic) — older rule content compresses out of context
- Mid-session edits to those files — the edited version is on disk but the in-memory copy is the pre-edit version

This skill re-reads the core documents so the post-compact context reflects what's actually on disk.

## When to invoke

- **Right after `/compact` completes**, before the next task starts
- **When you notice** a rule file was edited mid-session and the current version matters
- **Long sessions** where the conversation is older than the most recent rule edit
- **Trust signal:** if you find yourself uncertain whether your understanding of a project's rule reflects the current file, run this skill — it's cheap and catches drift

## Universal files to read (every BAB-generated project has these)

Read these in this order. Use the `Read` tool directly (not `Glob` / `Grep` — full content needed):

1. **`CLAUDE.md`** (project root) — project identity, operational principles, agent roster, file locations
2. **`~/.claude/CLAUDE.md`** (user global) — operator's personal preferences, RTK config if applicable, global rules
3. **`session-docs/STATE.md`** — current invariants, active work, last verified state, open assumptions, active hazards. **READ FIRST after any compact** — anchors the AI to where work left off.
4. **`session-docs/GOTCHAS.md`** — known failure modes for this project + their fixes
5. **`PROJECT-DETAILS.md`** — tech stack, conventions, commands, locations

## Project-specific rule files

<!-- AUTHOR NOTE: customise this section for the project. List every file in
     `.claude/rules/` plus any other auto-loaded rules the project depends on.
     The defaults below are illustrative — replace with the actual rule files
     this project uses. -->

If this project has any of the following, re-read them too:

- `.claude/rules/*.md` — every file (auto-loaded at session start)
- `lexicon/resources/_schema.yml` (if lexicon discipline scaffolded) — schema-of-schemas; rules in `.claude/rules/naming-lexicon.md`
- `lexicon/DRIFT-REGISTER.md` (if applicable) — any locked-decision overrides
- `docs/VISION.md` (if scope-wide vision document exists) — mission + non-goals
- `session-docs/DECISIONS.md` — past architectural choices + reasoning
- `bugfixing/GOTCHAS.md` or domain-specific gotcha files — re-read the relevant sections

## Optional second pass

If the upcoming work touches a specific area, also read:

- `docs/research/00-recommendations.md` (if a research wave informed agent design) — synthesised findings
- The relevant `docs/research/NN-<topic>.md` file for the domain you're about to work in
- `session-docs/SESSION-LOG.md` last entry — chronological context of recent work

## How to use after reload

After reading the files, briefly confirm to the operator which files were re-read so they know context is current. One sentence is enough — don't repeat the file contents back, just signal "context restored."

Example:
> Re-read `CLAUDE.md`, `STATE.md`, `GOTCHAS.md`, `PROJECT-DETAILS.md`, and the 4 files in `.claude/rules/`. Context current.

## Anti-patterns

- **"I just re-read STATE.md, that's enough"** — _"The other files probably haven't changed."_ One file is not a reload. Rule files (`.claude/rules/*`) are the highest-drift target post-compact because they're terse + edited often. Read them all.
- **"I'll Glob the rules dir and grep for the relevant rule"** — _"Faster than reading every file."_ Glob + Grep don't load full content into context — the model still doesn't have the rule's full text post-compact. Use `Read` per file.
- **"Skip the user-global `~/.claude/CLAUDE.md`"** — _"It's the same as last session."_ The operator may have edited their global config mid-session (especially for RTK / global preferences). Re-read.

## Why this skill exists

Long sessions compact periodically. Each compact silently discards rule content. The operator authored those rules to load every session — they need to load again after every compact for the same reason. Without this skill, the AI drifts back to a pre-rule-load behaviour around the 2nd or 3rd compact in a session, even though the disk still has the rules in place.

This skill is the manual analogue of the auto-load that happens at session start.
