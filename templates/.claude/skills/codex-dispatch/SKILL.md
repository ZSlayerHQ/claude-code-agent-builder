---
name: codex-dispatch
description: Dispatch OpenAI Codex CLI (GPT-5.6 Sol/Terra/Luna) as an independent verifier or diagnostic sub-agent. Use when a shipped change needs an independent post-ship scan, a plan needs an adversarial pre-build review, a cross-cutting sweep (contract/consumer/residue audit) is needed, or a medium-to-large change wants a second-opinion read from a non-Claude model family. Covers model/effort selection, hardened headless exec dispatch, and the official GPT-5.6 prompt structure.
---

# Codex Dispatch

Codex is the independent static verifier: a different model family with a fresh context, so
it does not share Claude-side blind spots. Review consensus among Claude instances multiplies
confidence, not truth — an outside model is the actual cross-check.

> **Prerequisite:** Codex CLI installed and configured (`codex.cmd` on Windows via npm global,
> `codex` on macOS/Linux). Config lives at `~/.codex/config.toml`. Codex is a paid OpenAI
> service — budget roughly $1-3 per substantial verification scan. Skip this skill entirely
> if Codex CLI is not installed.

## When to dispatch

- **Post-ship verification scan** of a multi-file/multi-layer change (did the ship match the plan; any drift, siblings, or stale assertions missed).
- **Pre-build plan review** (adversarial read of an implementation plan before code exists).
- **Cross-cutting diagnostic sweeps** (enumerate a whole class: contract mismatches, deprecated-name residue, consumer lists after a schema change).
- **Second-opinion read** on any ~3+ file / ~200+ line change.
- NOT for: 1-3 line fixes, docs-only changes, anything a single grep answers, or work an
  in-Claude review subagent already covers more cheaply and faster.

Dispatches are DIAGNOSTIC by default: Codex reads and reports; it modifies nothing except its
output report. Fixes stay with the owning agent.

**Stage-0 premise check BEFORE dispatching a review of a fix or design:** verify the underlying
bug or claim by fetching the disputed artifact's CURRENT state (the actual message, row, file, or
deployed bundle) first. A review validates a design against its premise; it structurally CANNOT
catch a false premise — every reviewer is downstream of the same secondhand report. A well-designed
fix for a bug that does not exist still passes review.

## Model + effort selection (GPT-5.6 family, July 2026)

| Model | Use for | Cost /1M in/out |
|---|---|---|
| `gpt-5.6-sol` | DEFAULT for verification / review / audit: complex, open-ended, judgment-heavy. Strongest; best long-context. | $5 / $30 |
| `gpt-5.6-terra` | Fast scans, lighter sweeps, subagent legs; ~GPT-5.5-level at half the price. | $2.50 / $15 |
| `gpt-5.6-luna` | Extraction / classification / transform with a well-defined "good result", and web research. WEAK long-context — never for big-repo audits. | $1 / $6 |

Effort ladder: `none → low → medium → high → xhigh → max`, plus `ultra` (Codex-only: subagent
fan-out, not deeper thinking; entitlement-gated). Official guidance:

- Use the LOWEST effort that produces the needed result; most tasks do not need `max` or `ultra`.
- Verification / review scans: `high`. Hardest quality-first audits: `xhigh`; compare `max` only if measured better.
- Mechanical or tightly scoped sweeps: `medium` (or terra at `medium`).
- Migrating from 5.5-era settings: test ONE LEVEL LOWER first — 5.6 often holds quality with fewer tokens.
- Per-run override without touching config: `codex exec -m gpt-5.6-terra -c model_reasoning_effort=medium ...`

## Dispatch mechanics (hardened)

1. **Prompt lives in a file**, versioned next to the work (e.g. `docs/plans/<topic>-prompt.md`).
   Dispatch it stdin-as-prompt:
   ```bash
   codex exec - < docs/plans/<topic>-prompt.md
   ```
   If you must pass an inline prompt instead, ALWAYS close stdin — an inherited TTY-less pipe
   with no writer hangs `codex exec` forever (upstream openai/codex gh-20919):
   ```bash
   codex exec "..." < /dev/null
   ```
2. **Pin the deliverable harness-side**, never only in prose:
   - `-o <path>` writes the final message to a file (guaranteed; the model cannot forget).
   - **NEVER point `-o` at the same path the prompt tells codex to write its report to.**
     `-o` OVERWRITES that file at exit with the final chat message, replacing a full write-early
     report with a short summary. Either `-o` a SEPARATE summary path, or drop `-o` when the
     prompt uses the write-early protocol.
   - For gateable verdicts add `--output-schema schema.json -o result.json` with a `verdict` enum
     (e.g. GREEN/RED) plus a findings array, then branch in `jq`.
   - A prose "write your report to X" additionally requires `--sandbox workspace-write` — the
     default exec sandbox is READ-ONLY, so the model silently cannot comply.
