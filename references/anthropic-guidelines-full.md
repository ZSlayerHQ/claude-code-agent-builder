# Anthropic Guidelines Reference

A deep reference for Claude Code sessions running Claude Opus 4.7 at xhigh effort. Grounded in Anthropic's official documentation as of May 2026 (updated from April 2026 baseline).

---

## 1. Model Overview

### Current Models (Claude 4.7 generation, May 2026)

| | Opus 4.7 | Sonnet 4.6 | Haiku 4.5 |
|---|---|---|---|
| **Model ID** | `claude-opus-4-7` | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |
| **Best for** | Hardest tasks, long-horizon agents, deep reasoning | Balance of speed and intelligence | High-volume, latency-sensitive |
| **Context window** | 1M tokens | 1M tokens | 200K tokens |
| **Max output** | 128K tokens | 64K tokens | 64K tokens |
| **Input cost** | $5 / MTok | $3 / MTok | $1 / MTok |
| **Output cost** | $25 / MTok | $15 / MTok | $5 / MTok |
| **Adaptive thinking** | Yes (OFF by default — must set `thinking: {type: "adaptive"}` explicitly) | Yes | No |
| **Knowledge cutoff** | Jan 2026 (reliable) | Aug 2025 (reliable), Jan 2026 (training) | Feb 2025 |
| **Tokenizer** | New tokenizer — uses 1.0–1.35x more tokens than 4.6 for the same input | Unchanged | Unchanged |

### When to Use Each

