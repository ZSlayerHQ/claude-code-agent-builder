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

---

## G-009 — Copy the settings.json deny list from the template; never hand-write it

**Mistake mode:** Generating `.claude/settings.json` by hand-writing `permissions.deny` from memory of "the standard Bash safety rules" instead of copying `templates/settings-template.json`. A fork-bomb pattern like `Bash(:(){ :|:& };:)` contains inner `()` that Claude Code's permission parser reads as an empty `Bash()` — it logs `Invalid permission rule … Empty parentheses` at every launch and skips the rule. Non-fatal, but it warns the operator on every start and the rule they think is protecting them is not loaded.

**Warning signs:**
- Writing a settings.json `deny` list without opening `templates/settings-template.json` first
- Any deny pattern containing literal `()`, `{}`, or other shell metacharacters inside `Bash(...)`

**Fix:** Copy the deny list verbatim from `templates/settings-template.json` — it uses clean prefix patterns (`Bash(rm -rf *)`, `Bash(git push --force*)`, `Bash(git reset --hard*)`, `Bash(*--no-verify*)`, the `Read(./.env*)` set). Never put parens or braces inside a `Bash(...)` pattern. There is no clean way to express a fork bomb as a permission rule, so rely on the blanket `Bash(rm -rf *)` plus the catastrophic-path rules instead.

**Incident:** 2026-06-14. A generation hand-wrote a deny list including a fork-bomb pattern; the launcher flagged it on first open. The template itself was clean — the bug was generation-side, from not copying it. The other 11 deny rules were unaffected, which is exactly why it went unnoticed until launch.

## G-010 — A second writer on a reference doc can overwrite it with an older baseline; a model sweep is only as complete as its regex

**Mistake mode:** Two related failures, both from automated passes that edited this repo's files without a builder session reading the result.

1. A scheduled "refresh the model guidelines" job rewrote `references/anthropic-guidelines-full.md` from its own copy, which was built on an older baseline. It added correct new facts but silently discarded a later restructure (a prompt-lever block, a per-generation delegation table) and regressed the header to an older model. The file sat uncommitted for weeks with its body contradicting the committed rules.
2. A model sweep replaced one pinned ID with the `opus` alias across the templates but missed every agent whose frontmatter named a *different* pinned ID, leaving one pinned agent per project. It looked complete because the `settings.json` files, which it did catch, were what anyone checked.

**Warning signs:**
- `git status` shows a `references/*.md` file modified by something other than this session, and the diff moves the "refreshed on" date *backwards*
- A sweep's grep pattern names one model ID while the tree holds agents pinned to more than one
- A changelog paragraph in a doc describes this repo in the third person — the file came from outside

**Fix:** Any cross-system pass that edits a reference doc must diff against HEAD before writing, and a builder session must re-read its reference docs when they show as modified (G-002 applies: open the file). Before replacing a modified reference doc, read the *whole* uncommitted diff and carry forward every hunk that is a fact rather than a structural regression — "the header is old" does not mean the body is. For model sweeps, grep for the *set* of IDs (e.g. `claude-opus-4-8|claude-opus-5\b|claude-opus-5-5`) plus the prose forms (`Opus 5\b`), read a sample of the hits, and state what the pattern cannot see (agents with no `model:` field at all). A swept number is a hypothesis (`.claude/rules/01-identity.md`).

**Incident:** 2026-09-22, Opus 5.5 launch day. Both failures were found while getting situated; the refresh then repeated the first one in the other direction by reading only part of a mixed diff and dropping newer facts, which a later session restored.

## G-011 — A config sweep verified on disk is not shipped: check HEAD and the remote, not the working tree

**Mistake mode:** A model-policy sweep edited every generated project's `.claude/settings.json` on disk and was "verified" by reading those files. But most of them already carried another tool's uncommitted edits, so the explicit-path commits left `settings.json` out.
- On disk: every project ran the new model alias with no output cap.
- Committed and pushed: 6 repos were still pinned to an older model, and 9 still carried the removed output-token cap.
- Anyone cloning got the old config. Found two days later by diffing `git show HEAD:<file>` against disk.

**Warning signs:**
- A verification step reads files from the working tree when the claim is about what other machines receive.
- `git status` shows the swept file as modified after the sweep "committed".
- A file the sweep touched also carries another writer's uncommitted edits.

