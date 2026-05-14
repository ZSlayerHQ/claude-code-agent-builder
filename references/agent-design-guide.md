# Agent Design Guide

The builder's primary reference for designing Claude Code agent files. Synthesized from Anthropic guidelines, the MAST study (1,642 execution traces), community research (38K+ star repos), and multi-agent framework analysis across CrewAI, LangGraph, AutoGen, and OpenAI Swarm.

---

## 1. The Six Universal Agent Archetypes

Every agent maps to one of these archetypes. Each archetype has a canonical tool set, a structural role, and clear boundaries.

### 1.1 Orchestrator / Coordinator

**What it does:** Decomposes tasks, routes to specialists, aggregates results. In Claude Code, the main session IS the orchestrator — CLAUDE.md serves this role. You rarely need an explicit orchestrator agent file. **Tools:** All. **Key insight:** Degrades with >5-7 workers.

### 1.2 Researcher / Information Gatherer

**What it does:** Searches, retrieves, and synthesizes information. Evaluates libraries, frameworks, competitors. **Tools:** Read, Write, Edit, Grep, WebFetch, WebSearch, Context7

```yaml
---
name: Research
description: Research domains, libraries, patterns, or competitors and synthesize findings.
invocation: When investigating unfamiliar problem domains or evaluating technical options.
tools: [Read, Write, Edit, Grep, WebFetch, WebSearch, Context7]
---
```
Key differentiators: WebFetch + WebSearch for external access. Writes to `research/`. Output is comparison matrices with recommendations, not code. Must include honest trade-offs.

### 1.3 Coder / Builder

**What it does:** Writes, modifies, and executes code. The workhorse. Implements features, fixes bugs, runs builds.

**Tools:** Read, Write, Edit, Bash, Context7 (+ GitNexus for large codebases)

**Full worked example:**

```markdown
---
name: Backend API
description: Build and modify API endpoints, data models, and server-side business logic.
invocation: When creating API endpoints, modifying data models, or implementing server-side features.
tools: [Read, Write, Edit, Bash, Context7]
---

# Backend API Builder Agent

## Role

Backend implementation specialist. Builds API endpoints, data models, business logic,
and server-side integrations. Follows project conventions for routing, validation,
and error handling.

## When to Invoke

- Creating new API endpoints or modifying existing ones
- Implementing or changing data models and database schemas
- Building server-side business logic or service layers
- Integrating with external APIs or services

## Tools

| Tool | Usage |
|------|-------|
| Read/Write/Edit | Create and modify source files |
| Bash | Run dev server, execute tests, database migrations, linting |
| Context7 | Look up framework-specific patterns (Express, Fastify, Django, etc.) |

## Key Patterns

- **Validation at boundaries** — validate all inputs at API entry points.
- **Parameterised queries always** — never concatenate user input into queries.
- **Error responses follow a consistent shape** — `{ error, code, details? }`.
- **One concern per endpoint** — an endpoint doing 3 things should be 3 endpoints.

## Output Format

1. Implementation code with inline comments only where non-obvious
2. Migration file if schema changed
3. Test file covering happy path + key error cases

## Verification

- [ ] All existing tests still pass after changes
- [ ] New code has test coverage for happy path and key error cases
- [ ] Linter and type checker pass with zero new errors
- [ ] API endpoint responds correctly (test with curl or HTTP client)

## Handoff Triggers

| Condition | Route To |
|-----------|----------|
| API needs frontend integration | Frontend builder agent |
| Security concerns in implementation | Security auditor agent |
| Performance issues detected | Performance agent |
| Database schema design decisions | Architecture agent |

## Anti-Patterns

- Business logic inside route handlers — extract to service layer
- Returning raw database errors to clients — wrap in safe responses
- Skipping input validation because "the frontend validates it"
- Adding endpoints without corresponding test files
```

### 1.4 Reviewer / Critic

**What it does:** Evaluates outputs, catches errors, reviews diffs. **Never modifies files** — reports findings only. This is the critical archetype distinction from builders.

**Tools:** Read, Grep, Glob, Bash, GitNexus — **never Write or Edit**

**Full worked example:**

