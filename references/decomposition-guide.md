# Decomposition Guide

How to go from "I'm building X" to "you need these N agents with these roles." This is the builder's primary reference for deciding agent count, composition, and interaction patterns.

---

## 1. Does This Project Need Multiple Agents?

Follow this decision tree from top to bottom. Stop at the first "yes" that applies.

### Decision Tree

```
START: Can one agent handle this project?
│
├─ Can the entire project's domain knowledge fit in CLAUDE.md's
│  operational principles (~30-50 lines of rules)?
│  ├─ YES → Single agent. No sub-agents needed.
│  └─ NO  → Continue.
│
├─ Are there distinct domain boundaries where different expertise
│  is needed? (e.g., frontend vs backend vs infrastructure)
│  ├─ YES → Each boundary is a candidate agent. Continue.
│  └─ NO  → Continue.
│
├─ Do different tasks need different tool access levels?
│  (e.g., read-only auditing vs read-write development)
│  ├─ YES → Each access level is a candidate agent. Continue.
│  └─ NO  → Continue.
│
├─ Would a single agent's instructions exceed ~150 lines?
│  ├─ YES → Split into focused agents by domain area.
│  └─ NO  → Single agent is likely sufficient.
│
└─ Are there natural quality gates?
   (code review, security audit, compliance check, test verification)
   ├─ YES → Each gate is a reviewer or auditor agent.
   └─ NO  → You can handle verification in the main agent.
```

### Quick Test

If you answered "no" to ALL of the following, use a single agent:

1. Does the project span multiple technical domains (frontend + backend + infra)?
2. Do any tasks require read-only tool access for safety (auditing, reviewing)?
3. Would the combined instructions for all tasks exceed 150 lines?
4. Are there compliance or regulatory requirements demanding separation of concerns?
5. Are there quality gates that should run independently from the code that produced the work?

One or more "yes" answers means sub-agents are justified. The number of "yes" answers roughly maps to the number of agents needed beyond the orchestrator.

---

## 2. Project Type Agent Roster Profiles

For each project type: the typical agent roster, why each agent exists, and the handoff relationships.

### 2.1 SaaS Web Application

**Typical roster: 4-5 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `frontend-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | UI components, pages, client-side state, styling |
| `backend-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | API endpoints, database queries, server logic, auth |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, diff analysis |
| `security-auditor` | Auditor | Read, Grep, Glob, Bash | OWASP checks, input validation, secrets detection |
| `researcher` | Researcher | Read, Write, Grep, WebFetch, WebSearch | Library evaluation, architecture research, documentation |

**Handoffs:** Builders -> `qa-reviewer` before commit. `security-auditor` runs on auth/data changes. `researcher` invoked for library evaluation.

**Rationale:** Clear frontend/backend domain split, quality gate needed before shipping, user data requires security review, frequent third-party integrations justify dedicated researcher.

### 2.2 REST/GraphQL API Service

**Typical roster: 3-4 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `api-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Endpoints, schemas, validation, database, business logic |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, API contract validation |
| `security-auditor` | Auditor | Read, Grep, Glob, Bash | Auth checks, input sanitization, rate limiting review |
| `researcher` | Researcher | Read, Write, Grep, WebFetch, WebSearch | API design patterns, library evaluation |

**Handoffs:** `api-builder` -> `qa-reviewer` for contract/test verification. `security-auditor` runs on auth and data changes. `researcher` for integration design.

**Rationale:** Single implementation domain (no frontend/backend split). APIs are directly exposed attack surfaces, justifying the security auditor. Drop researcher to 3 agents if the stack is stable.

### 2.3 CLI Tool

**Typical roster: 2-3 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `cli-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Commands, argument parsing, output formatting, core logic |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, UX consistency checks |
| `docs-writer` | Builder | Read, Write, Edit, Grep | Help text, man pages, README, usage examples |

**Handoffs:** `cli-builder` -> `qa-reviewer` after features. `docs-writer` invoked when commands change.

**Rationale:** Single domain, no frontend/backend split. Docs agent earns its place because CLI UX depends on help text quality. Drop to 2 agents by merging docs into the builder for simple CLIs.

