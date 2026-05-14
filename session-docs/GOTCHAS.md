# Agent Builder Gotchas

Failure modes the agent builder has hit while doing meta-work (designing rosters, generating directories, staging upgrades, auditing). Each entry is a real pattern with a fix and warning signs — strip the personal incident details, keep the lesson.

Format per entry: **G-NNN — short title**, one-line summary, then *Mistake mode* / *Warning signs* / *Fix*. Entries are append-only — never delete, only annotate with "Resolved" / "Superseded" notes.

For per-project gotchas (in generated projects), see that project's own `session-docs/GOTCHAS.md`. This file is for the agent builder's own meta-operation.

---

## G-001 — Verify SHAs against actual git, not memory state files

**Mistake mode:** Treating a `memory/project_<name>_state.md` commit-log table as authoritative. State memory is a snapshot at session-write time — anything committed after the snapshot is missing by construction.

**Warning signs:**
- About to declare a SHA "fabricated" / "doesn't exist" based on a memory file
- Auditing a doc that cites SHAs from a different repo than the one currently checked out
- Reasoning from memory's commit log without ever running `git log` against the repo

**Fix:** Run `git -C <repo-path> log --oneline <sha> -1` against the repo named or implied by the doc. For cross-repo citations (e.g. an agent-builder-side kit referencing a sibling project's SHAs), point `-C` at the sibling, not the agent builder. Only declare a SHA missing if the actual repo confirms it.

---

## G-002 — Twin audit rules — don't rubber-stamp AND don't false-positive

**Mistake mode:** Two opposite failures with the same root cause (not checking the actual artifact). When the operator asks "is it ready?" / "do a full audit" / "does this look solid?", check the artifacts; never reason from priors or cached snapshots.

**Warning signs:**
- About to say "looks good" without having opened the file in question
- About to flag an issue based on a derivative source (memory file, prior conversation, recollection) rather than reading the actual artifact
- Skipping a step on the AUDIT-CHECKLIST because "I already know this is fine"

**Fix:** Run `session-docs/AUDIT-CHECKLIST.md` end-to-end against the staged work. Read every cited file. Verify every cited SHA. Cross-check every cited path. Report findings honestly — false positives erode operator trust as much as rubber-stamps.

---

## G-003 — Cloud-sync locks block `mv` during sibling promotion

**Mistake mode:** Using `mv "output/<project>/" "../<project>/"` to promote a generated directory to a sibling location. Cloud sync agents (OneDrive, Dropbox, iCloud, Google Drive) hold open file handles during sync, returning `Device or resource busy` mid-move.

**Warning signs:**
- Promotion command errors with "Device or resource busy" or "resource temporarily unavailable"
- Working in a cloud-synced path (look for `OneDrive`, `Dropbox`, `iCloud` in the absolute path)

**Fix:** Two-step `cp -r` then `rm -rf`. After copy, verify file count matches between source and destination before removing the source. Pattern: `cp -r output/<project> ../<project> && diff <(cd output/<project> && find . | sort) <(cd ../<project> && find . | sort) && rm -rf output/<project>`.

---

## G-004 — `.gitignore` silently excludes files from archive sync

**Mistake mode:** Running `git add archive/<project>/` to mirror a sibling project into the agent builder's archive/ — files matching the agent-builder-side `.gitignore` (e.g. `.mcp.json` if it's gitignored at the wrapper level) get silently dropped from the commit. Archive is now incomplete; future "scaffold from archive" loses config.

**Warning signs:**
- `git status` shows the project in `archive/` but a known file (e.g. `.mcp.json`) is missing from the staged set
- Operator asks "did we capture everything in archive/?" and the answer is "I think so" — i.e. it wasn't checked

**Fix:** `git add -f archive/<project>/.<file>` to force-add. Verify with `git diff --cached --name-only | grep <file>` before committing. Periodically audit the agent-builder's own `.gitignore` for accidental exclusions.

---

## G-005 — Archive/sibling divergence after promotion

**Mistake mode:** After promoting a generated project to a sibling location (`../<project>/`), live work happens in the sibling but the agent-builder's `archive/<project>/` is never resynced. Archive snapshots eventually lag the live project by hundreds of commits.

**Warning signs:**
- Operator asks "what's in archive/?" and the answer is older than the latest sibling commit
- Agent-builder-side upgrade work that needs to reference the latest project state pulls stale data from archive/
- Manifest entry says "Archive resynced end-of-session YYYY-MM-DD" with a date weeks old

**Fix:** Operator-driven discipline — archive resync happens manually after meaningful sibling work, not automatically. Manifest entries should record the last resync date so staleness is visible. Per-session resync command: `cp -r ../<project>/ archive/<project>/` then `git add archive/<project>/ -f`.

---

## G-006 — Cross-repo SHA references in staged kits

**Mistake mode:** A staged upgrade kit (e.g. `output/_*-upgrades/<kit-name>/`) cites SHAs from a sibling project repo as worked-example references. Future-me audits the kit thinking the SHAs should resolve in the agent-builder's git history. They don't — they live in the sibling.

**Warning signs:**
- Auditing an `INTEGRATION-NOTES.md` that says "patterns lifted from <project>'s evolution (commits X..Y)"
- About to run `git log X..Y` in the agent-builder repo and conclude SHAs are missing

**Fix:** Always identify which repo a SHA citation refers to before verifying. Agent-builder meta-docs frequently cite sibling-repo SHAs by convention. Run `git -C ../<sibling>/ log` against the sibling.

---

## G-007 — INTEGRATION-NOTES path drift from staged files

**Mistake mode:** INTEGRATION-NOTES.md lists "files in this staging directory" and target placement paths. If the staged directory has files the table doesn't list (or vice versa), the copy commands or operator's manual placement is incomplete.

**Warning signs:**
- Adding a new file to a staged kit without updating its INTEGRATION-NOTES file table
- INTEGRATION-NOTES "Files in this staging directory" table shorter than `ls output/_*-upgrades/<kit>/` actual contents

**Fix:** Audit every staged kit before commit — `ls -R output/_*-upgrades/<kit>/` against the INTEGRATION-NOTES file table. They must match exactly. Run this as part of `AUDIT-CHECKLIST.md` step "file-system parity check."

---

## G-008 — Override scope discipline

**Mistake mode:** Operator overrides the agent-builder CLAUDE.md for a specific reason (e.g. "override the claude.md, build session-docs at the agent-builder root"). Future-me treats the override as permanent and starts modifying `templates/`, `references/`, or `.claude/` freely.

**Warning signs:**
- About to edit a file in `templates/`, `references/`, or `.claude/` without a fresh, in-conversation override from the operator
- Reading "operator overrode CLAUDE.md once" as "the constraint is gone forever"

**Fix:** Overrides are scoped to the specific task they were granted for. The CLAUDE.md constraint resumes as the default for the next ask. If unsure, ask: "this task overrides CLAUDE.md X — should I treat the override as scoped to just this, or broader?"