```markdown
---
name: Code Review
description: Review code changes for quality, correctness, and adherence to project conventions.
invocation: When reviewing diffs, PRs, or completed features before merging.
tools: [Read, Grep, Glob, Bash, GitNexus]
---

# Code Review Agent

## Role

Code quality reviewer. Reviews diffs and completed work for correctness, convention
adherence, and potential issues. Reports findings — never modifies code directly.

## When to Invoke

- After a feature or fix is implemented, before committing
- When reviewing pull request diffs
- Before merging branches
- After refactoring work to verify nothing broke

## Tools

| Tool | Usage |
|------|-------|
| Read/Grep/Glob | Search codebase for patterns, conventions, related code |
| Bash | Run tests, linter, type checker to verify correctness |
| GitNexus | Analyze impact of changes across the codebase |

## Key Patterns

- **Review the diff, not the file** — focus on what changed, not pre-existing issues.
- **Check for missing tests** — new logic needs corresponding test coverage.
- **Verify naming consistency** — new code follows project conventions.
- **Look for leftover debug code** — console.log, debugger, TODO from this change.

## Output Format

| Category | Issue | Severity | Location | Suggestion |
|----------|-------|----------|----------|------------|
| Correctness | Off-by-one in loop | High | `src/utils.ts:42` | Use `<` not `<=` |
| Convention | Inconsistent naming | Low | `src/api/handler.ts:15` | Rename to camelCase |

Severity: Critical, High, Medium, Low.

## Verification

1. All tests pass (run test suite)
2. Linter reports zero new warnings
3. Type checker passes
4. No secrets or credentials in diff

## Handoff Triggers

| Condition | Route To |
|-----------|----------|
| Critical issues found that need fixing | Builder agent that owns the code |
| Security vulnerability detected | Security auditor agent |
| Architecture concerns in the changes | Architecture agent |

## Anti-Patterns

- Modifying code directly — reviewers report, they don't fix
- Reviewing pre-existing issues unrelated to the current change
- Nitpicking style when a linter/formatter should handle it
- Blocking on subjective preferences without citing conventions
```

### 1.5 Planner / Architect

**What it does:** Designs high-level approaches, data models, module boundaries. Structural decisions with lasting consequences. **Tools:** Read, Write, Edit, Bash, GitNexus

```yaml
---
name: Architecture
description: Design system architecture, data models, module boundaries, and folder structure.
invocation: When making structural decisions that affect multiple parts of the codebase.
tools: [Read, Write, Edit, Bash, GitNexus]
---
```
Key differentiators: GitNexus for dependency analysis. Output is ADRs and design docs, not implementation. Must write an ADR before structural changes. Hands off to builders after design is approved.

### 1.6 Writer / Synthesizer

**What it does:** Produces documents, reports, summaries. Less common in pure dev; essential for content platforms and docs-heavy projects. **Tools:** Read, Write, Edit, Grep, WebFetch, Context7

```yaml
---
name: Documentation
description: Write and maintain project documentation, API docs, and user guides.
invocation: When creating or updating documentation, README files, or API reference docs.
tools: [Read, Write, Edit, Grep, WebFetch, Context7]
---
```
Key differentiators: WebFetch for external library docs. Must read actual source code before documenting. Output is Markdown with code examples. Hands off to builders when docs reveal code bugs.

---

## 2. The Agent Sweet Spot

### Evidence

| Metric | Value | Source |
|--------|-------|--------|
| Failure rate across multi-agent frameworks | 41% - 86.7% | MAST study (1,642 traces) |
| Failures from coordination/specification, not code | 79% | MAST study |
| Agent count where coordination gains plateau | 4 agents | Multiple framework analyses |
| Multi-agent pilots failing within 6 months | 40% | Industry data |
| Token cost multiplier (single to multi-agent) | 2-5x | Maxim research |
| Use cases where single agent matches multi-agent | 70% | Framework economics research |

### The Heuristic

**Default to 3-5 agents. Never exceed 7 without explicit justification.**

1. Can the entire domain's rules fit in CLAUDE.md's operational principles (~30 lines)? If yes, a single agent may suffice.
2. Are there tasks requiring fundamentally different tool access (read-only audit vs read-write implementation)? Each access boundary is a candidate agent.
3. Are there distinct domain boundaries needing different expertise? Each boundary is a candidate.
4. Are there natural quality gates? Each gate is a reviewer/auditor.
5. Apply the "Four Agent Ceiling" — each agent beyond 4 must justify itself against coordination overhead.

**Microsoft's insight:** "Don't assume role separation requires multiple agents. Distinct roles might suggest multiple agents, but they don't automatically justify a multi-agent architecture."

**The removal test:** If you can remove an agent without breaking anything, remove it.

---

## 3. The 10-Question Decomposition Questionnaire

The builder uses these questions internally during full-suite mode to decide agent count and composition.

