# Anthropic Guidelines Reference

A deep reference for agentic Claude Code sessions. Grounded in Anthropic's official documentation, refreshed **2026-07-31** against the live platform docs (prior baselines: 2026-07-22 pricing check, 2026-07-01 10-agent sweep).

> **Verify fast-moving specifics.** Exact prices, the newest tier names, and per-model token minimums change often — confirm against the live models/pricing/docs pages before quoting externally or hardcoding. The stable principles (selection logic, prompting, agent patterns, safety ordering) are well corroborated.

---

## 1. Model Overview

### Current Models (2026-07-31)

| | Fable 5 | Opus 5 | Sonnet 5 | Haiku 4.5 |
|---|---|---|---|---|
| **Model ID** | `claude-fable-5` | `claude-opus-5` | `claude-sonnet-5` | `claude-haiku-4-5-20251001` |
| **Best for** | Highest available capability; next-gen long-running agents | Complex agentic coding + enterprise work | Best speed/intelligence balance | Fastest, near-frontier |
| **Context window** | 1M tokens | 1M tokens (default *and* max — no smaller variant) | 1M tokens | 200K tokens |
| **Max output** | 128K tokens | 128K tokens | 128K tokens | 64K tokens |
| **Input cost** | $10 / MTok | $5 / MTok | $2 / MTok intro through 2026-08-31, then $3 / MTok | $1 / MTok |
| **Output cost** | $50 / MTok | $25 / MTok | $10 / MTok intro through 2026-08-31, then $15 / MTok | $5 / MTok |
| **Adaptive thinking** | Yes (always on) | Yes — **ON by default** | Yes | No (extended thinking only) |
| **Reliable knowledge cutoff** | Jan 2026 | **May 2026** | Jan 2026 | Feb 2025 |
| **Latency** | Slower | Moderate | Fast | Fastest |

*Model IDs from the 4.6 generation onward are dateless but still **pinned snapshots**, not evergreen pointers.*

**Previous generation, still available (migrate when convenient):** Opus 4.8 / 4.7 / 4.6 (`claude-opus-4-8` etc., $5 / $25, 1M ctx, 128K out), Sonnet 4.6, Sonnet 4.5, Opus 4.5. **Opus 4.1 is deprecated and retires 2026-08-05.**

**Claude Mythos 5** (`claude-mythos-5`) shares Fable 5's specs and pricing but is **invitation-only** under Project Glasswing (defensive cybersecurity workflows), alongside `claude-mythos-preview`. No self-serve access.

### When to Use Each