### 2.4 Mobile App

**Typical roster: 4-5 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `ui-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Screens, navigation, components, gestures, animations |
| `backend-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | API integration, local storage, sync logic, push notifications |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, platform consistency |
| `accessibility-auditor` | Auditor | Read, Grep, Glob, Bash | Screen reader support, touch targets, contrast, dynamic type |
| `researcher` | Researcher | Read, Write, Grep, WebFetch, WebSearch | Platform API research, library evaluation |

**Handoffs:** Builders -> `qa-reviewer` before commit. `accessibility-auditor` runs on all screen/UI changes. `researcher` for platform APIs.

**Rationale:** Clear UI/data split. Accessibility auditing is critical for mobile (app store requirements, legal obligations). Researcher justified by rapidly changing platform APIs.

### 2.5 Personal / Lifestyle App

**Typical roster: 2-3 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `app-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Full-stack implementation: UI, logic, data, styling |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, UX consistency |
| `researcher` | Researcher | Read, Write, Grep, WebFetch, WebSearch | Library evaluation, design pattern research |

**Handoffs:** `app-builder` -> `qa-reviewer` before commit. `researcher` for integration/pattern exploration.

**Rationale:** Personal apps rarely need domain boundaries or compliance. Single builder handles everything. Drop researcher to 2 agents for simple projects with a known stack.

### 2.6 Compliance-Heavy Application (Medical, Financial)

**Typical roster: 4-5 agents + mandatory auditor**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `app-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Core application logic, UI, data handling |
| `data-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Database, migrations, data transformations, encryption |
| `compliance-auditor` | Auditor | Read, Grep, Glob, Bash | Regulatory checks: PHI/PII handling, consent, audit trails |
| `security-auditor` | Auditor | Read, Grep, Glob, Bash | Encryption verification, access control, vulnerability scanning |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, integration testing |

**Handoffs:** Builders -> `compliance-auditor` -> `security-auditor` -> `qa-reviewer` (sequential chain).

**Rationale:** Compliance mandates separation of concerns. Data builder separated because data handling has different risk profiles. Two auditors justified: compliance checks regulatory rules, security checks technical implementation.

### 2.7 Data Pipeline / ETL

**Typical roster: 3 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `pipeline-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Extractors, transformers, loaders, orchestration logic |
| `data-auditor` | Auditor | Read, Grep, Glob, Bash | Schema validation, data quality checks, row count verification |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, performance checks |

**Handoffs:** `pipeline-builder` -> `data-auditor` after each stage. `qa-reviewer` on completed segments.

**Rationale:** Single implementation domain but data integrity verification needed at each stage. The data auditor checks transformation integrity, row counts, and schema contracts between stages.

### 2.8 Content Platform / CMS

**Typical roster: 3-4 agents**