| # | Question | What It Reveals | Score |
|---|----------|-----------------|-------|
| 1 | What are the distinct phases of your workflow? | Pipeline candidates | Each phase = +1 agent candidate |
| 2 | Do any phases need fundamentally different tools? | Capability-based split points | Each unique toolset = +1 agent |
| 3 | Do different phases need different security/data access? | Mandatory split boundaries | Each access boundary = +1 mandatory agent |
| 4 | Which phases can run in parallel vs sequential? | Architecture pattern selection | Parallel phases = sub-agent candidates |
| 5 | Where do errors matter most? What needs review? | Where to add reviewer/auditor agents | Each quality gate = +1 auditor/reviewer |
| 6 | How much context does each phase need? | Context window pressure | Phases needing 100+ lines of instructions = split |
| 7 | Will different people/teams maintain different parts? | Organizational split candidates | Each team = potential agent boundary |
| 8 | What's the volume and frequency of tasks? | Multi-agent overhead threshold | Low volume = fewer agents |
| 9 | What's the acceptable error rate? | Review agent density | Low tolerance = add review agents |
| 10 | Can you describe the happy path in 3-5 steps? | Complexity indicator | Yes = pipeline. No = orchestrator |

**Scoring:** Sum agent candidates, then apply the Four Agent Ceiling. If raw count exceeds 7, consolidate by merging the least distinct roles.

---

## 4. Few-Shot Delegation Patterns

The `description` field in YAML frontmatter is how the orchestrator decides which agent to delegate to. Vague descriptions cause poor routing. Rich descriptions produce accurate delegation.

### Good Example — Rich Description with Triggers

```yaml
description: >
  Review code changes for quality, correctness, and convention adherence.
  Use proactively after any feature implementation, bug fix, or refactoring.
  <example>
  <context>User has just finished implementing a new API endpoint</context>
  user: "Review the changes I just made to the user registration endpoint"
  assistant: "I'll delegate this to the code-review agent to check for
  correctness, convention adherence, and missing test coverage."
  <commentary>The user explicitly asks for review of completed work.
  This matches the code-review agent's trigger: post-implementation review.</commentary>
  </example>
```

### Bad Example — Vague Description

```yaml
description: Code reviewer
```

**Why it fails:** No trigger conditions. The orchestrator can't tell when to delegate here or what distinguishes this agent from others that can read code.

### Good Example — Explicit Scope Boundaries

```yaml
description: >
  Audit code for security vulnerabilities, secrets exposure, and OWASP Top 10 issues.
  Invoke after feature work and before deployment. Does NOT fix issues — reports findings
  with severity and remediation guidance. Security-specific only; general code quality
  belongs to the code-review agent.
```

