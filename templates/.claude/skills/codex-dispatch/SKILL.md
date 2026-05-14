---
name: codex-dispatch
description: Dispatch OpenAI Codex CLI for independent static-analysis verification of medium-to-large code changes, multi-slice cluster post-scans, schema-changing migrations, or bug investigations needing a cross-file drift sweep. Codex runs autonomously, walks the prompt's layers, writes structured output to a target path. Use proactively after any multi-slice cluster phase ships, on any RED finding that needs deeper triage, or when a single-bot ship needs a second-opinion read. Different model = different errors = better coverage.
---

# Codex Dispatch

OpenAI Codex CLI is the static-side independent verifier in this project's quality workflow. Different model (gpt-5.5) catches errors Claude (Opus 4.7) misses by construction — orthogonal training data, different reasoning style.

> **Prerequisite:** Codex CLI installed + configured. Typical install paths:
> - Windows: `C:\Users\<user>\AppData\Roaming\npm\codex.cmd`
> - macOS / Linux: `~/.npm/bin/codex` or wherever npm puts global binaries
>
> Config lives at `~/.codex/config.toml`. Skip this skill entirely if Codex isn't installed on the operator's machine.

## When to dispatch

**Always dispatch:**

- Per-phase post-scan for **multi-slice clusters** (4+ phases or 14+ slices in flight) — independent verifier catches drift the shipping bot missed
- After any **schema-changing migration** (FK target / column type / rename) — walks the post-migration consumer sweep
- After any cluster touching **3+ layers** (DB / BE / FE / tests / lexicon)

**Useful when not mandatory:**

- Medium-to-large code changes (~3+ files / 200+ lines) outside a cluster — second-opinion static read
- Bug investigations needing cross-file drift sweep (e.g., "did this rename catch every consumer?")
- Pre-merge audit on a complex feature branch
- When the project's production-grade default calls for an independent verify before declaring closure

**Don't dispatch for:**

- Single-line fixes
- Doc-only commits
- Cosmetic / formatting changes
- Tasks where the in-Claude code-review subagent (e.g. `feature-dev:code-reviewer`) is sufficient — slice-grain reviews are ~30s + ~$0.30 in Claude, faster + cheaper than Codex's 5-15 min + $1-3

## Default config

Recommended `~/.codex/config.toml` for production-grade cluster verification:

| Setting | Value | Rationale |
|---|---|---|
| `model` | `gpt-5.5` | Latest OpenAI flagship as of mid-2026 |
| `model_reasoning_effort` | `xhigh` | Highest reasoning depth — matches Claude Opus 4.7's xhigh |
| `model_context_window` | `800000` | 800k tokens — fits a large cluster's full codebase context |
| `model_auto_compact_token_limit` | `700000` | Auto-compact 100k before window cap |
| `approval_policy` | `never` | Run autonomously — no interactive approvals |
| `sandbox_mode` | `danger-full-access` | Workspace-write needed for output files; trust the workspace |

Workspace trust: configure Codex to trust this project's root path so the sandbox doesn't prompt on every run. Per-project flag — never blanket-trust the whole drive.

Override defaults only if cost-sensitive on a small-scope check.

## Dispatch pattern

### Step 1: Write the prompt to a file

Land at `docs/plans/<issue>-<phase>-post-scan-prompt.md` (post-scan) or `<issue>-pre-scan-prompt.md` (pre-scan). The prompt declares:

- **Workflow context** — which issue / phase / prior scans
- **Authority sources** — catalogue + lexicon + rules + memory pointers Codex should respect
- **Output target** — the file path where Codex writes the scan
- **Verify layers** — numbered, each with explicit verification steps + expected outcome
- **Required output format** — verdict + per-layer verdict + readiness recommendation
- **Failure modes to anticipate** — known sandbox quirks + how Codex should document them

Maintain at least one **canonical post-scan prompt** in `docs/plans/` per cluster type — mirror it for subsequent dispatches so output shape stays consistent across runs.

### Step 2: Dispatch the run

Use Bash with `run_in_background=true` since runs are 5-15 min:

```bash
cd "<repo>" && codex exec --skip-git-repo-check --sandbox workspace-write "Read the prompt at <prompt-path>.md and execute it. Write your scan output to the path declared in the prompt's '## Output target' section. Use the prompt's '## Required output format' as your structure."
```

Flags:

- `--skip-git-repo-check` — skip the "this isn't a git repo" interactive prompt
- `--sandbox workspace-write` — allow Codex to write to the workspace (it needs to write the output file)
- The meta-instruction is short; the prompt file does the heavy lifting

For pre-scans (scope-the-work phase) frame the meta-instruction as "scope the work" instead of "execute it". For post-scans (verify-the-ship phase) frame as "verify the ship matches the plan + flag any drift".

### Step 3: Read the output

When the background task completes, read the output file (the path declared in `## Output target`). Codex writes a structured GREEN / RED verdict per layer + a readiness recommendation.

### Step 4: Act on the verdict

- **GREEN:** cluster closes; next phase opens
- **RED:** open a fix slice for the specific layer Codex flagged, ship it, re-dispatch Codex post-scan-N+1 with the same prompt (or an updated one if scope shifted)

## Skill invocation

This skill activates when:

- The operator asks to "run codex" / "fire codex" / "post-scan with codex" / "verify with codex"
- The shipping bot recognises a multi-slice cluster phase has shipped + needs verification
- A complex bug needs an independent cross-file static sweep

When invoked: confirm the prompt file path (or offer to write one based on the cluster context), then dispatch. Always show the dispatch command to the operator before firing so they can intervene.

## Sandbox limitations to anticipate

Codex sandbox sometimes hits OS-path edge cases:

- **Windows paths with spaces:** `EPERM: lstat 'D:\<path with spaces>'` errors on `npm run` commands. When this happens, Codex documents which checks were SKIPPED + falls back to static-source analysis. Not a blocker for static layers; flag for runtime re-verify post-scan if runtime checks were skipped.
- **MCP server tools not exposed:** Codex doesn't always inherit the project's MCP server set. Workaround: the prompt should list explicit queries Codex can write to its own output as "I would run this if the MCP were available", and the shipping bot validates those queries separately.

Document any new sandbox quirks you discover in this project's own `session-docs/GOTCHAS.md`.

## Cost awareness

xhigh effort + gpt-5.5 + 800k context ≈ **$1-3 per cluster-phase post-scan run** typical. A 5-phase cluster with per-phase dispatch ≈ $5-15 total verification cost. Worth it for the cluster-close gate on production-grade work; overkill for trivial changes.

If cost-sensitive: drop effort to `medium` for small-scope checks; keep `xhigh` for cluster-close gates.

## Cross-references

This skill assumes the project also has:

- A workflow rule documenting the verify-pass procedure (e.g. `.claude/rules/codex-verify-pass.md`)
- A `bugfixing/GOTCHAS.md` or `session-docs/GOTCHAS.md` documenting sandbox quirks discovered in this project
- At least one canonical post-scan prompt in `docs/plans/` as a starting point for new clusters

If those don't exist yet, the skill still works — author them as the project grows. The dispatch pattern above is self-contained.
