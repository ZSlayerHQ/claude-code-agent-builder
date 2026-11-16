# OpenAI Guidelines Reference

Working reference for the OpenAI models an agent builder uses as an outside-family reviewer, research leg and mechanical lane, grounded in OpenAI's official documentation and refreshed **2026-11-10**. It replaces `gpt-5.6-guidelines.md`, whose text is in this repository's git history.

> **Verify fast-moving specifics.** Prices, model names, CLI flags and plan rules change often. Confirm against the live models, pricing and Codex pages before quoting externally or hardcoding.

> **What lives elsewhere.** Which model runs which job, and at what effort, is decided in the `codex-dispatch` skill (`templates/.claude/skills/codex-dispatch/`), together with its `codex exec` recipes. This file does not restate those lanes.

---

## 1. Model Overview

### Current Models (verified 2026-11-10)

| | GPT-6 Astra | **GPT-6.1 Sol** | GPT-6.1 Terra | GPT-6 Luna |
|---|---|---|---|---|
| **Model ID** | `gpt-6-astra` | `gpt-6.1-sol` | `gpt-6.1-terra` | `gpt-6-luna` |
| **OpenAI's positioning** | Most capable: complex reasoning, coding, computer use, research | Near-Astra performance for complex coding, computer use and professional work, at lower cost | Fast and efficient: visual reasoning, precise computer use, clear natural writing | Most efficient: focused, high-volume tasks |
| **Input / output per MTok** | $10 / $50 | $2 / $10 | $1 / $5 | $0.10 / $0.50 |
| **Cached input** | $1.00 (10%) | $0.10 (5%) | $0.05 (5%) | $0.01 (10%) |
| **Cache write, 30 min / 12 h** | $12.50 / $25 | $2.50 / $5 | $1.25 / $2.50 | $0.125 / $0.25 |
| **Effort levels** | `low` to `max` | `low` to `max` | `none`, `low` to `max` | `none`, `low` to `max` |
| **Default effort** | Not stated; set it | `medium` | `medium` | `medium` |
| **Fast / Ultrafast** | 2x / 6x | 2x / 6x | 2x / none | 2x / none |
| **Knowledge cutoff** | Apr 30, 2026 | Apr 30, 2026 | Jun 1, 2026 | May 18, 2026 |

All four: 1,050,000-token context window (922,000 max input, 128,000 max output), text and image in, text out, structured outputs, function calling, prompt caching, the Responses, Chat Completions and Batch endpoints, and in the Responses API the built-in tools (web search, file search, code interpreter, hosted shell, `apply_patch`, skills, computer use, MCP, tool search). None can be fine-tuned.

- **There is no GPT-6.1 Luna and no GPT-6.1 Astra.** The 6.1 generation is Sol and Terra only. The Luna tier's current model is `gpt-6-luna`, and a GPT-6.1 Astra appears only in third-party reports.
- **OpenAI's starting advice:** Astra if unsure, 6.1 Sol to balance intelligence and cost, Luna for cost-sensitive volume. In several of OpenAI's evaluations Astra reached stronger results with fewer output tokens, so its cost per task was lower than its token price suggests (vendor claim; our own comparison is in §2).
- **Trusted-access models, not dispatch options:** `gpt-6-cyber` ($20 / $100, needs Daybreak Red approval, released 2026-11-05), `gpt-6-rosalind` ($15 / $75, life sciences, approved organizations only), `gpt-6-astra-law` ($10 / $50).
- **Still served:** `gpt-6-sol` ($2 / $10, cached $0.20, accepts `none`; the fallback when 6.1 Sol is unavailable), `gpt-5.6-sol` ($4 / $20, a promotional price that runs until 2026-11-30), `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.4`.
- **Shutdowns to watch:** `gpt-5`, `gpt-5-mini`, `gpt-5-nano`, `gpt-5-pro` and `o3` on 2026-12-11 (read 2026-11-02); `tts-1`, `tts-1-hd` and `gpt-4o-mini-tts` on 2027-01-06; the GPT-4o, 4o mini, 4.1 and 4.1 mini snapshots on 2027-01-14 (replacement `gpt-6-luna`); `gpt-5.5-cyber-preview` on 2027-02-01; `gpt-image-2` on 2027-02-10 (replacement GPT-Image-2.6 Sunburst or Flare, released 2026-11-04); `gpt-5.3-codex`, `gpt-5.1` and `gpt-5.4-nano` on 2027-04-01.