**Why it works:** Clear trigger (after feature work, before deploy), clear scope boundary (security only, not general quality), clear behavior expectation (reports, doesn't fix).

---

## 5. Agent Interaction Patterns

### 5.1 Orchestrator / Worker (Default)

**Use for:** Most projects. Main session routes to specialist sub-agents. Simple, debuggable. Bottleneck with >5-7 workers. CLAUDE.md defines routing; `description` and `invocation` fields guide delegation; Handoff Triggers encode returns.

### 5.2 Pipeline (Sequential)

**Use for:** Repeatable processes with clear phases. Research -> Plan -> Build -> Review. Predictable, easy to test. Rigid — can't skip steps. Error at stage 1 cascades.

**Claude Code implementation:** Handoff Triggers encode the sequence:
```markdown
## Handoff Triggers (Research agent)
| Condition | Route To |
|-----------|----------|
| Research complete with recommendation | Architecture agent |

## Handoff Triggers (Architecture agent)
| Condition | Route To |
|-----------|----------|
| Design approved by user | Backend Builder agent |
```

### 5.3 Review Loop (Generator + Critic)

**Use for:** Quality-critical output. Self-correcting but doubles cost. Cap at 3-5 iterations.
```markdown
## Handoff Triggers (Builder agent)
| Condition | Route To |
|-----------|----------|
| Implementation complete | Code Review agent |

## Handoff Triggers (Code Review agent)
| Condition | Route To |
|-----------|----------|
| Critical or high issues found | Builder agent that owns the code |
| All issues low or none | Orchestrator (work complete) |
```

---

## 6. Section-by-Section Quality Guide

For each of the 9 standard agent file sections: what makes it excellent vs bad.

### 6.1 YAML Frontmatter

**Excellent:** All 4 fields. Description is action-oriented with triggers, <=120 chars. Tools explicitly scoped.
```yaml
---
name: Security Auditor
description: Audit code for vulnerabilities and secrets exposure. Invoke after feature work, before deploy.
invocation: When reviewing for security issues, running audits, or hardening configuration.
tools: [Read, Grep, Glob, Bash]
---
```
**Bad:** Missing fields, vague description, no tool scoping.
```yaml
---
name: security
description: Security stuff
---
```

### 6.2 Role Section

**Excellent:** 1-2 sentences. Domain, expertise, scope boundary, what it does NOT own.

> Application security specialist. Audits code for vulnerabilities and manages secrets hygiene. Does not implement fixes — reports findings with remediation guidance.

**Bad:** > This agent handles security.

### 6.3 When to Invoke

**Excellent:** 4-6 concrete trigger conditions with action verbs.
> - Running a security audit on new or existing code
> - Reviewing code for OWASP Top 10 vulnerability classes
> - Configuring security headers or CSP policies

**Bad:** > - When security is needed

### 6.4 Tools Table

**Excellent:** Each tool gets a specific usage description for this agent's domain.

| Tool | Usage |
|------|-------|
| Read/Grep | Search for security anti-patterns, leaked secrets, unsafe functions |
| Bash | Run security scanners (`npm audit`, `semgrep`, `trivy`) |

**Bad:** Tools listed without context, or every tool included.

### 6.5 Key Patterns

**Excellent:** Domain-specific, actionable. Bold-prefixed single-line bullets. No general lectures.
> - **Parameterised queries always** — never concatenate user input into SQL.
> - **Hash passwords with bcrypt/scrypt/argon2** — never MD5 or SHA1.

**Bad:** > - Follow security best practices

### 6.6 Output Format

**Excellent:** Exact structure with column names, section names, or deliverable list.
> Findings table: | Category | Issue | Severity | Location | Remediation |

**Bad:** "Provide a report."

### 6.7 Verification

**Excellent:** Concrete checklist with observable pass/fail and commands to run.
> 1. No critical or high issues remaining (re-audit after fixes)
> 2. Security headers present (verify with `curl -I`)
> 3. Dependency audit returns zero vulnerabilities

**Bad:** > Make sure everything works

### 6.8 Handoff Triggers

**Excellent:** Table with concrete conditions and specific target agents.

| Condition | Route To |
|-----------|----------|
| Authentication system needs redesign | Auth builder agent |
| Security-related test gaps found | Testing agent |

**Bad:** | When appropriate | Another agent |

### 6.9 Anti-Patterns

**Excellent:** 3-5 domain-specific pitfalls with brief explanation.
> - God components with 20+ props — split into compound components
> - Prop drilling more than 2 levels — use context or composition

**Bad:** > Don't write bad code

---

## 7. Common Failure Modes

From the MAST study and community research. Each with cause, prevention, and detection.

### 7.1 Too Many Agents

**Failure:** Coordination overhead exceeds specialization benefit. Benefits plateau at 4 agents. 79% of failures are coordination problems.
**Why:** Treating every concern as a separate agent. Soon 12 agents with overlapping responsibilities.
**Prevention:** Four Agent Ceiling. "Three Nos" test: Does it need different tools? Different expertise? A quality gate? Three "no" = keep it in the existing agent.
**Detection:** Count agents. If >7, apply the removal test to each.

### 7.2 Vague Descriptions

**Failure:** Orchestrator can't route accurately. Tasks go to wrong agent or don't get delegated.
**Why:** Writing `description: Code reviewer` without trigger conditions or scope boundaries.
**Prevention:** Every description answers: "When exactly should the orchestrator send work here?"
**Detection:** If you can't immediately tell when to use an agent from its description, it's too vague.

### 7.3 Duplicate Responsibility

**Failure:** Multiple agents checking the same things, producing conflicting findings.
**Why:** No explicit scope boundaries. Both code-reviewer and security-auditor check for secrets.
**Prevention:** Explicit negative constraints: "Security auditor is the ONLY agent that checks security."
**Detection:** For each concern, only one agent should own it.

### 7.4 No Handoff Triggers

**Failure:** Agents don't know when to pass work. Work gets stuck or can't be chained.
**Why:** Building agents as isolated workers, not parts of a system.
**Prevention:** Every agent needs a Handoff Triggers table. Design handoffs as a system first.
**Detection:** Missing Handoff Triggers = over-scoped or disconnected.

### 7.5 Tool Sprawl

**Failure:** Every agent has every tool, defeating safety and focus. ~30% of community agents do this.
**Why:** Omitting `tools:` field (inherits all) or copy-pasting without considering archetype.
**Prevention:** Always specify `tools:` explicitly. Auditors/reviewers never get Write/Edit.
**Detection:** If tool list matches full inventory, it's not scoped.

### 7.6 Over-Scoped Agents

**Failure:** One agent doing 5 things. Prompt bloated (200+ lines), context wasted, focus lost.
**Why:** Under-decomposition. Cramming everything into one agent.
**Prevention:** Target 60-80 lines per agent. If >100, consider splitting. One archetype per agent.
**Detection:** Count system prompt lines. If >100, check for multiple unrelated domains.