3. **Global-only flags must precede the subcommand.** `-a` / `--ask-for-approval` and `--search`
   are parsed by the top-level `codex` command, NOT by `exec`. Placing them after `exec` is a hard
   parse error that kills the run before the model is reached. `-s` / `--sandbox`, `-m`, `-c`,
   `-o`, `-i`, `-p`, `--json`, `--output-schema`, and `--skip-git-repo-check` are accepted by
   `exec` itself. Upstream tracks the docs/CLI mismatch in openai/codex #13614 and #26602.
4. **Sandbox (`-s`)**: `read-only` (the default) for pure verification — on Windows this also
   avoids the broken write-sandbox machinery. `workspace-write` only when the run must write the
   report itself. `danger-full-access` only in isolated or containerised contexts — never as a
   standing default. **Approval** is an independent axis (`untrusted` / `on-request` / `never` /
   `granular`), but `exec` is already non-interactive, so an approval flag is usually redundant.
   When you do need one, use global position (`codex -a never exec …`) or config
   (`-c approval_policy=never`, which `exec` does accept). Canonical safe review combo:
   ```bash
   codex exec -s read-only -m gpt-5.6-sol -c model_reasoning_effort=high -o out.md - < prompt.md
   ```
   Deprecated: `--full-auto` (use an explicit `--sandbox workspace-write`).
   `--dangerously-bypass-approvals-and-sandbox` (`--yolo`) disables both — avoid.
5. **Network** is off even in `workspace-write`; enable it deliberately via
   `[sandbox_workspace_write] network_access = true` in config.
6. **Run in background and prove liveness**: expect output within seconds (`--json` emits
   `thread.started` almost immediately; or confirm the process is consuming CPU within ~30s). A
   silent process from t=0 is the stdin hang — kill it, fix stdin, retry. Retrying without fixing
   stdin hangs identically.
7. **Multi-stage pipelines**: `codex exec resume --last "<follow-up>"` carries context across
   analyse → verify → delta-check stages more cheaply than fresh runs.
8. Useful flags: `--skip-git-repo-check` (non-repo dirs), `--cd <path>`, `--ephemeral` (no session
   files), `-i img.png` (attach images).
9. **Windows notes**: paths containing spaces can EPERM in-sandbox npm/node — instruct the prompt
   to fall back to static analysis and SAY SO in the report. If the CLI fails to launch via PATH,
   use the absolute codex binary path.

### Long runs (over ~8 minutes) on the Claude Code harness

Claude Code's Bash tool hard-caps at 10 minutes and its background tasks can be reaped by the
harness lifecycle, so a foreground `codex exec` that runs long is killed mid-report. Two
mitigations, in order of preference:

**1. Write-early protocol — always do this.** The prompt must tell codex to create its report file
containing `STATUS: IN PROGRESS` as its FIRST action and append findings as it goes, so even a
killed run leaves a usable partial on disk. This costs nothing and removes most of the pain on its
own.

**2. Spawn outside the harness job object.** For runs that reliably exceed the cap, launch codex
through a mechanism that is not a child of the harness process — on Windows, WMI
`Win32_Process.Create` works — then poll the log file for a completion marker rather than blocking
on the process. Three details make or break this:

- The spawned shell is non-login, so it lacks npm's global bin on PATH and `codex` resolves to
  "not found" as a silent failure. Prepend the npm global bin directory explicitly.
- Have the wrapper write a `CODEX-EXIT=<code>` marker as its last log line, so the watcher has an
  unambiguous completion signal instead of guessing from output.
- Snapshot pre-existing codex PIDs BEFORE spawning and kill only PIDs absent from that snapshot.
  Never kill by process name — that takes out concurrent sessions' dispatches too.

These wrapper scripts are environment-specific (shell, path layout, process model), so this skill
describes the pattern rather than shipping scripts that would silently mismatch your machine. Short
runs that reliably finish under ~8 minutes need none of this — a plain backgrounded `codex exec` is
fine.

## Prompt structure (official GPT-5.6 guidance — the canon)

GPT-5.6 changed the rules from the 5 / 5.5 era. The measured finding: LEANER prompts score higher
(removing repeated instructions and examples improved evals 10-15% and cut tokens 41-66%). Write
accordingly:

- **State each instruction ONCE.** Repeating "do not modify" / "ask first" now causes spurious
  approval pauses. One compact authorization policy, in one place.
- **Describe the destination, not the route**: goal + hard constraints + success criteria. Drop
  step-by-step prescriptions — the model plans better than 5.5 did.
- **Name file paths explicitly** — the CLI cannot see your open files or your conversation.
- **Do not say "be concise"** (5.6 is already concise; it over-truncates). Instead state
  preserve-vs-omit priority: "Lead with the verdict. Include evidence per finding and any material
  caveat. Omit narrative."