- **Opus 4.7**: Large-scale code migrations, deep research, extended autonomous work, multi-step reasoning that spans many tool calls, agentic Claude Code sessions. Default for builders. Use when accuracy matters more than speed.
- **Sonnet 4.6**: Most everyday coding, agent workflows where fast turnaround and cost matter. Set effort to `medium` for most applications, `low` for high-volume workloads.
- **Haiku 4.5**: Codebase exploration (Claude Code's built-in Explore subagent uses it), classification, simple lookups, cost-conscious bulk operations, latency-critical hot paths (sub-2s LLM calls).

### Effort Levels

`low` / `medium` / `high` / **`xhigh`** (new in May 2026 — Anthropic's recommended default for coding/agentic Claude Code use cases). Effort parameter is GA — drop the legacy `effort-2025-11-24` beta header.

### Key 4.7 Changes from 4.6

**Breaking changes (Opus 4.7 + back-ported to Sonnet 4.6):**
- **Prefill on last turn returns 400.** Prefilled assistant messages on the last turn now error out — was deprecated on Opus 4.6, hard-removed on 4.7 + retroactively on Sonnet 4.6. Use structured outputs or system prompt instructions.
- **Sampling parameters removed**: `temperature`, `top_p`, `top_k` are removed on Opus 4.7. Adaptive thinking + effort levels replace them.
- **`budget_tokens` removed for extended thinking** — use adaptive thinking via `thinking: {type: "adaptive"}` parameter.
- **Thinking content omitted by default** — must opt in to receive thinking blocks in responses.
- **Adaptive thinking is OFF by default** on Opus 4.7 — must set `thinking: {type: "adaptive"}` explicitly when you want it.

**New in 4.7:**
- **`xhigh` effort level** — recommended default for Claude Code / agentic use cases. GA — no beta header needed.
- **Subagent over-delegation reversal**: 4.6 spawned subagents aggressively; **4.7 spawns FEWER subagents by default**. Agent files should give POSITIVE delegation triggers ("Delegate to X when…") not warnings against over-delegation.
- **Higher-resolution image input (2576px)** with 1:1 pixel coordinates — useful for scanned legal docs, OCR pipelines.
- **More literal at low/medium effort** — must state scope explicitly. Example: "apply to every clause" not "apply to the clause."
- **New tokenizer** — same input uses 1.0–1.35x more tokens than 4.6.

**Carried forward from 4.6:**
- **1M context at flat pricing** — no long-context premium.
- **128K output on Opus**, **64K output on Sonnet/Haiku** — use streaming for large `max_tokens`.
- **Compaction API** — promoted to GA. Server-side context summarisation for effectively infinite conversations.
- **Fast mode** — up to 2.5x faster output generation on Opus at premium pricing ($30/$150 per MTok). Still beta as of May 2026.
- **300K output via Batch API** with beta header.

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
- **Self-checking**: Append "Before you finish, verify your answer against [criteria]." This catches errors reliably for coding and math.

### What Changed in 4.6 → 4.7

**Carried over from 4.6 (still apply):**
- **Dial back anti-laziness prompting**: Instructions that were needed to push previous models ("CRITICAL: You MUST use this tool") cause overtriggering on Opus 4.6+. Use normal language: "Use this tool when..."
- **Replace blanket defaults with targeted guidance**: Instead of "Default to using [tool]", say "Use [tool] when it would enhance your understanding."
- **More concise by default**: Claude 4.6+ provides fact-based progress reports, not self-celebratory updates. If you want summaries after tool use, ask for them explicitly.
- **LaTeX default for math**: Add explicit plain-text instructions if you do not want LaTeX output.

**New in 4.7:**
- **State scope explicitly at low/medium effort.** 4.7 is more literal than 4.6. "Apply this rule to every clause in the contract" is safer than "Apply this rule to the clause." At `xhigh` effort the model fills gaps better, but explicit scope is still safest.
- **Positive delegation triggers, not over-delegation warnings.** 4.6 over-spawned subagents; 4.7 under-spawns. Agent files should say "Delegate to [agent] when [condition]" (positive) rather than "Avoid over-delegating to [agent]" (negative).
- **No prefill workarounds.** Prefill on last turn returns 400. Use structured outputs or system prompt directives instead.
- **No sampling-parameter scaffolding.** Don't reach for `temperature`/`top_p`/`top_k` — they're removed on 4.7.
- **Adaptive thinking is opt-in.** If you need extended reasoning, set `thinking: {type: "adaptive"}` explicitly. Otherwise 4.7 won't think before responding.

---

## 4. Context Window Management

### Token Budgets

- **1M tokens** context for Opus 4.6 and Sonnet 4.6 (about 750K words).
- **128K max output** for Opus 4.6, **64K** for Sonnet 4.6.
- **300K output** available on the Message Batches API with beta header.
- Context-aware models: Claude 4.6 tracks its remaining token budget throughout a conversation.

### Compaction Strategy

Server-side compaction automatically summarizes earlier conversation parts when context approaches limits. Key recommendations:

1. **Do not stop tasks early due to token concerns**: Tell Claude that context will be compacted automatically, so it should persist and complete tasks fully.
2. **Save state before compaction**: Have Claude write progress to files (progress.txt, tests.json, git commits) so nothing is lost when context refreshes.
3. **Starting fresh vs compacting**: For long tasks, a brand-new context window can outperform compaction. Claude 4.6 is extremely effective at rediscovering state from the filesystem.

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

Opus 4.6 excels at parallel tool calls. It will:
- Run multiple searches during research.
- Read several files at once to build context faster.
- Execute bash commands in parallel (can bottleneck system performance).

To maximize parallelism, include this guidance: "If you intend to call multiple tools and there are no dependencies between them, make all independent calls in parallel."

To reduce parallelism (for stability or ordering): "Execute operations sequentially with brief pauses between each step."

### Sequential Dependencies

Never use placeholders or guess missing parameters. If a tool call depends on the result of a previous call, wait for the result before making the dependent call.

### Be Explicit About Action vs. Suggestion

Claude 4.6 follows instructions precisely. If you say "can you suggest some changes", it will suggest rather than implement. For action, be direct: "Change this function to improve its performance" or "Make these edits."

To make Claude proactive by default: "Implement changes rather than only suggesting them. If intent is unclear, infer the most useful action and proceed."

To make Claude conservative: "Do not jump into implementation unless clearly instructed. Default to providing information and recommendations."

### Error Handling

- Have Claude create setup scripts that gracefully handle failures.
- Use structured test files (tests.json) so Claude can track which tests pass and which fail.
- Remind Claude: "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality."

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

**Recommended for builders in 4.7**: `model: claude-opus-4-7`, `effort: xhigh`. For latency-critical hot paths: `model: claude-haiku-4-5-20251001`, `effort: medium`.

### Isolation and Context

Each subagent runs in its own context window. This is the primary benefit: exploration and implementation stay out of your main conversation. Subagents cannot spawn other subagents (prevents infinite nesting).

### Watch for Underuse (4.7) — REVERSAL from 4.6

**Opus 4.7 spawns FEWER subagents by default than 4.6 did.** The previous 4.6 advice ("watch for overuse") is reversed in 4.7 — now the risk is *underuse* of available subagents.

For 4.7, give **positive delegation triggers** in agent files and CLAUDE.md:
- "Delegate to the Explore subagent when researching unfamiliar code across 3+ files."
- "Delegate to the Code Reviewer agent after every feature implementation."
- "Use the Researcher agent for any third-party library evaluation."

Do NOT add 4.6-style negative warnings ("avoid over-delegating") — they push 4.7 even further into under-delegation.

**Historical note (still relevant if running on Opus 4.6 sessions):** if you see a 4.6 session over-spawning subagents, add: "Use subagents when tasks can run in parallel, require isolated context, or involve independent workstreams. For simple tasks, single-file edits, or sequential operations, work directly."

### Agent Teams vs. Subagents

- **Subagents** work within a single session. One at a time, sequential.
- **Agent teams** coordinate across separate sessions. Multiple agents working in parallel, communicating with each other.

### Verification After Parallel Work

When multiple subagents or team members work in parallel, always verify the combined result. Parallel changes to the same codebase can create conflicts. Run tests and integration checks after merging parallel work.

---

## 7. Safety and Alignment

### Grounding and Hallucination Prevention

- **Investigate before answering**: "Never speculate about code you have not opened. If the user references a specific file, read it before answering."
- **Source verification**: For research tasks, ask Claude to verify information across multiple sources and track confidence levels.
- **Structured research**: "Develop competing hypotheses. Regularly self-critique your approach. Update a research notes file."

### Reversibility Awareness

Without guidance, Opus 4.6 may take hard-to-reverse actions (deleting files, force-pushing, posting to external services). Add guidance:

- **Encourage**: Local, reversible actions like editing files or running tests.
- **Require confirmation for**: Destructive operations (rm -rf, dropping tables), hard-to-reverse operations (force push, hard reset), operations visible to others (pushing code, commenting on PRs, sending messages).
- **Never bypass safety checks as shortcuts**: Do not use `--no-verify`, do not discard unfamiliar files.

### Uncertainty Disclosure

Claude should acknowledge when it is uncertain rather than confabulating. Encourage: "If the task is unreasonable or infeasible, or if any tests are incorrect, inform me rather than working around them."

### Refusing Harmful Requests

Claude's Constitutional AI training handles this at the model level. Anthropic's updated constitution (January 2026) uses reason-based rather than rule-based alignment. Clear prompting in the user message is sufficient to avoid inappropriate refusals; aggressive prefill workarounds are no longer needed.

---

## 8. Anti-Patterns

### Over-Specification

**Problem**: Prescribing step-by-step procedures when Claude's own reasoning would produce better results.

**Fix**: "Think thoroughly" produces better reasoning than hand-written step-by-step plans. Give general instructions and let Claude figure out the approach.

### "Be Comprehensive" / Padding

**Problem**: Encouraging thoroughness causes Opus 4.6 to explore excessively, inflating thinking tokens and slowing responses.

**Fix**: "Choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning."

### Overengineering

**Problem**: Opus 4.6 tends to create extra files, add unnecessary abstractions, or build flexibility that was not requested.

**Fix**: "Only make changes that are directly requested or clearly necessary. A bug fix doesn't need surrounding code cleaned up. Don't create helpers for one-time operations. Don't design for hypothetical future requirements."

### Hard-Coding to Pass Tests

**Problem**: Claude sometimes focuses too heavily on making specific tests pass at the expense of general solutions.

**Fix**: "Write a general-purpose solution. Do not hard-code values or create solutions that only work for specific test inputs. Tests verify correctness, not define the solution."

### Token Waste from Excessive File Creation

**Problem**: Claude may create temporary files as scratchpads during iteration.

**Fix**: "If you create any temporary files for iteration, clean them up at the end of the task."

### Scope Creep in Agentic Sessions

**Problem**: Opus 4.6 may refactor surrounding code, add documentation, or improve error handling beyond what was asked.

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
| `effortLevel` | Persist effort across sessions | `"high"` |
| `model` | Override default model | `"claude-sonnet-4-6"` |
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

### Skills

Custom prompts invoked with `/skill-name` or loaded automatically by Claude. Can include inline shell execution via `` !`...` `` blocks. Disable with `disableSkillShellExecution: true` in managed settings.

### CLAUDE.md Files

The primary mechanism for project-specific instructions. Loaded at startup. Hierarchy:
- `~/.claude/CLAUDE.md` -- Global instructions
- `CLAUDE.md` or `.claude/CLAUDE.md` -- Project instructions (committed)
- `CLAUDE.local.md` -- Personal project instructions (gitignored)

All levels are loaded and merged. Use these for project conventions, tool preferences, coding standards, and workflow instructions.

---

## Sources

- [Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [What's New in Claude 4.6](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-6)
- [Prompting Best Practices](https://platform.claude.com/docs/en/docs/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Create Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Settings](https://code.claude.com/docs/en/settings)
- [How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
- [Compaction API](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Introducing Claude 4](https://www.anthropic.com/news/claude-4)