**Fix:**
- Verify the committed state with `git show HEAD:<path>` (or `origin/<branch>:<path>`), not `cat <path>`.
- When the file has foreign uncommitted edits, don't skip it and don't sweep those edits into your commit. Build the new blob from HEAD, `git hash-object -w --no-filters`, then `git update-index --cacheinfo`, and commit with nothing else staged. That commits only your keys and leaves the other writer's edits in the working tree.
- Watch repo commit hooks (commitlint subject length, lint-staged): a failed commit leaves your blob staged, so re-commit rather than re-running the whole sweep.
- Hooks with absolute machine paths are a related portability defect. They belong in the per-machine, gitignored `.claude/settings.local.json`, not the shared `settings.json`.

**Incident:** 2026-09-24. Found during a settings cleanup and fixed with HEAD-based commits in every affected repo.

## G-012 — Friendly MCP names in an agent's `tools:` list resolve to nothing

**Mistake mode:** The agent templates listed MCP servers by friendly name: `tools: [Read, Write, Edit, Bash, Context7]` for builders and `[..., GitNexus]` for reviewers. Claude Code resolves `tools:` entries against real tool names only, and an MCP server needs `mcp__<server>` (or `mcp__<server>__*`). So `Context7` and `GitNexus` were dropped without a warning, and the agent ran with the rest. Only when nothing resolves does the spawn fail. Every generated builder went without Context7, and every generated reviewer without GitNexus.

**Evidence (2026-10-02, Claude Code 2.1.287, headless `--agents` probes):**
- `tools: ["Context7"]` → "Agent 'probe' would be spawned with zero tools — refusing. Its tools list resolved to nothing: unrecognized [Context7]."
- `tools: ["Read","Context7","GitNexus"]` → the agent had `Read` only.
- `tools: ["Read","mcp__context7","mcp__gitnexus"]` → `Read` plus every context7 and gitnexus tool.
- Official docs (sub-agents, `tools` field): "`mcp__<server>` or `mcp__<server>__*` grants ... every tool from the named server."

**Warning signs:**
- A capitalised product name in a `tools:` list (`Context7`, `GitNexus`, `GitHub`, `Playwright`).
- An agent whose brief relies on an MCP server it never seems to call.

**Fix:**
- Write MCP access as `mcp__<server>`, using the server's key from `.mcp.json` or `~/.claude.json`.
- Check a new agent's resolved tools with a headless `claude -p --agents` probe, or open `/agents`.
- Fixed in the templates, the tool-scoping and agent-design references, CLAUDE.md Rule 4 and the output rules. Projects generated earlier keep the old names until their agent files are corrected (one frontmatter line per agent).

**Incident:** 2026-10-02. Found while preparing a roster whose agents depend on an editor MCP server.

## G-013 — A branch with no upstream is not an unpushed branch

**Mistake mode:** Before a repository was retired, a count of local branches with no upstream (89 of 90) went to the operator as "89 branches that exist only on this machine". Most were already merged on the remote. The check answered "which branches track a remote branch", not "which commits are not on the remote".

**Fix:** Per branch, `git rev-list --count <branch> --not --remotes`; per detached worktree, `--not --branches --remotes`; then stashes and `git status` in every worktree. Report commits and uncommitted files, not branch counts.

**Incident:** 2026-10. The real exposure was 72 commits on 14 branches. Corrected before the decision was taken.

## G-014 — The gotcha hook knows the heading scheme in two places

**Mistake mode:** A project whose gotchas are not numbered `G-NNN` gets `pre-edit-gotcha-check.mjs` with `HEADING_REGEX` changed to its own scheme. The hook then finds entries, but `formatOutput` strips each heading with a second, hard-coded `G-\d+` pattern that no longer matches, so every injected entry prints its title twice.

**Fix:** Change both patterns together, then dry-run the hook against the project's real `GOTCHAS.md` and count each ID once in the parsed output.

**Incident:** 2026-10, generating a project with its own numbering. Caught in the dry run.

## G-015 — A headless check from a subfolder can pass on the wrong model

**Mistake mode:** A project routed its model through `.claude/settings.json`, and those settings load only for sessions opened in that folder. A `claude -p` smoke test run from a subfolder passed, and was reported as proof of the routing. It had run on the default model through the normal login.

