# Claude Code Agent Directory — Community Research

**Date**: 2026-04-12
**Scope**: How the Claude Code community structures `.claude/agents/` directories, common patterns, anti-patterns, and meta-tools for agent generation.

---

## 1. Top Repos & Resources

### Curated Lists (Discovery Hubs)

| Repo | Stars | What It Is | Agent Content |
|------|-------|-----------|---------------|
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | 38,092 | Master curated list of skills, hooks, commands, agents, plugins | Links to agent repos; no agent files itself |
| [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) | 16,998 | 130+ specialized subagent definitions across 10 categories | Full agent .md files organized by domain category |
| [rohitg00/awesome-claude-code-toolkit](https://github.com/rohitg00/awesome-claude-code-toolkit) | 1,191 | 135 agents, 35 skills, 42 commands, 176+ plugins | Comprehensive reference; links to agent templates |
| [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) | 24,456 | CLI tool for installing pre-built agents, commands, settings | NPX-based installer; 100+ agents from multiple sources |

### Template Repos (Copy & Use)

| Repo | Stars | Agents | Structure Approach |
|------|-------|--------|-------------------|
| [josipjelic/orchestrated-project-template](https://github.com/josipjelic/orchestrated-project-template) | 87 | 5 (planner, builder, designer, infra, quality) | Role-based, document ownership model, cross-agent handoffs |
| [peterfei/ai-agent-team](https://github.com/peterfei/ai-agent-team) | 323 | 7 (backend, frontend, devops, PM, QA, tech-lead, CLI scripts) | Full team simulation with `permissions:` field |
| [sheshbabu/zen](https://github.com/sheshbabu/zen) | 1,072 | 3 (architect, code-reviewer, qa) | Compact set, rich `description` with XML examples |
| [Prorise-cool/Claude-Code-Multi-Agent](https://github.com/Prorise-cool/Claude-Code-Multi-Agent) | 265 | 14+ in subdirectories (specialist/, business-analysis/, etc.) | Subdirectory organization by domain |
| [pedrohcgs/claude-code-my-workflow](https://github.com/pedrohcgs/claude-code-my-workflow) | 898 | Multi-agent review system for academics | LaTeX/Beamer + R focused; adversarial QA agents |

### Real-World Production Repos

| Repo | Stars | Agents | Notable Pattern |
|------|-------|--------|----------------|
| [mongodb/mongo-php-driver](https://github.com/mongodb/mongo-php-driver) | 922 | 1 (review.md) | Deeply specialized; 80+ lines of domain-specific review criteria for C PHP extensions |
| [imbue-ai/offload](https://github.com/imbue-ai/offload) | 85 | 5 (coding, coordinator, judge, reflection, tidy) | Pipeline pattern: code -> judge -> reflect -> tidy |
| [PabloLION/bmad-plugin](https://github.com/PabloLION/bmad-plugin) | N/A | 7 (ci, content, docs, qa, release, research, scripts) | Uses `isolation: worktree`, `memory: project`, `background: true` |
| [bdougie/contributor.info](https://github.com/bdougie/contributor.info) | 32 | 1 (meta-agent) | Agent that creates other agents — self-bootstrapping |

### Agent Collections (Not Template Repos)

| Repo | Stars | Agents | Approach |
|------|-------|--------|---------|
| [undeadlist/claude-code-agents](https://github.com/undeadlist/claude-code-agents) | 115 | 24 audit/QA agents in `agents/` directory | Flat directory; status-block output format; orchestrator pattern |
| [al3rez/ooda-subagents](https://github.com/al3rez/ooda-subagents) | 169 | 4 (observe, orient, decide, act) | OODA loop methodology; each agent is one phase |

### Meta-Tools & Agent Builders

| Tool | Stars | What It Does |
|------|-------|-------------|
| [alirezarezvani/claude-code-skill-factory](https://github.com/alirezarezvani/claude-code-skill-factory) | 685 | Interactive `/build agent` wizard; generates complete agent files with YAML frontmatter |
| [FrancyJGLisboa/agent-skill-creator](https://github.com/FrancyJGLisboa/agent-skill-creator) | 695 | Autonomous 5-phase protocol for skill/agent creation; cross-platform (14 tools) |
| [bdougie/contributor.info meta-agent](https://github.com/bdougie/contributor.info) | 32 | Agent that scrapes docs, infers tools, and writes new agent .md files |
| [BMAD Agent Builder](https://mcpmarket.com/tools/skills/bmad-agent-builder) | N/A | MCP skill; automates creation of specialized agents within BMAD framework |
| Built-in `/agents` command | N/A | Claude Code's native agent creation UI with "Generate with Claude" option |
| [aitmpl.com](https://www.aitmpl.com/agents/) | N/A | Web marketplace with 600+ agents; CLI installer (`npx aitmpl`) |

---

## 2. Common Patterns

### File Format (Universal)

Every community example uses the same base format from the official docs:

```yaml
---
name: kebab-case-identifier       # REQUIRED
description: When to use this agent  # REQUIRED
tools: Read, Grep, Glob             # Optional (inherits all if omitted)
model: sonnet                        # Optional (inherits if omitted)
---

System prompt in Markdown body.
```

**This is universal.** Not a single repo deviates from YAML frontmatter + Markdown body.

### Frontmatter Fields Used in Practice

| Field | Usage Frequency | Notes |
|-------|----------------|-------|
| `name` | 100% | Always kebab-case |
| `description` | 100% | Ranges from 1 sentence to 10-line XML-example blocks |
| `tools` | ~80% | Most restrict tools; some inherit all |
| `model` | ~70% | `sonnet` most common; `inherit` for complex tasks; `haiku` for read-only |
| `color` | ~40% | Visual distinction in UI |
| `memory` | ~15% | `project` or `user` scope; mostly in advanced setups |
| `permissionMode` | ~10% | `plan` for read-only agents |
| `isolation` | ~5% | `worktree` for CI/background agents |
| `background` | ~5% | For non-blocking agents |
| `hooks` | ~5% | Only in sophisticated setups |
| `skills` | ~5% | Preloading skills into agents |
| `mcpServers` | ~5% | Scoping MCP tools to specific agents |
| `effort` | <5% | Rarely used |
| `maxTurns` | <5% | Rarely used |
| `disallowedTools` | <5% | Most prefer allowlist (`tools:`) over denylist |

### Directory Organization Patterns

**Pattern 1: Flat Directory (Most Common — ~70%)**
```
.claude/agents/
├── architect.md
├── code-reviewer.md
├── qa.md
└── security-auditor.md
```
Used by: sheshbabu/zen, PabloLION/bmad-plugin, josipjelic/orchestrated-project-template, most production repos.

**Pattern 2: Subdirectories by Domain (~15%)**
```
.claude/agents/
├── specialist/
│   ├── typescript-expert.md
│   ├── python.md
│   └── css.md
├── business-analysis/
│   └── spec-analyst.md
└── ux-research/
    └── ui-ux-designer.md
```
Used by: Prorise-cool/Claude-Code-Multi-Agent. Note: Official docs do not mention subdirectory support explicitly — this may not work with auto-discovery.

**Pattern 3: Separate Top-Level Directory (~10%)**
```
agents/
├── code-auditor.md
├── security-auditor.md
└── test-writer.md
```
Used by: undeadlist/claude-code-agents. These are NOT auto-discovered — they must be manually copied to `.claude/agents/`.

**Pattern 4: Role-Based Categorization in Flat Dir (~5%)**
```
.claude/agents/
├── frontend/   (subdirectory per concern)
│   └── react-specialist.md
├── backend/
│   └── api-developer.md
└── qa/
    └── test-runner.md
```
Used by: Our RED NUCLEUS project. Not widely seen in the community.

### Agent Naming Conventions

| Pattern | Examples | Frequency |
|---------|----------|-----------|
| Role-based kebab-case | `code-reviewer`, `architect`, `qa` | ~60% |
| Abbreviated role | `ci`, `pm`, `rte`, `db` | ~20% |
| Task-based | `fix-planner`, `test-writer`, `seed-generator` | ~15% |
| Methodology-based | `observe`, `orient`, `decide`, `act` | ~5% |

### Tool Scoping Strategies

**Strategy 1: Minimal Allowlist (Recommended — ~50%)**
```yaml
tools: Read, Grep, Glob          # Read-only agents
tools: Read, Grep, Glob, Bash    # Read + execute agents
tools: Read, Write, Edit, Bash   # Full implementation agents
```
Strongest security posture. Used by official docs examples, mongodb, imbue-ai.

**Strategy 2: Full Inherit (Default — ~30%)**
No `tools:` field at all. Agent gets everything including MCP tools.
Used by: many quick-start templates. Risky for security-sensitive agents.

**Strategy 3: Denylist (~5%)**
```yaml
disallowedTools: Write, Edit     # Everything except file writes
```
Used when you want "almost everything" minus specific tools.

**Strategy 4: Agent Spawning Control**
```yaml
tools: Agent(worker, researcher), Read, Bash  # Can only spawn specific subagents
```
Used for orchestrator/coordinator agents that delegate.

### System Prompt Structure Patterns

**Pattern A: Role + Checklist (Most Common — ~50%)**
```markdown
You are a [role description].

When invoked:
1. Step 1
2. Step 2
3. Step 3

Review checklist:
- Item 1
- Item 2
```
Used by: official docs examples, most community agents. Simple, effective.

**Pattern B: Role + Document Ownership (Sophisticated — ~15%)**
```markdown
## Role
The planner handles project delivery and system architecture.

## Documents You Own
- `TODO.md` — Full ownership.
- `.tasks/NNN-*.md` — Task files.

## Documents You Read (Read-Only)
- `PRD.md` — Source of truth.

## Cross-Agent Handoffs
- Test failure → report to @builder
```
Used by: josipjelic/orchestrated-project-template. Most sophisticated pattern found.

**Pattern C: Status Block Output (Audit Pattern — ~10%)**
```markdown
Every output MUST start with:
```yaml
---
agent: security-auditor
status: COMPLETE | PARTIAL | SKIPPED | ERROR
findings: [count]
---
```
Used by: undeadlist/claude-code-agents. Structured machine-readable output.

**Pattern D: Methodology-Based (OODA, etc. — ~5%)**
```markdown
You are the Observe agent, responsible for the first phase.
Your role is purely observational. Avoid making conclusions.
```
Used by: al3rez/ooda-subagents. Each agent is one phase of a framework.

**Pattern E: Rich Description with Examples (~10%)**
```yaml
description: >
  Use this agent when you need to plan... Examples:
  <example>Context: User wants to add real-time collaboration.
  user: 'I want to add...'
  assistant: 'I'll use the architect agent...'
  <commentary>Since the user is requesting...</commentary></example>
```
Used by: sheshbabu/zen. Most detailed delegation descriptions found.

### Model Selection Patterns

| Agent Type | Common Model Choice | Rationale |
|-----------|-------------------|-----------|
| Read-only explorer | `haiku` | Fast, cheap for codebase scanning |
| Code reviewer | `sonnet` | Good balance for analysis |
| Architect/planner | `opus` or `inherit` | Complex reasoning needed |
| Implementation | `inherit` or `sonnet` | Needs full capability |
| Background/CI | `sonnet` | Cost-effective for automated tasks |
| QA/testing | `sonnet` | Balance of capability and cost |

---

## 3. Divergent Patterns

### OODA Loop Agents (al3rez/ooda-subagents)
Instead of role-based agents (reviewer, developer, tester), uses methodology-based agents: Observe → Orient → Decide → Act. Each agent handles one cognitive phase rather than one domain. Tool scoping maps to the phase: Observe gets read tools, Act gets write tools.

**Interesting because**: Forces structured thinking. Prevents "act before understanding" failure mode. Could be composed with role-based agents.

### Document Ownership Model (josipjelic/orchestrated-project-template)
Each agent explicitly declares which files it owns (read-write), which it reads (read-only), and which agents to hand off to. Creates a permissions matrix across agents.

**Interesting because**: Prevents agent conflicts. Makes implicit coordination explicit. Could be enforced mechanically with hooks.

**Trade-off**: Requires careful upfront design. Agents can't flexibly respond outside their document boundaries.

### Pipeline/Judge Pattern (imbue-ai/offload)
Agents form an explicit pipeline: coding → judge → reflection → tidy. The `judge` agent renders a PASS/FAIL verdict. Orchestrator loops until PASS.

**Interesting because**: Built-in quality gates. The judge pattern ensures work is verified before being accepted.

### Orchestrator Agent (undeadlist fullstack-qa-orchestrator)
A meta-agent that coordinates other agents in a loop: browser-qa → fix-planner → code-fixer → verify → repeat. Uses `Task()` tool calls to spawn sub-agents.

**Interesting because**: Demonstrates that agents can chain other agents. But relies on the `Task` tool which requires careful tool scoping.

### Rich XML Examples in Description (sheshbabu/zen)
Uses `<example>` XML blocks with `<commentary>` in the YAML description field. Provides Claude with few-shot examples of when to invoke the agent.

**Interesting because**: Most effective delegation descriptions found. Claude Code uses the description to decide delegation — richer descriptions mean better auto-delegation.

### Agent That Creates Agents (bdougie/contributor.info)
The `meta-agent` scrapes the official Claude Code docs at runtime, infers needed tools, and writes new `.claude/agents/*.md` files. Self-bootstrapping.

**Interesting because**: Exactly the "agent-builder" pattern. Uses `WebFetch` and `mcp__firecrawl` to stay current with docs. Could be adapted for any project.

### Non-Standard `permissions:` Field (peterfei/ai-agent-team)
Uses `permissions:` instead of `tools:` in frontmatter:
```yaml
permissions:
  - read
  - write
  - edit
  - bash
```
**Problem**: This is NOT a supported frontmatter field in the official spec. It would be silently ignored. The official field is `tools:`.

### Memory-Enabled Agents (PabloLION/bmad-plugin)
Uses `memory: project` so agents accumulate knowledge across sessions. Combined with `isolation: worktree` for CI agents.

**Interesting because**: Agents that learn over time. The CI agent remembers past failures and patterns.

---

## 4. Meta-Tools — Agent Builders & Generators

### Built-in: `/agents` Command
- Claude Code's native UI for creating agents
- "Generate with Claude" option takes a description and produces complete frontmatter + system prompt
- Saves to `.claude/agents/` or `~/.claude/agents/`
- Guided tool selection, model selection, color picker, memory config

### claude-code-skill-factory (685 stars)
- Interactive builder via `/build agent` command
- Asks 4-7 targeted questions to understand requirements
- Generates complete agent .md files with enhanced YAML
- Also builds skills, hooks, prompts
- Includes `/install-skill` for direct installation
- `/sync-agents-md` translates between CLAUDE.md and AGENTS.md formats

### agent-skill-creator (695 stars)
- 3-phase autonomous protocol: Understanding → Building → Verification
- Generates SKILL.md files (open standard)
- Cross-platform: 14 tools supported (Claude Code, Copilot, Cursor, etc.)
- Includes security scanning and spec validation
- Registry system for team sharing: `python3 scripts/skill_registry.py publish`
- Universal install path: `~/.agents/skills/`

### bdougie/contributor.info meta-agent
- Agent that creates agents by:
  1. Scraping official docs at runtime
  2. Analyzing user's description
  3. Inferring minimal tool set
  4. Writing complete agent file to `.claude/agents/`
- Uses FireCrawl MCP for web scraping
- Template output structure: Purpose → Instructions → Report/Response

### BMAD Agent Builder
- MCP marketplace skill
- Focuses on BMAD framework (Business Model Agent Design)
- Creates specialized agents, domain workflows, and document templates
- Part of a larger framework ecosystem

### claude-code-templates CLI (24,456 stars)
- NPX-based: `npx claude-code-templates@latest --agent [name]`
- 100+ pre-built agents from multiple sources
- Also includes commands, MCPs, settings, hooks
- Analytics and monitoring features built in
- Does NOT generate custom agents — only installs pre-built ones

### aitmpl.com Marketplace
- Web-based marketplace with 600+ agents
- Stack Builder UI for composing agent sets
- CLI installer for downloading
- Free, open-source

---

## 5. Anti-Patterns Observed

### Anti-Pattern 1: Tool Sprawl (No Explicit Tools)
Omitting `tools:` means the agent inherits everything including MCP tools. A read-only reviewer should NOT have Write, Edit, or dangerous Bash access. ~30% of community agents make this mistake.

**Fix**: Always specify `tools:` explicitly, even if the list is long.

### Anti-Pattern 2: Non-Standard Frontmatter Fields
Using `permissions:` instead of `tools:` (peterfei/ai-agent-team) or inventing custom fields. These are silently ignored by Claude Code.

**Fix**: Stick to the 15 supported frontmatter fields from official docs.

### Anti-Pattern 3: Too Many Agents
Some repos define 20-30+ agents. Each agent definition consumes context when Claude Code loads them for delegation decisions. More agents = more context overhead = slower delegation.

**Fix**: 3-7 agents for most projects. Use skills or CLAUDE.md rules for things that don't need isolated context.

### Anti-Pattern 4: Vague Descriptions
```yaml
description: Code reviewer  # Too vague — when does Claude use this?
```
Claude relies on the description to decide when to delegate. Vague descriptions lead to poor auto-delegation.

**Fix**: Action-oriented descriptions with triggers: "Reviews code for quality and best practices. Use proactively after code changes."

### Anti-Pattern 5: Agent Files That Are Too Long
Some agents have 200+ line system prompts. Subagents start with only their system prompt — no CLAUDE.md, no conversation history. Long prompts eat into the subagent's working context.

**Fix**: Keep system prompts focused. Use the `skills:` field to inject reusable knowledge instead of embedding it.

### Anti-Pattern 6: Subdirectory Organization
Organizing agents in subdirectories (`.claude/agents/frontend/react.md`) may not be supported by auto-discovery. The official docs mention `.claude/agents/` as a flat directory.

**Fix**: Use flat directory with descriptive names: `frontend-react.md` instead of `frontend/react.md`.

### Anti-Pattern 7: No Model Specification for Read-Only Agents
Using the default `inherit` (which may be Opus) for simple read-only exploration agents wastes money.

**Fix**: Set `model: haiku` for read-only agents. Set `model: sonnet` for most working agents. Reserve `inherit` (Opus) for complex reasoning.

### Anti-Pattern 8: Agents Without Verification Steps
Many agents describe what to do but not how to verify the output is correct. No quality gate.

**Fix**: Include a verification section: what to check, what commands to run, what constitutes a PASS.

### Anti-Pattern 9: Orchestrator Agents Without Limits
Orchestrator agents that spawn sub-agents in loops without `maxTurns` can run indefinitely.

**Fix**: Set `maxTurns` for any agent that could loop.

### Anti-Pattern 10: Duplicate Responsibility
Multiple agents checking the same things (e.g., both code-reviewer and security-auditor checking for exposed secrets). Leads to conflicting findings and wasted context.

**Fix**: Explicit scope boundaries. The undeadlist/claude-code-agents approach is good: "security-auditor is the ONLY agent that checks [security]. Other agents do NOT check security."

---

## 6. Key Takeaways for the Agent Builder

### What the Community Validates
1. **YAML frontmatter + Markdown body is THE format.** No alternatives exist in practice. The agent-builder should generate this exact format.
2. **Flat `.claude/agents/` directory works.** Subdirectories are risky. Stick with flat + descriptive names.
3. **3-7 agents is the sweet spot** for most projects. More causes context bloat.
4. **Tool restriction is the primary value** of subagents. Most community agents restrict tools.
5. **Description quality drives delegation quality.** Rich descriptions with trigger conditions outperform one-liners.

### What the Best Agents Have (that most don't)

| Feature | Found In | % of Community |
|---------|----------|----------------|
| Explicit tool restrictions | mongodb, imbue-ai | ~50% |
| Rich descriptions with examples | sheshbabu/zen | ~10% |
| Document ownership declarations | josipjelic | ~5% |
| Verification/quality gate section | undeadlist, imbue-ai | ~15% |
| Output format specification | undeadlist (status block) | ~10% |
| Cross-agent handoff protocol | josipjelic | ~5% |
| Explicit scope boundaries | undeadlist | ~10% |
| Model optimization (haiku for read-only) | PabloLION/bmad | ~15% |
| Memory configuration | PabloLION/bmad | ~10% |

### Recommended Agent File Structure (Synthesis)

Based on the best patterns observed, the ideal agent file structure combines:

```markdown
---
name: agent-name
description: >
  Action-oriented description of when to use this agent.
  Include trigger conditions and example scenarios.
tools: [Minimal set needed]
model: [Appropriate for the task]
color: [For UI distinction]
memory: project  # If agent should learn over time
---

## Role
One paragraph defining expertise and scope boundaries.

## When to Invoke
Bullet list of specific trigger conditions.

## Tools & Access
What this agent can do and explicitly what it cannot.

## Key Patterns
Domain-specific instructions, checklists, or methodology.

## Output Format
How findings/results should be structured.

## Verification
How to validate the agent's work is correct.

## Handoff
When to pass work to other agents and what to include.

## Anti-Patterns
What this agent should NOT do.
```

### What the Agent-Builder Should Generate

1. **Frontmatter**: All 5 required/recommended fields (name, description, tools, model, color)
2. **Rich description**: Include trigger conditions, not just a role label
3. **Scoped tools**: Always explicit, never inherit-all
4. **Appropriate model**: Match to task complexity
5. **Structured body**: At minimum: Role + Instructions + Output Format
6. **Verification section**: What constitutes "done" and "correct"
7. **Scope boundaries**: What this agent does NOT do

### What Existing Meta-Agents Get Wrong

- **claude-code-skill-factory**: Good wizard, but no verification of generated output
- **agent-skill-creator**: Impressive cross-platform, but SKILL.md format is not Claude Code native
- **bdougie meta-agent**: Scrapes docs each time (slow, fragile), no template customization
- **Built-in /agents**: Good UI, but generates basic structure without verification/handoff/scope sections

The opportunity is an agent-builder that generates **high-quality agents with all the patterns the best community examples have** — not just valid frontmatter, but rich system prompts with verification, scope boundaries, and handoff protocols.

---

## Sources

### Official Documentation
- [Create custom subagents — Claude Code Docs](https://code.claude.com/docs/en/sub-agents)

### Blog Posts & Guides
- [Best practices for Claude Code subagents — PubNub](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
- [Claude Code Sub-Agents: Parallel vs Sequential — ClaudeFast](https://claudefa.st/blog/guide/agents/sub-agent-best-practices)
- [How to Build Custom Claude Code Agents — Claude Directory](https://www.claudedirectory.org/blog/claude-code-agents-guide)
- [Anatomy of the .claude Folder — codewithmukesh](https://codewithmukesh.com/blog/anatomy-of-the-claude-folder/)
- [Complete Guide to CLAUDE.md and AGENTS.md — Medium](https://medium.com/data-science-collective/the-complete-guide-to-ai-agent-memory-files-claude-md-agents-md-and-beyond-49ea0df5c5a9)

### Marketplaces
- [aitmpl.com — 600+ agents](https://www.aitmpl.com/agents/)
- [claudecodeagents.com — 60+ prompts](https://www.claudecodeagents.com/)
- [buildwithclaude.com — Plugin Marketplace](https://buildwithclaude.com/)
