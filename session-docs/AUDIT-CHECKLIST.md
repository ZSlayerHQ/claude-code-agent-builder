# Agent Builder Audit Checklist

When the operator asks "is it ready?" / "do a full audit" / "do these docs make sense?" / "does X look solid?", run this checklist end-to-end against the artifact under review. Don't reason from memory or vibes — open the files.

Companion docs:
- `GOTCHAS.md` — failure modes that have actually been hit, with fixes
- `../manifest.md` — generated-project history (if this repo tracks one)

---

## Step 0 — Template-drift guard (template commits only)

When the operator (per G-008 per-task override) edits anything inside `templates/`, run:

```bash
bash scripts/check-template-paths.sh
```

The script fails if `templates/` contains paths that resolve inside the agent-builder repo but not inside generated projects (`references/...`, `output/_*-upgrades/...`, repo-relative `manifest.md`, `../archive/`). Such paths dangle in every generated project, confusing the AI on Session Start.

Fix flagged lines by dropping the citation or rephrasing to be self-contained, then re-run until clean (exit 0). Then continue with steps 1-8 if auditing a staged kit.

---

## Step 1 — File-system parity

For every staged kit / generated directory under audit:

- [ ] Run `ls -R <path>/` (or Glob) — list every file actually present
- [ ] Open the kit's INTEGRATION-NOTES.md (or equivalent index) — list every file it claims to contain
- [ ] Diff the two lists. They must match exactly. Mismatches are bugs.

**If files are present but unlisted:** add them to INTEGRATION-NOTES, or remove if accidental.
**If files are listed but absent:** stage the missing files, or remove the index entry.

---

## Step 2 — Cited path resolution

For every path cited in any kit doc (INTEGRATION-NOTES, README, reference guides):

- [ ] Cross-reference paths use forward slashes (the docs are read on Windows + Linux + Mac; PowerShell tolerates both, bash doesn't tolerate backslashes)
- [ ] Each cited path resolves to a real location — either in the staging directory or in the agent-builder repo itself
- [ ] Any one-liners (PowerShell or bash) use syntax appropriate for the operator's platform and work from the agent-builder root

---

## Step 3 — SHA verification (the G-001 trap)

For every commit SHA cited in any doc:

- [ ] Identify which repo the SHA should resolve in (the agent builder? a sibling project? a third repo?)
- [ ] Run `git -C <repo-path> log --oneline <sha> -1` — confirm the SHA exists
- [ ] If the doc cites a SHA range (`A..B`), confirm `A` is an ancestor of `B`: `git -C <repo-path> merge-base --is-ancestor A B && echo ok`

**Never** declare a SHA fabricated based on a memory state file's commit log. State files are snapshots — they lag the actual repo by every commit made since the snapshot was written.

---

## Step 4 — Cross-doc consistency within the kit

Within a single staged kit, verify references agree across files:

- [ ] Verb whitelist count: do INTEGRATION-NOTES, the verb file, and any reference doc agree on the count?
- [ ] Decision IDs (D1, D2, …): does every cited decision exist in the README / decisions log?
- [ ] Numbered insertion steps (e.g. "step 4a", "step 4b"): does the numbering scheme make sense if applied independently? Flag dependencies on other kits.
- [ ] Section counts in structure standards: do they match the actual templates they describe?
- [ ] Cross-doc links: every "see X" reference points at a file that exists.

---

## Step 5 — Reference-implementation alignment

For kits that cite a worked-example project:

- [ ] Open the cited worked-example artifact at the referenced path — does its actual content match what the kit claims?
- [ ] Numbers (resource counts, enum counts, gold/stub split) — match the worked example's current state, not a stale snapshot
- [ ] Patterns described as "from <example>" — actually present in that example, not invented for the kit

---

## Step 6 — Output-quality compliance

- [ ] **Tight outputs** — no policy padding, no repeats of upstream Anthropic policy (cross-check against `references/claude-md-slimming-guide.md` if a generated CLAUDE.md is under audit)
- [ ] **Plain-language manual steps** in INTEGRATION-NOTES — concrete one-liner + bullet list of edits the operator needs to perform
- [ ] **Worked-example citation** — every reference doc points at a concrete project (the agent-builder's own archive, or a sibling worked example) as the lived example
- [ ] **One-thing-at-a-time cadence** — each staged kit is its own discrete unit, no big-batch staging
- [ ] **Operator-preference compliance** — if the project's CLAUDE.md or this repo's `.claude/rules/` declare additional norms (language register, regulatory scope, etc.), the artifact respects them

---

## Step 7 — Constraint compliance

- [ ] Staging pattern respected — agent-builder upgrades land in `output/_*-upgrades/<kit-name>/`, not directly in `templates/` or `references/`
- [ ] No writes to `templates/`, `references/`, `.claude/`, or the agent-builder's own `CLAUDE.md` — unless the operator explicitly overrode the constraint for this task (per G-008, scope the override carefully)
- [ ] Every kit ships an `INTEGRATION-NOTES.md` — operator can't apply a kit without one
- [ ] Manifest updates use the format from `.claude/rules/02-output-format.md`

---

## Step 8 — Report findings honestly

After running steps 1-7:

- **Real issues** — list each with file path + line number + what's wrong + recommended fix
- **Cosmetic issues** — list separately so operator can choose whether to fix
- **What's solid** — explicit confirmation of the things that passed, so operator sees what was checked

Honest reporting beats both extremes:
- **Rubber-stamping** ("looks good") is a failure if anything is actually wrong
- **False-positiving** is also a failure — flagging issues that aren't real erodes trust in the audit (G-001)

If a finding is uncertain ("this might be wrong but I'm not sure"), say so explicitly and run the check before claiming.

---

## When the audit finds nothing wrong

That's a valid outcome — but only if every step was actually executed. Saying "audit clean" without running steps 1-7 against the artifacts is rubber-stamping. The checklist is the procedure; following it is the proof.