- **Review-task shape** (official exemplar pattern): artifact + failure-mode focus + per-finding
  evidence requirements (cite file:line, impact, likelihood, mitigation) + ranked, bounded output
  ("the N most important, in severity order").
- **Include a premise-challenge layer** in review prompts: ask the verifier to REFUTE the
  dispatcher's framing (alternative root cause, alternative design), not just confirm it. A prompt
  written by an agent that holds a blind spot can steer an independent reviewer straight into the
  same blind spot; the challenge layer restores the independence.
- Trim example blocks unless they encode a real requirement or fix a measured gap.

### Canonical prompt-file skeleton

```markdown
# <Verifier> <task title>

## Role + authorization
You are the independent static verifier. Read-only diagnosis: modify no files
except the output report. If a command cannot run in your sandbox, fall back to
static analysis and note it.

## Goal
<one paragraph: the outcome + why it matters>

## Context (read these)
- <file/dir paths, the commits/plan under review, authority documents>

## Scope + constraints
<what is in scope, what is explicitly out, hard boundaries — each stated once>

## What to check (graded layers)
1. <layer> — grade GREEN/AMBER/RED with reasoning
2. ...

## Success criteria
<what a complete report contains; e.g. "every layer graded, every finding cites
file:line with impact + mitigation, top findings ranked">

## Output
Write to: <path>            <- also pin with -o at dispatch time
Format:
  # <title>
  ## Overall: GREEN | RED | READY-WITH-CHANGES
  ## Layer verdicts (numbered, graded, reasoned)
  ## Required changes (numbered, smallest first)
  ## Notes / limits
```

## Verdict conventions

- Fixed vocabulary, declared in the prompt: `GREEN` / `AMBER` / `RED` per layer plus one `Overall`.
  For machine gating prefer `--output-schema` with the enum.
- Overall semantics are THREE-valued, not binary: `GREEN` = auto-pass; `RED` = block;
  `READY-WITH-CHANGES` = triage-required (neither auto-pass nor hard-fail — a human or agent folds
  the changes in, then proceeds). A `jq` gate on `=="GREEN"` alone silently converts
  triage-required into a block; branch on all three.
- First-line-verdict is the cheap alternative for prose reports (line 1 is the verdict, the shell
  reads it to branch).
- Reports are claims-about-code unless the run actually executed something — require quoted command
  output for any runtime claim, or keep the run read-only so the report is honest by construction.

## After the run

- Read the report; triage findings on merit. Verify against source before acting — the verifier can
  be wrong, and premise errors survive review consensus.
- Confirmed findings get owners and fixes; commit the prompt and report files as the review record.

## Research dispatch recipe — Luna with live web search

For WEB RESEARCH legs (best-practices surveys, fact-finding, source-cited reports) rather than repo
work, `gpt-5.6-luna` at `xhigh` is the default: in a scored head-to-head against a Sonnet-class
model it matched or beat it on both topics at a fraction of the cost, with authoritative sources and
directly adoptable output.

The reliable shape — every element is load-bearing:

```bash
codex --search exec -m gpt-5.6-luna -c model_reasoning_effort=xhigh \
  --ephemeral --skip-git-repo-check \
  -o "$OUT/report.md" - < "$OUT/prompt.md" > "$OUT/run.log" 2>&1 &
```

- `--search` is a GLOBAL codex flag and must come BEFORE `exec` (after it is a hard "unexpected
  argument" error). It enables the native live `web_search` tool; without it Luna answers from
  training data while looking identical.
- Prove the search is live, do not assume: `grep -c "web search:" run.log` within ~60s. A healthy
  research run shows queries accumulating (20+ is typical).
- `-` with `< prompt.md` is stdin-as-prompt with stdin CLOSED (the gh-20919 hang guard); `-o` pins
  the deliverable harness-side; `--ephemeral --skip-git-repo-check` suit non-repo scratchpad runs.
- Prompt shape: state the research question, the audience and use, a numbered coverage list, "lead
  with a prioritized concrete guideline list", and "every non-obvious claim cites its source URL".
  Do NOT say "be concise".
- These runs typically finish in 4-8 minutes, under the 10-minute Bash cap — plain backgrounded
  exec is fine, no out-of-harness spawn needed.
- Luna's long-context weakness does not bite here (fresh context, web-fed); it remains the wrong
  model for big-repo audits.
- `gpt-5.6-terra` at `high` scored comparably on research in the same head-to-head, but at 2.5x
  Luna's price for equal-at-best quality. Role summary: **Sol at `high`** = builds and verification
  scans; **Luna at `xhigh` with `--search`** = web research; **Terra at `high`** = light code sweeps.
