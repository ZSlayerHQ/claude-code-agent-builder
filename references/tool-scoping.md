# Tool Scoping Reference

The builder's reference for which tools each agent gets. Every tool inclusion or exclusion should be a deliberate decision with clear rationale.

---

## 1. Complete Claude Code Tool Inventory

| Tool | What It Does | When to Use | When NOT to Use |
|------|-------------|-------------|-----------------|
| **Read** | Reads file contents from disk. Supports code, images, PDFs, notebooks | Always. Every agent needs to read files | Never exclude this |
| **Write** | Creates new files or completely overwrites existing ones | Creating new files, full rewrites | Auditors, reviewers — they report, not modify |
| **Edit** | Makes targeted string replacements in existing files | Modifying existing code, config, docs | Auditors, reviewers — same as Write |
| **Bash** | Executes shell commands. Runs tests, builds, linters, scripts | Running test suites, build tools, CLI commands | Agents that should only analyze, not execute |
| **Grep** | Searches file contents using regex patterns | Finding patterns, anti-patterns, secrets, usage of functions | Rarely excluded — most agents benefit from search |
| **Glob** | Finds files by name pattern (e.g., `**/*.ts`) | Locating files by extension or naming convention | Rarely excluded |
| **WebFetch** | Fetches content from a URL | Reading documentation pages, API specs, blog posts | Agents that should work only with local code |
| **WebSearch** | Searches the web for information | Research, finding libraries, checking best practices | Agents focused on local code changes |
| **NotebookEdit** | Edits Jupyter notebook cells | Data science projects with .ipynb files | Non-notebook projects |
| **Agent** | Spawns sub-agents (can scope to specific agents) | Orchestrators that delegate to specific workers | Most agents — sub-agents can't spawn sub-agents |
| **Context7** | Queries up-to-date library/framework documentation | Looking up API syntax, config options, migration guides | Agents that don't interact with external libraries |
| **GitNexus** | Code-graph operations: impact analysis, dependency mapping, route maps | Understanding how changes propagate through codebase | Small projects where grep suffices |
| **GitHub MCP** | GitHub operations: PRs, issues, file contents, code search | Agents that interact with GitHub repos | Agents that should stay local |

### MCP Servers (configured per-project in `.mcp.json`)

MCP tools appear as `mcp__<server>__<tool>` and are inherited by agents unless explicitly scoped. The `mcpServers` frontmatter field can scope MCP access per agent.

---

## 2. Role to Tools Mapping

The canonical mapping. Every tool inclusion has a rationale; every exclusion is deliberate.

### Builder Archetype

**Tools:** `[Read, Write, Edit, Bash, Context7]` + GitNexus for large codebases

| Tool | Rationale |
|------|-----------|
| Read | Must read existing code to modify it correctly |
| Write | Creates new source files, configs, tests |
| Edit | Modifies existing code with targeted replacements |
| Bash | Runs dev server, tests, linters, build tools, migrations |
| Context7 | Looks up framework/library API docs while implementing |
| GitNexus | (Optional) Impact analysis on large codebases before changes |
| ~~WebSearch~~ | Excluded — research belongs to the researcher agent |
| ~~WebFetch~~ | Excluded — external docs lookup during implementation is Context7's job |

### Auditor Archetype

**Tools:** `[Read, Grep, Glob, Bash]` + Context7 for security library docs

| Tool | Rationale |
|------|-----------|
| Read | Must read code to audit it |
| Grep | Searches for anti-patterns, leaked secrets, unsafe functions |
| Glob | Finds files by pattern (e.g., all config files, all .env files) |
| Bash | Runs security scanners (`npm audit`, `semgrep`, `trivy`, `pip-audit`) |
| Context7 | (Optional) Looks up security library docs (helmet, bcrypt, jose) |
| ~~Write~~ | **Never.** Auditors report findings — they never modify code |
| ~~Edit~~ | **Never.** Same reason. The auditor/builder split is the primary safety boundary |

### Researcher Archetype

**Tools:** `[Read, Write, Edit, Grep, WebFetch, WebSearch, Context7]`

| Tool | Rationale |
|------|-----------|
| Read/Grep | Reads existing code and project context to ground research |
| Write/Edit | Saves research reports to `research/` directory |
| WebFetch | Reads documentation pages, GitHub READMEs, changelogs |
| WebSearch | Searches for libraries, benchmarks, comparisons |
| Context7 | Looks up specific library docs when evaluating candidates |
| ~~Bash~~ | Excluded — researchers analyze and report, don't execute code |
| ~~GitNexus~~ | Excluded — code-graph analysis isn't part of research workflow |

### Reviewer Archetype

**Tools:** `[Read, Grep, Glob, Bash, GitNexus]`

| Tool | Rationale |
|------|-----------|
| Read/Grep/Glob | Searches codebase for patterns, conventions, related code |
| Bash | Runs tests, linter, type checker to verify correctness |
| GitNexus | Analyzes impact of changes across the codebase |
| ~~Write~~ | **Never.** Reviewers report — they never modify files |
| ~~Edit~~ | **Never.** Same as Write. This is the critical safety boundary |
| ~~WebSearch~~ | Excluded — reviewers focus on the code, not external research |

---

## 3. MCP Server Reference

### Context7

**What it provides:** Up-to-date documentation for libraries, frameworks, SDKs, APIs, and CLI tools. Queries resolve to specific doc pages with current syntax and config options.

**Which agents should have it:**
- **Builders** — look up API syntax while implementing
- **Researchers** — look up library docs when evaluating candidates
- **Auditors** — (optional) look up security library patterns