### Pricing Levers

- **Long context:** a request with more than 272K input tokens bills the whole request at 2x input and cache rates and 1.5x output. Usage drawn from a ChatGPT subscription in Codex has no such surcharge.
- **Service tiers:** Batch and Flex are 50% off. Fast mode (`service_tier: "fast"`) is 2x. Ultrafast is 6x and exists for Astra and 6.1 Sol only. Regional processing adds 10%. A project's allowed tiers can be restricted in Platform settings.
- **Cache:** reads cost 5% of input on 6.1 Sol and 6.1 Terra, and 10% on Astra, Luna and 6 Sol. Writes cost 1.25x for 30 minutes and 2.5x for 12 hours (`prompt_cache_options.ttl`).
- **Reasoning tokens bill at the output rate.** Web search costs $10 per 1,000 calls plus the content tokens at model rates.
- **Residency limits:** Fast mode has no EU residency on Astra or 6 Sol, and no latency SLA on Astra. Astra Ultrafast is US-only; 6.1 Sol Ultrafast runs in the US or EU.
- **Subscriber credits:** eligible ChatGPT Pro and Business subscribers can claim up to $500 a month in API credits (since 2026-10-28).

### Effort and Reasoning Mode

- **`reasoning.effort`** takes `none`, `low`, `medium`, `high`, `xhigh` and `max`, depending on the model. Astra and 6.1 Sol reject `none` with HTTP 400, and 6.1 Sol also rejects `minimal`: use `low`. When migrating, keep the effective effort where it is supported.
- **Effort is a tuning knob, not a way to recover quality.** If output is wrong, fix the prompt and the output contract first. OpenAI's guidance is to use `xhigh` only when evals show a clear benefit, and `max` only if it beats `xhigh` on your tasks. Levels do not map exactly between generations, so retry a familiar task one level lower after a model change.
- **`reasoning.mode`** is a second, independent axis: `standard` (default) or `pro` for difficult tasks that can tolerate more latency and tokens.
- **Ultra is not an effort level.** In Codex it is a mode that fans the work out to subagents, and Luna has none. **Max** gives one agent more time on one task. Most tasks need neither.
- **Change effort mid-conversation** with a `configuration_update` input item, which keeps the cached prefix. Leave the request-level `reasoning.effort` unchanged.

### API Rules

- **Tool calling needs the Responses API** on Astra, 6.1 Sol and 6.1 Terra. `gpt-6-sol` and `gpt-6-luna` accept function calling in Chat Completions only at `reasoning_effort: "none"`.
- **Remove `temperature`, `top_p`, `top_logprobs` and `logprobs`** whenever effort is not `none`.
- **Reasoning persists across turns.** GPT-5.6 and later render reasoning from earlier turns by default (`reasoning.context` selects the behaviour). If you manage history yourself, keep every output item, including encrypted reasoning and the assistant `phase`. In long loops, tag messages with `phase` (`commentary` or `final_answer`) so a preamble is not taken for the final answer.
- **New with GPT-6:** async tool calling (`async: true` on a function tool; the result comes back later under the original `call_id`), mid-turn steering over a WebSocket connection, and asynchronous misalignment monitoring on Astra.
- **Agents API** (public beta, `v1/agents`): sessions, scheduled automations, and automatic review of tool and permission requests (`review: "auto_review"`). Compaction runs in the background by default.

---

## 2. Routing: What Goes to This Family

> **The outside view is the point.** Consensus among Claude instances multiplies confidence, not truth, because a model family shares blind spots. A different family is the independent check. That, not cost, is the reason to dispatch it.