| Agent Name | Archetype | Tools | Purpose |
|---|---|---|---|
| `frontend-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Content rendering, editor UI, media handling, theming |
| `backend-builder` | Builder | Read, Write, Edit, Bash, Glob, Grep | Content API, storage, search indexing, permissions |
| `qa-reviewer` | Reviewer | Read, Grep, Glob, Bash | Code review, test verification, content rendering checks |
| `seo-auditor` | Auditor | Read, Grep, Glob, Bash | Meta tags, structured data, performance, accessibility |

**Handoffs:** Builders -> `qa-reviewer` before commit. `seo-auditor` runs on rendering changes and new page types.

**Rationale:** Clear frontend/backend split. SEO auditor is domain-specific: content platforms depend on search visibility. Drop to 3 agents by merging SEO into the reviewer for smaller projects.

---

## 3. Domain Constraint Catalogue

When a project has regulatory or compliance requirements, these constraints add agents and rules to the baseline roster.

### HIPAA (Health Insurance Portability and Accountability Act)

**Adds to agent roster:**
- `compliance-auditor` (Auditor) -- Verifies PHI handling, access controls, audit logging

**Adds to CLAUDE.md:**
- Domain Constraint: "Never store unencrypted PHI. All PHI access must be logged with user ID, timestamp, and access reason."
- Domain Constraint: "All data mutations on patient records require audit trail entries."
- Operational Principle: "Verify PHI encryption at rest and in transit before any data-handling code is committed."

**Adds to settings.json deny list:**
- `Read(./patient-data/**)`, `Read(./**/*phi*/**)`

**Adds to builder agent verification steps:**
- "Confirm no PHI appears in logs, error messages, or API responses."
- "Verify all patient data queries include access logging."

### PCI DSS (Payment Card Industry Data Security Standard)

**Adds to agent roster:**
- `security-auditor` (Auditor) -- Verifies cardholder data handling, encryption, tokenization

**Adds to CLAUDE.md:**
- Domain Constraint: "Never store raw card numbers. Use tokenization for all payment data."
- Domain Constraint: "All payment-related code changes require security audit before commit."
- Operational Principle: "Verify PCI scope boundaries on every payment-adjacent change."

**Adds to settings.json deny list:**
- `Read(./payment-data/**)`, `Read(./**/*card*/**)`

**Adds to builder agent verification steps:**
- "Confirm no cardholder data in logs, error messages, or non-tokenized storage."
- "Verify payment flows use the approved payment processor SDK, not raw card handling."

### GDPR (General Data Protection Regulation)

**Adds to agent roster:**
- `data-auditor` (Auditor) -- Verifies consent tracking, data minimization, deletion capabilities

**Adds to CLAUDE.md:**
- Domain Constraint: "All personal data collection must have an associated consent record."
- Domain Constraint: "Every data store containing personal data must support complete deletion (right to erasure)."
- Operational Principle: "Verify data minimization: collect only what is needed, retain only as long as required."

**Adds to builder agent verification steps:**
- "Confirm every personal data field has a documented purpose and retention period."
- "Verify deletion endpoints remove data from ALL stores (primary DB, caches, backups, analytics)."

### SOC 2 (Service Organization Control Type 2)

**Adds to agent roster:**
- `security-auditor` (Auditor) -- Verifies access controls, change management, monitoring

**Adds to CLAUDE.md:**
- Domain Constraint: "All infrastructure changes require documented approval and audit trail."
- Domain Constraint: "Access control follows least-privilege: every role has the minimum permissions needed."
- Operational Principle: "Log all authentication events, permission changes, and data access."

**Adds to builder agent verification steps:**
- "Confirm all admin actions are logged with actor, action, target, and timestamp."
- "Verify no service accounts use shared credentials."

---

## 4. Heuristics

Three decision rules the builder applies during roster design.

### The "Three Nos" Test

Before creating a separate agent, ask:

1. **Does this need different tools than existing agents?** (e.g., read-only vs read-write)
2. **Does this need different expertise than existing agents?** (e.g., security vs UI design)
3. **Does this need to run as an independent quality gate?** (e.g., audit before commit)

If the answer is "no" to all three, merge the responsibility into an existing agent.

**Worked example:** A project needs linting checks. Does linting need different tools? No -- same Bash access as the builder. Different expertise? No -- the builder knows lint rules. Independent quality gate? Debatable, but linting can run as a verification step within the builder or reviewer. Three Nos = add a lint verification step to the reviewer, don't create a `lint-agent`.

**Worked example:** A project needs security review. Different tools? Yes -- should be read-only (auditor archetype). Different expertise? Yes -- OWASP patterns, input validation, secrets detection. Independent quality gate? Yes -- security review must happen independently from the developer who wrote the code. Three Yeses = create a `security-auditor` agent.

### The "Four Agent Ceiling"

Research shows coordination benefits plateau at 4 agents. Beyond 4:
- Coordination overhead increases quadratically
- 79% of multi-agent failures are specification/coordination problems
- Context cost grows linearly (5 agents x 80 lines = 400 lines of agent context)

**Rule:** If your roster exceeds 4 agents, you must justify each additional agent by name, stating what would break or be unacceptable without it.

**Worked example:** A SaaS app roster proposal has 6 agents: frontend-builder, backend-builder, qa-reviewer, security-auditor, researcher, docs-writer. Apply the ceiling:
- Agents 1-4 (frontend, backend, QA, security) -- justified by domain boundaries and quality gates
- Agent 5 (researcher) -- justified if the project integrates many third-party services; otherwise merge research into the orchestrator
- Agent 6 (docs-writer) -- fails justification. Documentation can be handled by the builders as part of their workflow. Remove it.
- Final roster: 5 agents (if research-heavy) or 4 agents (if stable stack).

### The "Context Budget"

Every agent consumes context when loaded. Budget your agent system against the project's CLAUDE.md:

- Each agent file: ~60-80 lines
- CLAUDE.md: ~80-150 lines
- Rules files: auto-loaded separately, don't count against this budget

**Rule:** If total agent instruction lines exceed 2x the CLAUDE.md length, the agent system is too heavy for the project. Simplify.

**Worked example:** A personal app has a 50-line CLAUDE.md. Budget = 100 lines of agents. At ~70 lines per agent, that's 1-2 agents max. A 5-agent roster (350 lines) for a 50-line CLAUDE.md project is wildly disproportionate. Cut to 2 agents: one builder, one reviewer.

---

## 5. Handoff Design Guide

How to write effective Handoff Triggers tables in agent files.

### Rules

1. **Every agent must have at least one handoff.** An agent that never hands off work is either over-scoped (doing too much) or unnecessary (work never flows to other agents).

2. **Handoff conditions must be concrete and observable.** The orchestrator needs unambiguous signals.

| Bad (vague) | Good (concrete) |
|---|---|
| "When appropriate" | "When all tests pass and diff is ready for review" |
| "If needed" | "When the feature touches authentication or authorization logic" |
| "For complex cases" | "When the change modifies more than 3 files" |

3. **Handoff output must be specified.** What does the receiving agent get?

| Handoff Trigger | Route To | Output Provided |
|---|---|---|
| Tests pass, feature complete | `qa-reviewer` | File paths changed, test results, feature description |
| Security-sensitive code detected | `security-auditor` | File paths, specific concern, relevant code sections |
| Unknown library or pattern | `researcher` | Question, context, what decision depends on the answer |

### Common Handoff Patterns

| Pattern | Flow | When to Use |
|---|---|---|
| Build then review | builder -> reviewer | Standard development: every feature gets reviewed |
| Build then audit | builder -> auditor | Compliance: regulated code gets audited |
| Research then build | researcher -> builder | Unknown territory: research before implementation |
| Audit then fix | auditor -> builder | Findings: auditor reports issues, builder fixes them |
| Review loop | builder -> reviewer -> builder (max 3 cycles) | Iterative: reviewer requests changes, builder implements |

### Anti-Pattern: Circular Handoffs

```
builder -> reviewer -> builder -> reviewer -> builder -> ...
```

Without a termination condition, this loops forever. Always cap review loops:

```
| Condition | Route To |
|---|---|
| Changes requested by reviewer (attempt 1-2) | Back to builder with specific feedback |
| Changes requested by reviewer (attempt 3+) | Escalate to orchestrator for human review |
| All checks pass | Complete — return to orchestrator |
```

---

## 6. Anti-Patterns with Before/After

### Anti-Pattern 1: The 15-Agent Monstrosity

**Before:** A SaaS project with 15 agents -- separate agents for CSS, HTML, JavaScript, React components, React hooks, API routes, API middleware, database queries, database migrations, unit tests, integration tests, e2e tests, documentation, deployment, and monitoring.

**What went wrong:** Over-decomposition. Each agent has a narrow focus but massive coordination overhead. The CSS agent and HTML agent constantly need each other's context. The three test agents duplicate effort. The orchestrator's prompt listing 15 agents and their routing rules is 200+ lines of confusion.

**After (4 agents):**
| Agent | Covers (merged from) |
|---|---|
| `frontend-builder` | CSS + HTML + React components + React hooks |
| `backend-builder` | API routes + API middleware + database queries + database migrations |
| `qa-reviewer` | Unit tests + integration tests + e2e tests (as verification steps) |
| `security-auditor` | Deployment safety + monitoring + security checks |

Documentation is handled by builders as part of their workflow. Monitoring is a verification step in the auditor, not a separate agent.

### Anti-Pattern 2: The One-Agent Army

**Before:** A SaaS application with one agent in CLAUDE.md handling: frontend development, backend API design, database management, security auditing, code review, performance optimization, documentation, and deployment. The single agent's instructions are 300 lines. Quality is inconsistent because the agent has no quality gates -- it reviews its own code.

**What went wrong:** Under-decomposition. The agent self-reviews (no independent quality gate), has every tool (no scoping benefit), and its instruction set is too large for consistent behavior.

**After (3 agents):**
| Agent | Responsibility |
|---|---|
| `app-builder` | Frontend + backend + database (single-domain implementation) |
| `qa-reviewer` | Code review + test verification (independent quality gate) |
| `security-auditor` | Security checks + deployment safety (read-only, can't modify) |

The builder still handles most work, but two independent agents provide quality gates with appropriate tool restrictions.

### Anti-Pattern 3: Five Builders, No Reviewers

**Before:** A project with 5 builder agents (frontend, backend, database, API, infrastructure) and zero reviewers or auditors. All agents have Read + Write + Edit + Bash. No agent checks another agent's work.

**What went wrong:** No quality gates. Builders review their own output. Errors cascade: a bad database migration is used by the API builder, which is consumed by the frontend builder, compounding the original error 3x. Research shows 17x error amplification in systems without review agents.

**After (4 agents -- 2 builders, 1 reviewer, 1 auditor):**
| Agent | Archetype | Change |
|---|---|---|
| `fullstack-builder` | Builder | Merged frontend + backend + API (one domain) |
| `infra-builder` | Builder | Database + infrastructure (separate tools needed) |
| `qa-reviewer` | Reviewer | Reviews all builder output (read-only tools) |
| `security-auditor` | Auditor | Security + compliance checks (read-only tools) |

### Anti-Pattern 4: Universal Tool Access

**Before:** Every agent has the full tool list: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch. The auditor can modify files it's supposed to be reviewing. The researcher can edit production code. The reviewer can rewrite code instead of reporting issues.

**What went wrong:** Tool scoping is the primary mechanism for enforcing agent roles. Without it, role boundaries are just suggestions. The auditor "helpfully" fixes issues it finds instead of reporting them, bypassing the review chain. The researcher edits code while investigating, introducing untested changes.

**After (scoped tools):**
| Agent | Tools | What Changed |
|---|---|---|
| `app-builder` | Read, Write, Edit, Bash, Glob, Grep | Unchanged -- builders need full access |
| `qa-reviewer` | Read, Grep, Glob, Bash | **Removed Write, Edit** -- reviewers report, don't modify |
| `security-auditor` | Read, Grep, Glob, Bash | **Removed Write, Edit** -- auditors examine, don't fix |
| `researcher` | Read, Write, Grep, WebFetch, WebSearch | **Removed Edit, Bash** -- researchers write reports, don't edit code |

### Anti-Pattern 5: Agents Without Handoffs

**Before:** Four agents exist but none have Handoff Triggers sections. The orchestrator delegates based on task type but agents never route work to each other. The builder finishes a feature and... nothing. No review, no audit. The orchestrator has to manually remember to invoke the reviewer after every builder task.

**What went wrong:** Without handoff triggers, the multi-agent system is just parallel silos. Agents don't form a workflow -- they're isolated workers the orchestrator must micromanage.

**After (handoffs added):**
Every agent gets a Handoff Triggers table:
- Builder: "When feature is complete and tests pass" -> qa-reviewer
- Builder: "When code touches auth or data handling" -> security-auditor
- Reviewer: "When changes are requested" -> builder (with specific feedback)
- Reviewer: "When 3+ review cycles without resolution" -> orchestrator
- Auditor: "When security issues found" -> builder (with findings report)

The workflow becomes self-directing: build -> review -> audit -> complete, with escalation paths.