**Fix:** Run the check from the project root, and assert the model from the run's `init` record. A pass only counts if the output shows it went the intended way.

**Incident:** 2026-11. Found when the same test failed from the subfolder with an invalid-model error.

## G-016 — Deny rules match how a command is spelled

**Mistake mode:** A `Bash(git push ...)` deny rule matches the command as typed. A wrapper word in front (`rtk git push`), `git -C`, an extra flag or a different refspec all walked past `Bash(git push origin v*)`: 5 of 9 spellings in one test.

**Fix:** Where a deny guards something irreversible, also check the thing itself. A `pre-push` git hook that refuses the protected refs works however the push is spelled.

**Incident:** 2026-11, auditing a generated project against a throwaway local remote.

## G-017 — A generated doc can narrow what its own research found

**Mistake mode:** A project's research listed every marker of a restricted API, yet its agents, skills and `CLAUDE.md` reduced them to one name: 19 functions out of at least 459. The research was right and each working doc read well, so only the upstream source showed the gap.

**Fix:** When a rule is distilled from research, count what it catches against the primary source before shipping it.

**Incident:** 2026-11.

## G-018 — A grep check that bans plain words bends the agent's vocabulary

**Mistake mode:** An agent file forbade self-rating with a Verification grep for `rating|score|rank`. On a problem about ranking search results the agent avoided "score" and "rank" altogether so the check would pass.

**Fix:** Anchor a check for opinions to labels and opinion phrases (`^(Rating|Score|Rank|Verdict):`, "best candidate"), and say in the line that ordinary uses of the words are fine. Smoke-test the agent on a request where the banned words are normal.

**Incident:** 2026-11, found by the smoke test.

## G-019 — A headless smoke test without the launcher's permission flag refuses writes

**Mistake mode:** A `claude -p --agent <name>` smoke run started in `default` permission mode, because a project's `defaultMode: bypassPermissions` does not apply to an untrusted copy in headless mode. The agent's one Write was refused, so its output format went untested.

**Fix:** Pass the same permission flag the launcher uses, and read `permissionMode` in the stream's `init` event before trusting the result. The same event lists the model, agents, skills and plugins.

**Incident:** 2026-11.

## G-020 — An `mcp__<server>` entry grants every tool on the server, including ones that write

**Mistake mode:** A "read-only" reviewer template listed an MCP server for impact analysis. One of that server's tools renamed symbols across files, so the reviewer held a write tool.

**Fix:** Before giving a server to a reviewer or auditor, list its tools and add `disallowedTools` for any that write, or name the read-only tools one by one as `mcp__<server>__<tool>`.

**Incident:** 2026-11, a smoke test in which a reviewer listed its own tools. The server was dropped from the default set.

## G-021 — A headless run's first event can list an agent's tools before its MCP servers connect

**Mistake mode:** Reading the `init` event of `claude -p --agent <name>` to prove an MCP server resolved. The server was still `pending` three seconds in, so the event listed none of its tools and looked like a naming fault.

**Fix:** Check `mcp_servers[].status` in the same event. If a server is `pending`, read the tool list of a run long enough to have used it.

**Incident:** 2026-11.

## G-022 — A smoke test in a temp folder loads any `CLAUDE.md` above it

**Mistake mode:** Reading a headless smoke test's complaints as faults in the project under test. Claude Code loads `CLAUDE.md` from every parent folder, so a stray one above the throwaway copy joins the run.

**Fix:** Before a smoke test in a scratch folder, look for a `CLAUDE.md` in each parent folder up to the drive root. Treat "two `CLAUDE.md` files disagree" in a result as this artefact first.

**Incident:** 2026-11. A months-old copy of another project's `CLAUDE.md` in the system temp folder had been loading into every scratch run.

## G-023 — Committing on a live project's own checkout

**Mistake mode:** Delivering a change to a project that already runs its own sessions by committing in its working folder, as you would in a project just generated. A live project has its own merge flow: the foreign commit leaves its checkout apart from its remote, and its sessions cannot tell where the change came from.

**Fix:** Before writing in a live project, find how it takes changes (usually a pushed branch that its own session merges). Where no route is recorded, stage the file under `output/` and hand over its path.

**Incident:** 2026-11. The checkout was one commit ahead of and two behind its remote within minutes.