- **Dispatch for:** an adversarial review of a plan or migration runbook before code exists; a verification scan after a multi-file change; a cross-cutting sweep that enumerates a class (contract mismatches, deprecated-name residue, consumer lists); a hardening pass on a design or brainstorm; a second opinion on scoped backend or systems work; sourced web research.
- **Not for:** fixes of one to three lines, docs-only changes, frontend or creative generation, anything a grep answers.
- **Check the premise first.** Before reviewing a fix or a claim, fetch the disputed artifact's current state. A review validates a design against its premise and cannot catch a false one.
- **A report is a claim about code unless the run executed something.** Require quoted command output for every runtime claim.
- **Verdicts are three-valued:** per-layer `GREEN` / `AMBER` / `RED`, plus one `Overall` of `GREEN` (pass), `RED` (block) or `READY-WITH-CHANGES` (fold the changes, then proceed). A gate that tests only for `GREEN` silently turns triage into a block.

### Capability Shape

- **The maintainers' own measurements.** On 2026-09-23, same prompt and both at `medium`: Astra found the most real issues but ranked a false positive first, while GPT-6 Sol found every core finding (one partially) with zero false positives at 19% of Astra's cost. On 2026-09-24 a web-research rerun scored `gpt-6-luna` 9.5 against GPT-5.6 Luna's 9.0, with no dead citations. GPT-6.1 Sol and GPT-6.1 Terra have not been measured head to head on our prompts.
- **Public evidence, from the GPT-5.5 and 5.6 era and not re-measured on GPT-6:** on single well-scoped patches GPT and Claude were about tied; on multi-file architectural work Claude led; GPT edged on tool precision, file navigation and token economy. Frontend and UI favoured Claude by consistent developer consensus. Creative work is unsettled.
- **A maintainer's read (2026-07, anecdotal):** Sol is stronger than Fable at backend work, weaker at UI and creative work, and best as a hardening layer on Claude-authored plans.
- **Luna is weak on long context.** Never use it for big-repo audits.

### Why Cross-Family Verification Works

- **Family bias is measured.** Judges favour outputs from their own family (arXiv:2410.02736, arXiv:2508.06709).
- **Ensembling same-family judges reduces variance, not shared bias.** Three Claude calls cut noise and leave a family-wide blind spot untouched (arXiv:2604.07650). A second Claude confirming a first is consistency, not correctness.
- **Tell the verifier to refute, not review.** A ratify-by-default framing invites agreement even across families. Ask it to refute the strongest version of the plan, and to separate empirical claims from value judgments (arXiv:2602.23971, arXiv:2606.16011).
- **Prefer independent rubric grading to free-form debate,** where persuasion and tone can sway correctness (arXiv:2509.05396).

---

## 3. Prompting GPT-6 Models

OpenAI's guidance was written from GPT-6 Astra's behaviour and offered for the whole family; evaluate each lever on the model you run. Its full prompt text is on the GPT-6 guide (see Sources).

### Behaviours and Levers (official)

- **It asks where earlier models assumed.** Astra stays coherent on long tasks, but it stops to ask when more input could change the result. To get autonomous runs, tell it to infer intent and scope from context, to treat "can you…" and "help me…" as instructions to do the work, and to persist until the goal is complete unless a step is clearly destructive or irreversible. Have it ask for approval only after it has prepared a concrete, reviewable result, so approval is the final step. Add: "Do not introduce unsolicited warnings, disclaimers, approval flows, or safety/compliance checklists due to hypothetical risk."
- **It follows instructions more closely, including ones in skills and files such as `AGENTS.md`.** Unclear or conflicting guidance in a skill can make it pause and block work early. OpenAI strongly recommends auditing every skill and instruction file the model can read. State precedence: "The user's instructions take precedence over guidelines provided in a skill. If explicit user instructions conflict with a skill's instructions, prioritize the user's instructions." When a dispatch stalls, ask it to name the file and quote the instruction that caused the pause.
- **It writes long, formatted answers** with lists, tables and recurring stock phrases. Specify the style you need: clear paragraphs, lists only for parallel or sequential items, plain language, the main point first. This reverses the GPT-5.6 advice, where the model was terse by default.
- **It may delegate less than you want.** Say when and how much to use subagents. For inter-agent messages add: "Messages that you send to other agents and your final answer may be read by a human, so ensure they are legible."
- **It tests more than small tasks need.** Calibrate: "Do not write tests for reversible, low-impact changes that mirror the implementation… Once those pass, broaden or repeat testing only when new changes, failures, or unresolved concerns justify it."

