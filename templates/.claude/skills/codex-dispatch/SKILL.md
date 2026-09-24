---
name: codex-dispatch
description: Dispatch OpenAI Codex CLI (GPT-6 Sol default, Astra for the hardest reviews, Luna for research) as an independent verifier or diagnostic sub-agent. Use when a shipped change needs an independent post-ship scan, a plan needs an adversarial pre-build review, a cross-cutting sweep (contract/consumer/residue audit) is needed, or a medium-to-large change wants a second-opinion read from a non-Claude model family. Covers model/effort selection, hardened headless exec dispatch, and the official GPT-5.6 / GPT-6 prompt structure.
---

# Codex Dispatch

Codex is the independent static verifier: a different model family with a fresh context, so
it does not share Claude-side blind spots. Review consensus among Claude instances multiplies
confidence, not truth — an outside model is the actual cross-check.

> **Prerequisite:** Codex CLI installed and configured (`codex.cmd` on Windows via npm global,
> `codex` on macOS/Linux). Config lives at `~/.codex/config.toml`. Codex is a paid OpenAI
> service — a substantial verification scan measured about USD 0.40 on GPT-6 Sol and USD 2-2.50 on
> GPT-6 Astra (2026-09). Skip this skill entirely
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

## Model + effort selection (GPT-6 generation, September 2026)

| Model | Use for | USD per M in / out |
|---|---|---|
| `gpt-6-sol` | DEFAULT for verification / review / audit. OpenAI's recommended Codex model. In one measured head-to-head (2026-09-23, same prompt, both at `medium`) it found every core issue, one partially, with zero false positives. | 2 / 10 |
| `gpt-6-astra` | The hardest judgment-heavy reviews and sign-off audits. It found the most real issues in that head-to-head, but ranked a false positive first — verify any "this breaks the build" claim from a read-only run before acting on it. Rejects effort `none`, `temperature` and `top_p`. | 10 / 50 |
| `gpt-6-sol` at `low` | Fast mechanical scans, lighter sweeps, subagent legs. There is no GPT-6 Terra. | 2 / 10 |
| `gpt-6-luna` | Extraction / classification / transform with a well-defined "good result", and web research (the measured research default since 2026-09-24 — see the recipe below). Effort up to `max`, no `ultra`. WEAK long-context — never for big-repo audits. | 0.10 / 0.50 |
| `gpt-5.6-luna` | Rollout fallback for the Luna lane; gave more copy-ready depth but slightly lower accuracy in the 2026-09-24 research head-to-head. | 0.20 / 1.20 |
| `gpt-5.6-sol` / `gpt-5.6-terra` | Rollout fallbacks when the account or client does not yet see GPT-6 Sol. | 4 / 20; 2 / 12 |

All current models have a 1.05M-token API context window; 272K is the short-context **billing** boundary (requests
over it are billed at the long-context rate on API-key auth), not the window. GPT-6 models appear in Codex "when
available" to your plan: run a one-line smoke (`codex exec -m gpt-6-sol "reply ok" < /dev/null`) before relying on one.

Effort ladder: `none → low → medium → high → xhigh → max`, plus `ultra` (Codex-only: subagent
fan-out, not deeper thinking; entitlement-gated). Official guidance:

- Use the LOWEST effort that produces the needed result; most tasks do not need `max` or `ultra`.
- Start from OpenAI's recommended points — GPT-6 Sol `medium`, Luna `high`, Astra `low` — and raise one level when a run comes back thin. Hardest quality-first audits: `xhigh`; compare `max` only if measured better.
- Mechanical or tightly scoped sweeps: `gpt-6-sol` at `low` or `medium`.
- Migrating between generations: test ONE LEVEL LOWER first — "reasoning efforts don't map exactly between model generations".
- Per-run override without touching config: `codex exec -m gpt-6-sol -c model_reasoning_effort=low ...`

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
   codex exec -s read-only -m gpt-6-sol -c model_reasoning_effort=medium -o out.md - < prompt.md
   ```
   `--full-auto` was REMOVED (Codex changelog, 2026-08-08) and now fails to parse; use an explicit
   `--sandbox workspace-write`.
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
work, `gpt-6-luna` at `xhigh` is the default. In July, 5.6 Luna matched or beat a Sonnet-class
model in a scored head-to-head at a fraction of the cost. On 2026-09-24, 6 Luna scored 9.5 to
5.6 Luna's 9.0 on the same prompt: every cited page resolved, claims were better hedged, and it used
about 30% fewer tokens at half the per-token price, but it was thinner on copy-ready detail. When a
report must be copy-ready, ask for worked examples, code and a checklist in the prompt.
`gpt-5.6-luna` is the fallback. (One run each and one judge: read it as "no regression".)

The reliable shape — every element is load-bearing:

```bash
mkdir -p "$OUT/work" && cd "$OUT/work"
codex --search exec -m gpt-6-luna -c model_reasoning_effort=xhigh \
  --ephemeral --skip-git-repo-check --cd "$OUT/work" \
  -o "$OUT/report.md" - < "$OUT/prompt.md" > "$OUT/run.log" 2>&1 &
```

- **Run from an EMPTY directory (`cd` there and pass `--cd`), never from a repo.** Launched from a
  repo, the model treats the repo as the subject: a measured research leg started from a repo root
  spent its first minute reading the repo's own files with zero web searches, and under a permissive
  sandbox it can read anything there. Also say "web research; there is no local repository" in the prompt.

- `--search` is a GLOBAL codex flag and must come BEFORE `exec` (after it is a hard "unexpected
  argument" error). It enables the native live `web_search` tool; without it Luna answers from
  training data while looking identical.
- Prove the search is live, do not assume: `grep -c "web search:" run.log` within ~60s. A healthy
  research run shows queries accumulating (18-106 observed).
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
  Luna's price for equal-at-best quality. Role summary: **GPT-6 Sol at `medium`** = verification
  scans (Astra for the hardest sign-offs); **6 Luna at `xhigh` with `--search`** = web research;
  **GPT-6 Sol at `low`** = light code sweeps.