- **Opus 5**: The default for agentic coding and long-horizon work — multi-file features, larger refactors, end-to-end feature work, deep research, code review. Anthropic's own "start here if unsure" pick. Delivers frontier-class intelligence at half Fable 5's price. Performs best given the **complete task specification up front and then left to run**.
- **Fable 5**: Only when a workload needs the highest capability available and Opus 5 is measurably the bottleneck. 2× the price.
- **Sonnet 5**: Everyday coding and agent workflows where turnaround and cost matter. Defaults to `high` effort; step down to `medium`/`low` for volume.
- **Haiku 4.5**: Codebase exploration (Claude Code's built-in Explore subagent uses it), classification, simple lookups, bulk operations, latency-critical hot paths.

### Opus 5 — what changed from Opus 4.8

Opus 5 is a step-change, not an increment, and several of its changes **invalidate prompt scaffolding written for 4.7/4.8**. Treat this subsection as the migration checklist.

**API / breaking:**
- **Thinking is ON by default.** On 4.8 a request ran without thinking unless you set `thinking: {"type": "adaptive"}`; on Opus 5 that is the default. The wire value still works and is equivalent. **Revisit `max_tokens`** — it is a hard cap on thinking *plus* response text.
- **`thinking: {"type": "disabled"}` at `xhigh` or `max` effort returns a 400 error.** Enforced per request. Either keep thinking disabled and drop to `high` or below, or keep the effort level and remove the `thinking` field.
- **Prompt-cache minimum drops to 512 tokens** (from 1,024 on 4.8) — short prompts that previously could not cache now can, with no code change.
- **Fast mode** is available on Opus 5, **Claude API only** (not Bedrock / Google Cloud / Microsoft Foundry), at $10 / $50 per MTok.
- **Mid-conversation tool changes (beta)** — add/remove tools between turns while preserving the prompt cache. Beta header `mid-conversation-tool-changes-2026-07-01`.
- **Default fallbacks mode (beta)** — `fallbacks: "default"` applies Anthropic's recommended fallback models by refusal category. Beta header `server-side-fallback-2026-07-01`.

**Behavioural — these are the ones that break existing agent prompts:**
- **It verifies its own work unprompted.** Explicit verification instructions ("include a final verification step", "use a subagent to verify", "double-check your answer", "re-verify before responding") cause **over**-verification. Anthropic says remove them: removing reduces wasted tokens *with no loss in quality*. This includes legacy harness scaffolding that bolts on a separate verification step.
- **It delegates to subagents more readily** — a reversal of the 4.7/4.8 under-spawn problem. Delegation still pays on genuinely independent, sizeable tracks, but now needs a **cap**, not a push. See §6.
- **It expands task scope**, adding steps that were not requested. Constrain narrow tasks explicitly.
- **Responses and written deliverables run longer**, and it narrates progress more during agentic work. Effort controls *thinking* volume, **not** visible response length — prompt for length explicitly.
- **It narrates its own corrections more.** Scope this to corrections that change the user's decisions.
- **Literal review instructions bite.** "Only report high-severity issues" / "be conservative" now make it genuinely report less. Ask for everything and filter in a separate pass.

**Capability gains:** deep reasoning over long chains; agentic coding (completes tasks rather than leaving stubs); test-time compute scaling (real returns up to `max`); efficiency at `low`/`medium`; code review with high precision *and* recall; vision (charts, documents, UI replication — strongest with tools to crop and verify); consistent behaviour across the full 1M window; multi-sheet spreadsheets and slide decks; multi-agent coordination with few overwrite collisions.

### Pricing Levers (stable economics)

- **Batch API = 50% off** all models for async workloads (most batches finish within an hour).
- **Prompt caching**: cache reads ~0.10x base input (about 90% cheaper); writes ~1.25x (5-min TTL) or ~2x (1-hr TTL). Stacks with Batch.
- **Cache placement**: put the breakpoint on the *last block identical across requests*; invalidation cascades **tools → system → messages**, so keep static content first. Minimum cacheable length is model-dependent (512 tokens on Opus 5; ~1,024–4,096 elsewhere) — check `cache_creation_input_tokens` to confirm a write landed.
- **Effort changes invalidate the cache.** `effort` shapes the rendered prompt, so changing it mid-conversation drops cached prefixes. Pick a level at session start and hold it.
- **Programmatic-usage billing split (reported — verify before planning around it):** Anthropic announced 2026-05-14 that programmatic usage (Agent SDK, headless `claude -p`, GitHub Actions, third-party agent apps) would move to a separate monthly credit on 06-15, then paused the change on 06-15. Status unresolved as of 2026-07-31; secondary sources only.

### Effort Levels

Full ladder: `low` / `medium` / `high` / `xhigh` / `max`. **The API default is `high` on every current model** — passing `"high"` is identical to omitting the parameter. Effort is a behavioural signal, not a token budget, and it affects **all** output tokens: text, tool calls, and thinking.

| Level | Use for |
|---|---|
| `max` | Absolute maximum capability, no token constraints. Genuinely frontier problems. |
| `xhigh` | Long-horizon agentic/coding work (30+ min, million-token budgets). |
| `high` | **Default.** Complex reasoning, difficult coding, agentic tasks. |
| `medium` | Balanced — solid performance at moderate token savings. |
| `low` | Speed/cost-optimised. Simple tasks, classification, **subagents**. |

**Per-model starting points:**
- **Opus 5** — *start at the default `high`*, then adjust on your own evals. Step up to `xhigh` for demanding coding/agentic work, `max` where unconstrained spend is justified. Use `low`/`medium` **liberally** as the primary cost/latency control wherever quality holds. **Do not carry 4.7/4.8 effort settings over — re-run an effort sweep.**
- **Opus 4.8 / 4.7** — start at `xhigh` for coding and agentic work, `high` for other intelligence-sensitive workloads.
- **Sonnet 5** — defaults to `high`; `xhigh` for the hardest coding/agentic tasks.
- **Fable 5 / Mythos 5** — start at `high`; `xhigh` for the most capability-sensitive work. Lower settings still often beat `xhigh` on prior models.

At `xhigh` or `max`, set a large `max_tokens` (64K is a reasonable starting point) so the model has room to think and act across subagents and tool calls.

> **Session vs. API code — do not confuse them.** Everything above is about calls *your code* makes to the Anthropic API, where `max_tokens`, `effort`, and `thinking` are yours to tune against a cost budget. **Inside a Claude Code session, thinking stays on and output tokens are not shaved.** The session exists to do the reasoning; disabling thinking or trimming `CLAUDE_CODE_MAX_OUTPUT_TOKENS` to save cost trades away the thing you are paying for. That env var is a per-response ceiling to stop runaway output, not a budget dial. Cost control for sessions is scope and context discipline, not throttling the model mid-task.

> **Agent-builder note.** Generated agents pin `effort: xhigh` by default. Against Opus 5's guidance that is a deliberate step *up* from the API default — defensible for builder/auditor archetypes doing long-horizon work, but worth an eval sweep rather than treating as free. Consider `low`/`medium` for narrow, mechanical agents.

### Legacy: key 4.7/4.8 changes from 4.6

*Retained because Opus 4.8 and 4.7 are still available and some projects still pin them. All of this still applies on those models; see the Opus 5 subsection above for what changed again.*

**Breaking changes (Opus 4.8 + back-ported to Sonnet 4.6):**
- **Prefill on last turn returns 400.** Prefilled assistant messages on the last turn now error out — was deprecated on Opus 4.6, hard-removed on 4.7+ + retroactively on Sonnet 4.6. Use structured outputs or system prompt instructions.
- **Sampling parameters removed**: `temperature`, `top_p`, `top_k` are removed on Opus 4.8. Adaptive thinking + effort levels replace them.
- **`budget_tokens` removed for extended thinking** — use adaptive thinking via `thinking: {type: "adaptive"}` parameter.
- **Thinking content omitted by default** — must opt in to receive thinking blocks in responses.
- **Adaptive thinking is OFF by default** on Opus 4.8 — must set `thinking: {type: "adaptive"}` explicitly when you want it.

**New in 4.7+:**
- **`xhigh` effort level** — recommended default for Claude Code / agentic use cases. GA — no beta header needed.
- **Subagent over-delegation reversal**: 4.6 spawned subagents aggressively; **4.7+ spawns FEWER subagents by default**. Agent files should give POSITIVE delegation triggers ("Delegate to X when…") not warnings against over-delegation.
- **Higher-resolution image input (2576px)** with 1:1 pixel coordinates — useful for scanned legal docs, OCR pipelines.
- **More literal at low/medium effort** — must state scope explicitly. Example: "apply to every clause" not "apply to the clause."
- **New tokenizer** — same input uses 1.0–1.35x more tokens than 4.6.

**Carried forward from 4.6:**
- **1M context at flat pricing** — no long-context premium.
- **128K output on Opus and Sonnet 5**, **64K on Haiku 4.5** — use streaming for large `max_tokens`.
- **Compaction API** — promoted to GA. Server-side context summarisation for effectively infinite conversations.
- **Fast mode** — faster output generation on Opus at premium pricing, $10 / $50 per MTok on both Opus 5 and Opus 4.8 (Opus 4.7 fast mode was removed 2026-07-24). Research preview; Claude API only on Opus 5 — not on Bedrock / Google Cloud / Microsoft Foundry, and not available with Batch.
- **300K output via the Message Batches API** — beta header `output-300k-2026-03-24`, supported on Opus 5 / 4.8 / 4.7 / 4.6 and Sonnet 5 / 4.6.

---

## 2. Agent Design Patterns

Anthropic distinguishes **workflows** (predefined code paths orchestrating LLM calls) from **agents** (LLMs dynamically directing their own processes). The key insight: start simple, add complexity only when it demonstrably improves outcomes.

### Five Composable Patterns

| Pattern | When to Use | How It Works |
|---|---|---|
| **Prompt chaining** | Fixed subtasks with quality gates | Sequential steps, each with programmatic checks between them |
| **Routing** | Distinct input categories needing different handling | Classify input, then dispatch to specialized handlers |
| **Parallelization** | Independent subtasks or need for diverse outputs | Sectioning (split work) or Voting (same task, multiple attempts) |
| **Orchestrator-workers** | Unpredictable subtask breakdown | Central LLM decomposes tasks, delegates to workers, synthesizes |
| **Evaluator-optimizer** | Clear evaluation criteria, iterative refinement | One LLM generates, another reviews, cycle until quality threshold |

### Design Principles

1. **Simplicity first**: Do not reach for multi-agent orchestration when a single prompt with tools will do. 57% of enterprise agent failures originate in orchestration design, not individual agent capability.
2. **Transparency**: Explicitly show planning steps so users understand decision-making.
3. **Tool design matters as much as prompts**: Invest in clear tool descriptions, edge case coverage, and poka-yoke (mistake-proof) design.
4. **Start with direct API calls**: If using frameworks, understand the underlying code. Incorrect assumptions about abstractions cause common errors.
5. **Measure and iterate**: Conduct extensive testing in sandboxed environments before production.

### Heuristic for Subagents

Anthropic suggests: if a task requires exploring 10+ files, or involves 3+ independent pieces of work, subagents are worth the overhead. For simple tasks, sequential operations, or single-file edits, work directly.

---

## 3. Prompting Best Practices

### Core Principles

**Be clear and direct.** Think of Claude as a brilliant but new employee who lacks context on your norms. The golden rule: show your prompt to a colleague with minimal context. If they would be confused, Claude will be too.

**Explain WHY, not just WHAT.** Providing motivation behind instructions helps Claude generalize correctly. Instead of "NEVER use ellipses", say "Your response will be read aloud by text-to-speech, so never use ellipses since the engine cannot pronounce them."

**Tell Claude what TO DO, not what NOT to do.** Instead of "Do not use markdown", say "Write in smoothly flowing prose paragraphs."

### Specific Techniques

- **Few-shot examples**: 3-5 diverse examples dramatically improve accuracy. Wrap in `<example>` tags to distinguish from instructions.
- **XML tags for structure**: Use `<instructions>`, `<context>`, `<input>` tags to help Claude parse complex prompts unambiguously. Nest tags when content has hierarchy.
- **Role assignment**: A single sentence in the system prompt focusing Claude's behavior makes a measurable difference.
- **Long context**: Put longform data at the top, query at the bottom. Queries at the end improve response quality by up to 30% with complex multi-document inputs.
- **Grounding in quotes**: For long documents, ask Claude to quote relevant parts before answering. This cuts through noise.
- **Self-checking**: ~~Append "Before you finish, verify your answer against [criteria]."~~ **Retired on Opus 5** — it self-verifies and self-corrects unprompted, so this instruction now causes over-verification. Still useful on Opus 4.8 and earlier, and on Haiku.

### What Changed in Opus 5

The single most important prompting change: **stop telling it to verify.** Opus 5 verifies its own work and catches its own mistakes without being asked. Explicit verification and re-check instructions compound with that behaviour and burn tokens for no quality gain. Delete them from prompts, agent files, and harness scaffolding.

The other four levers, each with the shape Anthropic recommends:

**Cap delegation** (it over-delegates now):
> Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work. If one subagent can complete the task, use one rather than several, and keep spawn counts low.

**Constrain scope** (it widens tasks):
> Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked.

**Prompt for length** (effort no longer shortens visible output):
> Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested.

For files written to disk, which also run longer, add: *"Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate."* In a long system prompt, repeat a short reminder ("Keep outputs reasonably concise") near the end.

**Shape the narration** (it announces more during agentic work):
> Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer "what happened" or "what did you find," with supporting detail after it for readers who want it.

**Limit correction narration:** *"Only correct an earlier statement when the error would change the user's code, conclusions, or decisions. State corrections plainly and briefly, then continue the task."*

Two more, specific to particular archetypes:

- **Review/audit agents** — do NOT write "only report high-severity issues" or "be conservative." Opus 5 follows that literally and reports less. Ask it to report everything and filter in a separate pass. Its review precision is high enough that the extra findings are mostly real.
- **Builder agents** — give the complete task specification up front and let it run. Opus 5 is strongest on multi-file features and larger refactors, and it finishes rather than leaving stubs; drip-feeding the spec wastes that.

Positive examples of the communication style you want beat instructions about what *not* to do.

### What Changed in 4.6 → 4.7+

**Carried over from 4.6 (still apply):**
- **Dial back anti-laziness prompting**: Instructions that were needed to push previous models ("CRITICAL: You MUST use this tool") cause overtriggering on Opus 4.6+. Use normal language: "Use this tool when..."
- **Replace blanket defaults with targeted guidance**: Instead of "Default to using [tool]", say "Use [tool] when it would enhance your understanding."
- **More concise by default**: Claude 4.6+ provides fact-based progress reports, not self-celebratory updates. If you want summaries after tool use, ask for them explicitly.
- **LaTeX default for math**: Add explicit plain-text instructions if you do not want LaTeX output.

**New in 4.7+:**
- **State scope explicitly at low/medium effort.** 4.7+ is more literal than 4.6. "Apply this rule to every clause in the contract" is safer than "Apply this rule to the clause." At `xhigh` effort the model fills gaps better, but explicit scope is still safest.
- **Positive delegation triggers, not over-delegation warnings.** 4.6 over-spawned subagents; 4.7+ under-spawns. Agent files should say "Delegate to [agent] when [condition]" (positive) rather than "Avoid over-delegating to [agent]" (negative).
- **No prefill workarounds.** Prefill on last turn returns 400. Use structured outputs or system prompt directives instead.
- **No sampling-parameter scaffolding.** Don't reach for `temperature`/`top_p`/`top_k` — they're removed on 4.7+.
- **Adaptive thinking is opt-in.** If you need extended reasoning, set `thinking: {type: "adaptive"}` explicitly. Otherwise 4.7+ won't think before responding.

---

## 4. Context Window Management

### Token Budgets

- **1M tokens** context for Fable 5, Opus 5, Opus 4.x and Sonnet 5 (about 750K words). On Opus 5, 1M is both the default and the maximum — there is no smaller context variant to opt out to.
- **128K max output** for Fable 5, Opus 5, Opus 4.x and Sonnet 5; **64K** for Haiku 4.5.
- **300K output** available on the Message Batches API with beta header `output-300k-2026-03-24`.
- **`max_tokens` is a hard cap on thinking plus response text.** Since thinking is on by default on Opus 5, budgets tuned on a 4.8 no-thinking workload will now truncate — start at 64K and tune.
- Context-aware models: current Claude models track their remaining token budget throughout a conversation.

### Compaction Strategy

Server-side compaction automatically summarizes earlier conversation parts when context approaches limits. Key recommendations:

1. **Do not stop tasks early due to token concerns**: Tell Claude that context will be compacted automatically, so it should persist and complete tasks fully.
2. **Save state before compaction**: Have Claude write progress to files (progress.txt, tests.json, git commits) so nothing is lost when context refreshes.
3. **Starting fresh vs compacting**: For long tasks, a brand-new context window can outperform compaction. Claude 4.x is extremely effective at rediscovering state from the filesystem.

### Multi-Window Workflows

- **First window**: Set up framework (write tests, create setup scripts, define todo list).
- **Subsequent windows**: Iterate on the todo list, checking off items.
- **State tracking**: Use JSON for structured state (test results, task status). Use freeform text for progress notes. Use git for checkpoints.
- **Quality of life**: Have Claude create `init.sh` scripts for servers, test suites, and linters to avoid repeated setup work.
- **Verification tools**: As autonomous task length grows, Claude needs automated verification (Playwright, computer use, test suites) since it cannot get continuous human feedback.

### Drift Signals

Watch for these signs that context is degrading:

- Claude starts repeating earlier approaches that already failed.
- Tool calls become less targeted (searching broadly instead of precisely).
- Claude stops referencing specific file contents it read earlier in the session.
- Responses contradict decisions made earlier in the conversation.

When these appear, consider compacting or starting a fresh context window with explicit state files.

---

## 5. Tool Use Patterns

### Parallel Execution

Opus 4.8 excels at parallel tool calls. It will:
- Run multiple searches during research.
- Read several files at once to build context faster.
- Execute bash commands in parallel (can bottleneck system performance).

To maximize parallelism, include this guidance: "If you intend to call multiple tools and there are no dependencies between them, make all independent calls in parallel."

To reduce parallelism (for stability or ordering): "Execute operations sequentially with brief pauses between each step."

### Sequential Dependencies

Never use placeholders or guess missing parameters. If a tool call depends on the result of a previous call, wait for the result before making the dependent call.

### Be Explicit About Action vs. Suggestion

Claude 4.x follows instructions precisely (even more literally in 4.7+; state scope explicitly). If you say "can you suggest some changes", it will suggest rather than implement. For action, be direct: "Change this function to improve its performance" or "Make these edits."

To make Claude proactive by default: "Implement changes rather than only suggesting them. If intent is unclear, infer the most useful action and proceed."

To make Claude conservative: "Do not jump into implementation unless clearly instructed. Default to providing information and recommendations."

### Error Handling

- Have Claude create setup scripts that gracefully handle failures.
- Use structured test files (tests.json) so Claude can track which tests pass and which fail.
- Remind Claude: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

### Advanced Tool Use (scaling to many tools)

- **Write tool descriptions FOR THE MODEL** — 3-4+ sentences: what it does, when to use it and when not, each parameter, caveats/error modes. Unambiguous names (`user_id`, not `user`). Few sharp tools beat many overlapping ones; **namespace** by service+resource (`asana_projects_search`).
- **Return high-signal results** — stable, human-readable identifiers over opaque UUIDs (reduces hallucinations). A `response_format` enum (`concise`/`detailed`) can cut tokens ~3x. Put actionable, correctable guidance *in* error messages so agents recover instead of looping.
- **Tool Search / `defer_loading`** — for large tool libraries (>10 tools or >10k tokens of definitions), defer tool defs out of the initial context and let the model discover them on demand. Large token savings, and it does **not** break prompt caching (deferred tools are absent from the cached prefix).
- **Programmatic / code-execution tool calling** — for 3+ dependent calls or large-dataset filtering, have Claude write orchestration code; intermediate results stay in the sandbox, only the final output enters context.
- **Code execution with MCP** — presenting MCP servers as a code-callable file tree (the model reads only the tool stubs it needs) can cut tool-definition token overhead dramatically (~98% on large workflows); requires a monitored, resource-limited sandbox.

---

## 6. Sub-Agent Orchestration

### Built-in Subagents

| Agent | Model | Tools | Purpose |
|---|---|---|---|
| **Explore** | Haiku | Read-only | Fast codebase search and analysis |
| **Plan** | Inherits parent | Read-only | Research for planning mode |
| **General-purpose** | Inherits parent | All | Complex multi-step tasks |

### Creating Custom Subagents

Subagents are Markdown files with YAML frontmatter stored in:
- `~/.claude/agents/` (personal, all projects)
- `.claude/agents/` (project, shared with team)
- CLI `--agents` flag (session-only, not saved to disk)

**Required frontmatter** (May 2026): `name`, `description`. The Markdown body IS the system prompt — there is no separate `prompt` field. Earlier docs referenced a `prompt:` field; that has been removed in favour of the body-as-prompt convention.

**Optional frontmatter fields**: `tools`, `disallowedTools`, `model`, `permissionMode`, `mcpServers`, `hooks`, `maxTurns`, `skills`, `memory`, `effort`, `isolation`, `color`.

**Recommended for builders in 4.7+**: `model: claude-opus-4-8`, `effort: xhigh`. For latency-critical hot paths: `model: claude-haiku-4-5-20251001`, `effort: medium`.

### Isolation and Context

Each subagent runs in its own context window. This is the primary benefit: exploration and implementation stay out of your main conversation. Subagents cannot spawn other subagents (prevents infinite nesting).

### Delegation calibration — the guidance flips per generation

This has now reversed twice. **Match the guidance to the model the project actually pins.**

| Generation | Failure mode | What to write in agent files / CLAUDE.md |
|---|---|---|
| Opus 4.6 | Over-spawns | "Use subagents when tasks can run in parallel, require isolated context, or involve independent workstreams. For simple tasks, single-file edits, or sequential operations, work directly." |
| Opus 4.7 / 4.8 | **Under**-spawns | Positive triggers: "Delegate to the Explore subagent when researching unfamiliar code across 3+ files." Never negative warnings — they deepen the under-delegation. |
| **Opus 5** | **Over**-spawns again | Cap it. Anthropic's recommended wording is in §3 ("Cap delegation"). Give explicit warrant conditions, or set a deterministic spawn cap in the harness. |

Opus 5 coordinates subagent teams well — writer-verifier patterns work, and agents rarely overwrite each other. The problem is not quality, it is cost: it reaches for delegation on tasks it could finish in a handful of tool calls. Two specific caps worth stating:

- **Never delegate verification.** "Do not use subagents to verify or double-check your own work" — this compounds with the over-verification behaviour and doubles the waste.
- **One is usually enough.** If a single subagent can cover the task, do not fan out to several.

**Agent-builder note.** Output Rule 14 and the research-wave dispatch pattern were built to counteract the 4.7/4.8 *under*-spawn. On Opus 5 they push in the direction the model already leans. The intake-time research wave is still sound — it is a deliberate, operator-approved fan-out over genuinely orthogonal territories, which is exactly the case delegation pays for. What needs re-reading on an Opus 5 default is the framing that treats more delegation as the safe error.

### Agent Teams vs. Subagents

- **Subagents** work within a single session. One at a time, sequential.
- **Agent teams** coordinate across separate sessions. Multiple agents working in parallel, communicating with each other.

### Verification After Parallel Work

When multiple subagents or team members work in parallel, verify the combined result — parallel changes to the same codebase can create conflicts. Do this with **deterministic checks**: run the test suite, the type-checker, the linter, integration checks. That is not the same thing as the LLM-side "verify your work" instruction Opus 5 no longer needs (§3); a merge conflict is a fact about the filesystem, not a reasoning slip the model can self-catch.

---

## 7. Safety and Alignment

### Grounding and Hallucination Prevention

- **Investigate before answering**: "Never speculate about code you have not opened. If the user references a specific file, read it before answering."
- **Source verification**: For research tasks, ask Claude to verify information across multiple sources and track confidence levels.
- **Structured research**: "Develop competing hypotheses. Regularly self-critique your approach. Update a research notes file."

### Reversibility Awareness

Without guidance, an agentic model may take hard-to-reverse actions (deleting files, force-pushing, posting to external services). Add guidance:

- **Encourage**: Local, reversible actions like editing files or running tests.
- **Require confirmation for**: Destructive operations (rm -rf, dropping tables), hard-to-reverse operations (force push, hard reset), operations visible to others (pushing code, commenting on PRs, sending messages).
- **Never bypass safety checks as shortcuts**: Do not use `--no-verify`, do not discard unfamiliar files.

### Uncertainty Disclosure

Claude should acknowledge when it is uncertain rather than confabulating. Encourage: "If the task is unreasonable or infeasible, or if any tests are incorrect, inform me rather than working around them."

### Refusing Harmful Requests

Claude's Constitutional AI training handles this at the model level. Anthropic's **Constitution** (published 2026-01-22, CC0) is reason-based rather than rule-based. Its **four-property priority ordering** — applied only to genuine conflicts, which are uncommon — is: **1. Broadly safe → 2. Broadly ethical (honest, good values, avoid harm) → 3. Compliant with Anthropic's guidelines → 4. Genuinely helpful.** Six honesty properties: truthful, calibrated (acknowledges uncertainty), transparent, forthright, non-deceptive, non-manipulative (the last two matter most). Clear prompting is enough to avoid inappropriate refusals; prefill workarounds are no longer needed. **Over-refusal is a real cost** — treat users as capable adults and degrade gracefully rather than stonewalling minor uncertainty.

### Prompt Injection in Agentic Sessions

The threat that matters for builders is **indirect injection** — a trusted user, but adversarial instructions hidden in third-party content the agent reads (web pages, emails, docs, **tool results**).

- **Put untrusted content only in `tool_result` blocks**, never in `system` or plain user text — Claude is trained to treat instructions inside tool results with skepticism.
- **State the policy in the system prompt**: tool/document/search content is untrusted data and must never override the system prompt or user request. **Label provenance** and **JSON-encode** untrusted strings for unambiguous delimiters.
- **Least privilege**: no unneeded secrets, sandbox tools, scope permissions narrowly. **Screen tool outputs** with a lightweight classifier (Haiku + structured outputs) before acting. **Red-team** with deliberate injections pre-deploy.
- **Human-in-the-loop for severe or irreversible actions** — the constitution makes causing severe/irreversible harm a hard constraint even if asked, and a persuasive case for crossing a bright line should *increase* suspicion.

---

## 8. Anti-Patterns

### Over-Specification

**Problem**: Prescribing step-by-step procedures when Claude's own reasoning would produce better results.

**Fix**: "Think thoroughly" produces better reasoning than hand-written step-by-step plans. Give general instructions and let Claude figure out the approach.

### "Be Comprehensive" / Padding

**Problem**: Encouraging thoroughness causes Claude 4.x to explore excessively, inflating thinking tokens and slowing responses.

**Fix**: "Choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning."

### Overengineering

**Problem**: Claude 4.x tends to create extra files, add unnecessary abstractions, or build flexibility that was not requested.

**Fix**: "Only make changes that are directly requested or clearly necessary. A bug fix doesn't need surrounding code cleaned up. Don't create helpers for one-time operations. Don't design for hypothetical future requirements."

### Hard-Coding to Pass Tests

**Problem**: Claude sometimes focuses too heavily on making specific tests pass at the expense of general solutions.

**Fix**: "Write a general-purpose solution. Do not hard-code values or create solutions that only work for specific test inputs. Tests verify correctness, not define the solution."

### Token Waste from Excessive File Creation

**Problem**: Claude may create temporary files as scratchpads during iteration.

**Fix**: "If you create any temporary files for iteration, clean them up at the end of the task."

### Scope Creep in Agentic Sessions

**Problem**: Claude 4.x may refactor surrounding code, add documentation, or improve error handling beyond what was asked.

**Fix**: "Don't add docstrings, comments, or type annotations to code you didn't change. Don't add error handling for scenarios that can't happen. The right amount of complexity is the minimum needed for the current task."

---

## 9. Claude Code Specifics

### Directory Structure

```
project-root/
  .claude/
    settings.json          # Project settings (committed, shared with team)
    settings.local.json    # Personal project settings (gitignored)
    agents/                # Project subagents (committed)
      researcher.md
      reviewer.md
    commands/              # Custom slash commands (committed)
      deploy.md
  .mcp.json                # Project MCP server config (committed)
  CLAUDE.md                # Project instructions (committed)
  CLAUDE.local.md          # Personal project instructions (gitignored)

~/.claude/
  settings.json            # User settings (all projects)
  agents/                  # Personal subagents (all projects)
  CLAUDE.md                # Global instructions (all projects)
  plans/                   # Plan files
  agent-memory/            # Persistent subagent memory
```

### Settings Precedence (highest to lowest)

1. **Managed** (server/MDM/file) -- cannot be overridden
2. **Command line arguments** -- session overrides
3. **Local** (.claude/settings.local.json) -- personal project
4. **Project** (.claude/settings.json) -- team shared
5. **User** (~/.claude/settings.json) -- personal global

Array settings (permissions, sandbox paths) merge across scopes; they concatenate and deduplicate rather than replace.

### Key Settings

| Setting | Purpose | Example |
|---|---|---|
| `permissions.allow` | Auto-approve specific tool uses | `["Bash(npm run test *)"]` |
| `permissions.deny` | Block access to sensitive files | `["Read(./.env)", "Read(./secrets/**)"]` |
| `effortLevel` | Persist effort across sessions | `"xhigh"` |
| `model` | Override default model | `"claude-opus-5"` |
| `hooks` | Shell scripts at lifecycle events | See hooks docs |
| `sandbox` | Isolate bash from filesystem/network | `{"enabled": true}` |
| `agent` | Run main thread as a named subagent | `"code-reviewer"` |

### Hooks

Hooks are shell scripts that run at specific lifecycle points. Configured in settings.json under the `hooks` key.

**Hook events** (expanded list as of May 2026):
- `SessionStart` -- When a Claude Code session begins. Useful for loading checkpoints, env validation, project init.
- `UserPromptSubmit` -- Before Claude processes a prompt. Can add context or validate.
- `PreToolUse` / `PostToolUse` -- Tool-specific hooks. Before/after specific tool executions.
- `PreCompact` / `PostCompact` -- Around server-side context compaction. Useful for saving state before compaction summarises older turns.
- `SubagentStart` / `SubagentStop` -- When subagents start and complete. Useful for tracking parallel work and aggregating subagent results.
- `TaskCreated` / `TaskCompleted` -- For sessions using TaskCreate / task-list workflows.
- `Stop` -- When the main agent finishes. Useful for notifications, final commits, cleanup.

**Best practice**: Use `$CLAUDE_PROJECT_DIR` prefix for hook paths to ensure reliable resolution across working directories.

### MCP Configuration

Project MCP servers go in `.mcp.json` at project root. Personal MCP servers go in `~/.claude.json`.

To auto-approve all project MCP servers: `"enableAllProjectMcpServers": true` in settings.json.

To approve specific servers: `"enabledMcpjsonServers": ["memory", "github"]`.

### Plugins

Plugins extend Claude Code with skills, agents, hooks, and MCP servers. Distributed through marketplaces. Configured via `enabledPlugins` in settings.json.

**Security note**: Plugin subagents do not support `hooks`, `mcpServers`, or `permissionMode` frontmatter fields. These are ignored when loading from a plugin.

### Skills / Agent Skills

Custom prompts invoked with `/skill-name` or loaded automatically when the description matches. Can include inline shell execution via `` !`...` `` blocks (disable with `disableSkillShellExecution: true` in managed settings). The broader **Agent Skills** standard (agentskills.io) packages instructions + scripts + resources in a `SKILL.md` — required frontmatter is `name` + `description`, where the description must state what the Skill does AND when to trigger it.

**Progressive disclosure — why Skills are cheap:** Level 1 = metadata (~100 tokens/Skill, always loaded), so many Skills cost near-nothing at rest; Level 2 = the SKILL.md body, loaded only when triggered; Level 3+ = bundled resources/scripts, loaded (or *executed*, not read) on demand — a bundled parser never bloats context.

**Authoring:** build Skills from observed eval gaps; write the description as the trigger; split when unwieldy; state whether bundled code is executed or read.

**Security:** install only from trusted sources — Skills carry code-execution access. Audit every bundled file for unexpected network/file access; treat Skills that fetch external URLs as high-risk, and installing one like deploying software to production.

### CLAUDE.md Files

The primary mechanism for project-specific instructions. Loaded at startup. Hierarchy:
- `~/.claude/CLAUDE.md` -- Global instructions
- `CLAUDE.md` or `.claude/CLAUDE.md` -- Project instructions (committed)
- `CLAUDE.local.md` -- Personal project instructions (gitignored)

All levels are loaded and merged. Use these for project conventions, tool preferences, coding standards, and workflow instructions.

---

## Sources

- [Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview) · [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [What's new in Claude Opus 5](https://platform.claude.com/docs/en/about-claude/models/whats-new-opus-5) · [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5) · [Migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide)
- [Effort](https://platform.claude.com/docs/en/build-with-claude/effort) · [Thinking](https://platform.claude.com/docs/en/build-with-claude/thinking)
- [Prompting Best Practices](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Create Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Compaction API](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Introducing Claude 4](https://www.anthropic.com/news/claude-4)
- [Writing tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) · [Advanced tool use](https://www.anthropic.com/engineering/advanced-tool-use) · [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) · [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) · agentskills.io
- [Claude's Constitution](https://www.anthropic.com/constitution) · [Usage Policy](https://www.anthropic.com/legal/aup) · [Mitigate jailbreaks & prompt injection](https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks)

---

*Changelog: 2026-07-31 — **Claude Opus 5 refresh**, verified directly against the live platform docs (models overview, what's-new-opus-5, prompting-claude-opus-5, effort). §1 rewritten around the current four-model lineup (Fable 5 / Opus 5 / Sonnet 5 / Haiku 4.5) with the previous generation demoted to a still-available note and Opus 4.1's 2026-08-05 retirement flagged; added the Opus 5 migration checklist (thinking on by default, `thinking: disabled` + `xhigh`/`max` = 400, 512-token cache minimum, mid-conversation tool changes, default fallbacks mode, Claude-API-only fast mode); rewrote the Effort section around the five-level ladder with per-model starting points and the "re-run your effort sweep" warning. §3 gained a "What Changed in Opus 5" block carrying Anthropic's own recommended prompt wording for the five behavioural levers, and retired the self-checking technique. §6's delegation guidance became a per-generation table — the 4.6 → 4.7 → Opus 5 flip-flop — with agent-builder-specific notes on Output Rule 14 and the research-wave pattern. Corrected stale output/pricing/batch-header specifics throughout. **Two findings bear on this kit's own templates: Opus 5's over-verification behaviour argues against the mandatory `## Verification` section in every generated agent, and its literal reading of "only report high-severity issues" argues against that phrasing in auditor/reviewer archetypes.***

*Changelog: 2026-07-22 — scheduled upstream check (verified against the official platform.claude.com pricing page): Fast mode repriced to $10/$50 on Opus 4.8 (4.7 fast mode removed 2026-07-24); Sonnet 5 intro pricing firmed ($2/$10 through 2026-08-31, then $3/$15); Fable 5 pricing confirmed $10/$50 + Mythos 5 listed officially at the same price (limited availability); added the reported (unresolved) programmatic-usage billing split.*

*Changelog: 2026-07-01 — refreshed via a 10-agent research sweep. Added: Fable 5 frontier tier + pricing levers (caching/batch economics), an Advanced Tool Use subsection (Tool Search / `defer_loading`, programmatic + code-execution tool calling, code-execution-with-MCP), Agent Skills progressive-disclosure + security, the verbatim constitution priority ordering + six honesty properties, and a Prompt-Injection-in-agentic-sessions section. Full currency sweep: modernised 4.6-era framing to Opus 4.8 / Sonnet 5 across the context, tool-use, safety, and anti-pattern sections (behavioural guidance preserved where still accurate).*