**Which agents should NOT:** Reviewers (reviewing code, not looking up docs) and pure planners/architects (design-level decisions, not API-level).

### GitNexus

**What it provides:** Code-graph operations — impact analysis, dependency mapping, route maps, shape checks. Answers "what breaks if I change this?"

**Which agents should have it:**
- **Reviewers** — analyze impact of changes across the codebase
- **Builders** — (optional, large codebases) check impact before modifying shared code
- **Architects** — analyze module dependencies for structural decisions

**Which agents should NOT:** Researchers (not analyzing code structure) and writers (documenting, not analyzing dependencies).

### GitHub MCP

**What it provides:** GitHub operations — create/view PRs, issues, branches, file contents, code search across repos, repository management.

**Which agents should have it:**
- **Builders** — (optional) when workflow includes PR creation
- **Reviewers** — (optional) when reviewing GitHub PRs directly

**Which agents should NOT:** Most agents. GitHub operations are typically orchestrator-level tasks, not sub-agent tasks.

---

## 4. Tool Combination Patterns

These tool groupings work together for specific workflows.

| Pattern | Tools | Use Case |
|---------|-------|----------|
| **Code search** | Read + Grep + Glob | Auditor scanning for anti-patterns, finding all usages of a function |
| **Full development** | Read + Write + Edit + Bash | Builder creating and testing code changes |
| **Research pipeline** | WebFetch + WebSearch + Context7 | Researcher evaluating libraries and documenting findings |
| **Impact analysis** | Read + Grep + GitNexus | Reviewer assessing how changes propagate through codebase |
| **Security audit** | Read + Grep + Glob + Bash | Auditor scanning for secrets + running `npm audit` / `semgrep` |
| **Documentation** | Read + Write + Edit + WebFetch | Writer creating docs grounded in actual code + external references |

### The Principle

Tools that serve the same workflow phase should be grouped together. Tools from different phases (e.g., WebSearch on a builder) signal a scoping mistake — the agent is doing two jobs.

---

## 5. Anti-Pattern Catalogue

### 5.1 Tool Sprawl (No Explicit Tools)

**The problem:** No `tools:` field means inheriting everything. A reviewer gets Write and "helpfully" fixes code. A builder gets WebSearch and goes researching. 30% of community agents make this mistake.

**The fix:** Always specify `tools:` explicitly. Start from archetype defaults and adjust.
```yaml
# Bad — inherits everything
---
name: Code Review
description: Reviews code quality
---

# Good — scoped to read-only + execution
---
name: Code Review
description: Reviews code quality and convention adherence after feature implementation.
tools: [Read, Grep, Glob, Bash, GitNexus]
---
```

### 5.2 Missing Grep on Auditors

**The problem:** Auditor agent has Read but not Grep. Can read individual files but can't search the codebase for patterns.

**Why it's bad:** Auditing requires finding all instances of an anti-pattern (e.g., every SQL query that uses string concatenation). Without Grep, the auditor must read files one by one.

**The fix:** Every auditor gets Grep + Glob as standard. Grep for content search, Glob for file discovery.

### 5.3 Write/Edit on Reviewers

**The problem:** Reviewer has Write/Edit and starts modifying code instead of reporting. Breaks generator/critic separation — if the reviewer fixes things itself, there's no quality gate.

**The fix:** Reviewers and auditors never get Write or Edit. This is the fundamental archetype boundary.
```yaml
# Bad — reviewer can modify files
tools: [Read, Write, Edit, Grep, Glob, Bash]

# Good — reviewer can only read and report
tools: [Read, Grep, Glob, Bash, GitNexus]
```

### 5.4 No Explicit Tools (Inherit All)

**The problem:** No `tools:` field means the agent inherits all tools including MCP servers. New MCP servers added to the project automatically become available.

**The fix:** Always include `tools:` in frontmatter, even if the list is long.

### 5.5 Bash Without Guardrails

**The problem:** Agent has Bash without `deny` rules in settings.json. Can run `rm -rf`, `git push --force`, `DROP TABLE`, or any destructive command.

**The fix:** Pair Bash access with deny rules:
```json
{
  "permissions": {
    "deny": [
      "Bash(git push --force*)",
      "Bash(git reset --hard*)",
      "Bash(git clean -f*)",
      "Bash(rm -rf*)"
    ]
  }
}
```
Auditors needing Bash only for scanners should use specific `allow` patterns where possible.

---

## 6. Domain-Specific Tool Additions

When to add tools beyond archetype defaults based on project domain.

### Medical / Compliance (HIPAA)

- Add `Read` deny rules for PHI paths: `"Read(./patient-data/**)"`, `"Read(./**/phi/**)"` in settings.json
- Auditor agents get elevated importance — may need additional Bash scanners for compliance checking
- No WebFetch/WebSearch on agents handling sensitive data paths

### Frontend / UI

- Consider `frontend-design` plugin for builders creating UI components
- Builder agents may benefit from Bash patterns for Storybook, Playwright, or browser testing
- Context7 is essential for framework-specific component patterns

### API-Heavy / Integration

- Builder agents may need WebFetch for testing external API endpoints — exception to "no WebFetch on builders," justified when verifying API integration
- Scope WebFetch with specific URL patterns

### Data Pipeline / ETL

- Builder agents need expanded Bash for database CLI tools, data processing scripts
- Add deny rules for production connections: `"Bash(*--production*)"`, `"Bash(*prod.*)"`

### Academic / Research

- Researcher agents may need NotebookEdit for Jupyter workflows
- Writer/Synthesizer archetype elevated for paper/report output
- WebFetch + WebSearch essential for literature review