### Dispatch Doctrine (ours, holds across generations)

- **Describe the destination, not the route:** the goal, the hard constraints and an explicit output contract. Reasoning models plan better than they follow scripts.
- **State each instruction once.** Repeating "do not modify" or "ask first" causes spurious approval pauses.
- **Name file paths explicitly.** The CLI cannot see your conversation or your open files.
- **Include a premise challenge** in every review or verify prompt: ask it to attack the plan's framing, not only its contents. A plan written by the author of a defect otherwise steers the reviewer into the author's blind spot.

---

## 4. Structured Outputs for Verdicts

To get a verdict a program can branch on, use Structured Outputs with a strict JSON Schema: `text.format` in the Responses API, or `response_format: {type: "json_schema", json_schema: {strict: true, schema: …}}` in Chat Completions. `codex exec --output-schema` rides on this.

- **Supported schema surface:** string, number, boolean, integer, object, array, enum and `anyOf`. Not supported: `allOf`, `not`, `if` / `then` / `else`, `dependentRequired`. Lint the schema before the run.
- **Check `refusal` before trusting `parsed`.** A safety refusal does not match your schema, and a step that trusts the blob will misread it as a verdict.
- **Programmatic Tool Calling** fits bounded, tool-heavy runs where code filters or joins many results into a small output. Prefer direct calls when one call suffices, when the model must stay in the loop between calls, or when citations must be preserved.

---

## 5. Codex CLI

The flag facts below were checked against `codex exec --help` on codex-cli 0.163.0 on 2026-11-10. Newer releases exist, so re-check `--help` on yours.

### Read Your Own Config First

A bare `codex exec` inherits `~/.codex/config.toml`: the `model`, `model_reasoning_effort`, `approval_policy` and `sandbox_mode` set there apply to every dispatch.

- **Know what a dispatched reviewer can touch.** With `approval_policy = "never"` and `sandbox_mode = "danger-full-access"` it has full filesystem and network access and no approval prompts. That lets it run its own probes, and it also lets it change anything. Pass `-s read-only` when a run must be confined, and `-c model_reasoning_effort=…` when the job calls for a different effort.
- **A context window above Codex's 500,000-token default for 6.1 Sol costs nothing extra on ChatGPT-plan sign-in.** On API-key auth every request over 272K input tokens bills the whole request at the long-context rate, so keep auto-compact near 200K for those runs.

### `codex exec` Contract

- **I/O:** progress goes to `stderr` and only the final message to `stdout`. `--json` turns `stdout` into a JSONL event stream (`thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.*`, `error`) with token usage per turn.
- **Prompt in:** a positional argument, or `codex exec -` to make stdin the whole prompt. A prompt plus piped stdin treats the pipe as context. With an inline prompt, close stdin (`< /dev/null`), or a pipe with no writer hangs the run.
- **Deliverable out:** `-o <file>` writes the final message to disk. For a gateable verdict use `--output-schema schema.json -o result.json`.
- **Flags `exec` accepts:** `-m`, `-s` / `--sandbox`, `-p` / `--profile`, `-c key=value`, `-i`, `-o`, `--json`, `--output-schema`, `--ephemeral`, `--skip-git-repo-check`, `--ignore-user-config`, `--ignore-rules`, `--approve-for-me`.
- **Flags that must come before `exec`:** `-a` / `--ask-for-approval` and `--search` are top-level only. After `exec` they are a hard parse error that kills the run before the model is reached. Use `codex -a never exec …` or `-c approval_policy=never`.
- **Removed:** `--full-auto`. Use `--sandbox workspace-write`, or `--approve-for-me` to route approval requests through automatic review.
- **Resume:** `codex exec resume --last "<follow-up>"` or `codex exec resume <SESSION_ID>`.
- **API keys in CI:** set `CODEX_API_KEY` for the Codex step only, never as a job-level variable where repository-controlled code (build scripts, tests, dependency hooks) can read it.

### Sandbox and Approvals

- **Sandbox (`-s`):** `read-only`, `workspace-write` (edits inside the workspace, network off unless `[sandbox_workspace_write] network_access = true`), or `danger-full-access`.
- **Approval** is a separate axis: `on-request`, `never`, or `{ granular = { … } }`. **`approval_policy = "untrusted"` is retired and can stop the client from starting.** Remove it from configs and scripts. For the old strict behaviour, set `trust_level = "untrusted"` under `[projects."<path>"]` in the user config.
- **Automatic approval review:** `approvals_reviewer = "auto_review"` sends eligible approval requests to a reviewer agent that checks for data exfiltration, credential probing, security weakening and destructive actions. It fails closed, and it uses extra model calls.
- **Hermetic runs:** `--ignore-user-config` skips `$CODEX_HOME/config.toml` and `--ignore-rules` skips execpolicy rule files. An MCP server marked `required = true` fails the run instead of degrading silently.

### Models and Speed in Codex

- **GPT-6.1 Sol is the bundled default** since CLI 0.161.0, with a 500,000-token default context window in Codex. GPT-6.1 Terra needs CLI 0.159.0 or later (`codex -m gpt-6.1-terra`).
- **GPT-5.5 left Codex for ChatGPT sign-in on 2026-10-14.** The replacements are 6.1 Sol on paid plans and `gpt-6-luna` on Free and Go. API-key sessions are unaffected.
- **Fast mode** (`/fast`, or `service_tier = "fast"` plus `[features].fast_mode = true`) uses included limits at 2.5x and credits at 2x. **Ultrafast** (Astra and 6.1 Sol, on Pro $500 and eligible Enterprise and Edu plans) uses included limits at 8x and credits at 6x. With an API key, Codex bills API token prices instead.
- **Project instructions** come from `AGENTS.md`, which Codex concatenates from the root down to the working directory. Because GPT-6 follows such files closely (§3), a stale `AGENTS.md` now costs more.
- **Subagents** cost more tokens. The dispatcher defines the division of labour, the join condition and the output contract.
- **Long runs under Claude Code:** the Bash tool caps at 10 minutes and can reap background jobs. Start a long dispatch detached, and have it write its result to a file as it goes.

---

## Sources

OpenAI API docs, under `https://developers.openai.com/api/docs/`: `models`, `models/gpt-6-astra`, `models/gpt-6.1-sol`, `models/gpt-6.1-terra`, `models/gpt-6-luna`, `pricing`, `deprecations`, `changelog`, `guides/latest-model` (the GPT-6 guide, with prompting and migration), `guides/reasoning`, `guides/structured-outputs`, `guides/prompt-caching`.

Codex docs, under `https://learn.chatgpt.com/docs/`: `models`, `non-interactive-mode`, `agent-approvals-security`, `agent-configuration/speed`, `agent-configuration/subagents`, `config-file/config-reference`. CLI releases: `github.com/openai/codex/releases`.

Appending `.md` to a page URL on either site returns clean markdown, and each site has an `llms.txt` index. The Codex changelog page has no markdown version, so read CLI changes from the GitHub releases.

Verification theory: arXiv 2410.02736, 2508.06709, 2604.07650, 2602.23971, 2606.16011, 2509.05396. On-machine: `~/.codex/config.toml`, `codex exec --help`.

---

*Changelog: 2026-11-10: **new consolidated file**, replacing `gpt-5.6-guidelines.md` and verified against the live OpenAI models, pricing, deprecations, API changelog, GPT-6 guide and reasoning pages, the Codex models, non-interactive, security and speed pages, the openai/codex releases and Codex CLI 0.163.0. **Current lineup:** GPT-6 Astra, GPT-6.1 Sol, GPT-6.1 Terra, GPT-6 Luna, with prices unchanged since 2026-11-02; there is no GPT-6.1 Luna. **New since 2026-11-02:** `gpt-6-cyber` (2026-11-05), GPT-Image-2.6 and the `gpt-image-2` shutdown date, the `gpt-5.5-cyber-preview` shutdown date, GPT-5.6 Sol's promotion now ending 2026-11-30, Codex CLI 0.167.0, and the retired `untrusted` approval policy. **Changed from the old file:** prompting guidance is now OpenAI's GPT-6 guide, which reverses the 5.6-era "don't ask for concision" rule; the config section now tells you to read your own file; model lanes are no longer restated here and live in the dispatch skill. Earlier history: this repository's git history.*
