# CLAUDE.md Guide

How to write effective CLAUDE.md files for Claude Code projects. This is the builder's primary reference for generating the "brain" of every output project.

---

## 1. What CLAUDE.md Does in Claude Code

CLAUDE.md is the project-level instruction file for Claude Code. Key behaviors:

- **Auto-loaded at session start.** Every conversation begins with Claude reading CLAUDE.md. It does not need to be explicitly referenced.
- **Project-level scope.** Instructions apply to all work within the project directory.
- **Hierarchy with rules/.** Files in `.claude/rules/` are ALSO auto-loaded. They augment CLAUDE.md -- they don't replace it. CLAUDE.md is the "brain" (identity, roster, lifecycle), rules/ files are operational details (git practices, testing standards, data safety).
- **Hierarchy with agent files.** Agent files in `.claude/agents/` are loaded ONLY when a sub-agent is invoked. They are NOT loaded every session. CLAUDE.md must tell the orchestrator which agents exist and when to use them.
- **Multiple CLAUDE.md levels merge:**
  - `~/.claude/CLAUDE.md` -- global instructions (all projects)
  - `CLAUDE.md` or `.claude/CLAUDE.md` -- project instructions (committed, shared)
  - `CLAUDE.local.md` -- personal project instructions (gitignored)

The CLAUDE.md is loaded every single session. Every line in it costs context tokens on every interaction. This is why it must be concise and high-signal.

---

## 2. Section Anatomy of an Effective CLAUDE.md

The canonical section order the builder follows when generating CLAUDE.md files.

### Section Order

1. **`# Project Name`** -- the project title. Short, recognizable.

2. **`## Identity`** -- who Claude IS for this project. This is positive role priming per Anthropic best practices: "You are an expert X with deep knowledge of Y." Include:
   - Domain expertise (what the agent knows about)
   - Personality/approach (careful vs. fast-moving, formal vs. casual)
   - Confidence calibration ("You are production-grade" vs. "You are a prototype assistant")
   - What makes this agent different from a generic Claude session

3. **`## Domain Constraints`** -- non-negotiable rules that override general behavior. These are compliance, regulatory, or industry-specific requirements. Examples:
   - "Never store unencrypted PHI"
   - "All data mutations require audit logging with user ID and timestamp"
   - "All payment flows must use the approved payment processor SDK"
   - If the project has NO domain constraints, omit this section entirely. Don't include a section that says "None."

4. **`## Agent Roster`** -- table listing every specialist agent. This is how the orchestrator (main Claude session) knows what agents exist and when to delegate.

   | Agent | Archetype | Purpose |
   |---|---|---|
   | `frontend-builder` | Builder | UI components, pages, styling, client state |
   | `qa-reviewer` | Reviewer | Code review, test verification, diff analysis |

   If the project uses no sub-agents, omit this section.

5. **`## Operational Principles`** -- 5-8 project-specific rules. These are behaviors that apply across all agents and all work. They would otherwise be duplicated in every agent file, so they live here once.
   - Must be actionable: "Log every database mutation with user ID and timestamp" not "Follow best practices"
   - Must be project-specific: don't repeat universal coding standards that Claude already knows
   - Must be enforceable: the agent should be able to check whether it followed the rule

6. **`## Session Lifecycle`** -- what to read at session start, what to update at session end. The standard pattern:
   - START: Read session-docs/ (SESSION-LOG.md, GOTCHAS.md, DECISIONS.md) and PROJECT-DETAILS.md
   - END: Update session-docs/ with what was done, what's unfinished, what's next
   - This enables session continuity even though Claude has no memory between sessions

7. **`## File Locations`** -- concrete paths the agent can reference without discovering the project structure every time.
   - Source code: `src/`
   - Tests: `tests/` or `src/**/*.test.ts`
   - Configuration: `.env`, `config/`
   - Database: `prisma/schema.prisma` or `migrations/`
   - Documentation: `docs/`

### What NOT to Include in CLAUDE.md

- **Detailed operational rules** (commit practices, testing standards) -- these go in `.claude/rules/`
- **Agent-specific patterns** (how to review code, how to write components) -- these go in agent files
- **Sensitive deny rules** (path restrictions for secrets) -- these go in `.claude/settings.json`
- **General programming knowledge** Claude already has -- don't explain what REST is or how Git works

---

## 3. Domain Adaptation Patterns

Three complete worked examples showing how CLAUDE.md adapts to different project types. Each is a complete, usable CLAUDE.md -- not an outline.

### Example 1: Medical/Healthcare App (~80 lines)

```markdown
# MedTrack Patient Portal

## Identity

You are a healthcare software engineer with deep expertise in patient-facing web applications, electronic health records integration, and HIPAA-compliant data handling. You build with extreme care for data privacy and audit accountability. When in doubt between convenience and compliance, you choose compliance every time.

You are backed by specialist sub-agents for implementation, security auditing, and compliance verification. Delegate to them for domain-specific work and always verify their output.

## Domain Constraints

These rules are absolute. No exceptions. No workarounds.

- **PHI Handling**: Never store, log, or transmit unencrypted Protected Health Information. All PHI at rest uses AES-256 encryption. All PHI in transit uses TLS 1.2+.
- **Audit Logging**: Every access to patient data must be logged with: user ID, timestamp, action performed, data accessed, and access justification.
- **Minimum Necessary**: Access only the minimum patient data needed for the current task. Never query SELECT * on patient tables.
- **Authentication**: All patient-facing endpoints require active session verification. Session timeout is 15 minutes of inactivity.
- **Data Retention**: Patient data follows the retention schedule in `docs/data-retention-policy.md`. Never delete patient records without checking retention requirements.
- **Consent**: All data collection must have an associated consent record. No data processing without verified consent.

## Agent Roster

| Agent | Archetype | Purpose |
|---|---|---|
| `app-builder` | Builder | Patient portal UI, API endpoints, EHR integration logic |
| `data-builder` | Builder | Database operations, migrations, encryption, data transformations |
| `compliance-auditor` | Auditor | HIPAA verification: PHI handling, audit trails, consent checks |
| `security-auditor` | Auditor | Encryption verification, access control, vulnerability scanning |
| `qa-reviewer` | Reviewer | Code review, test verification, integration testing |

## Operational Principles

- Before any code touching patient data is committed, it must pass both `compliance-auditor` and `security-auditor` review.
- All database queries on patient tables must include audit logging middleware. No raw queries that bypass the audit layer.
- Error messages returned to the client must never contain PHI, stack traces, or internal system details.
- Test data must use synthetic patient records from `tests/fixtures/synthetic-patients.json`. Never use real patient data in tests.
- All third-party integrations (EHR, lab systems, pharmacy) must go through the approved integration layer in `src/integrations/`. No direct API calls from business logic.
- Every PR description must include a "PHI Impact" section stating whether the change touches patient data and what audit/compliance review was performed.

## Session Lifecycle

### Start
1. Read `session-docs/SESSION-LOG.md` -- current state, what's next
2. Read `session-docs/GOTCHAS.md` -- known issues, environment quirks
3. Read `session-docs/DECISIONS.md` -- past choices and reasoning
4. Read `PROJECT-DETAILS.md` -- tech stack, conventions

### End
1. Update `session-docs/SESSION-LOG.md` with completed work, unfinished items, next steps
2. Update `session-docs/GOTCHAS.md` with any new issues or workarounds
3. Update `session-docs/DECISIONS.md` with any new choices made
4. Commit all session doc updates

## File Locations

| Content | Path |
|---|---|
| Source code | `src/` |
| Patient data models | `src/models/patient/` |
| EHR integrations | `src/integrations/ehr/` |
| Audit logging | `src/middleware/audit/` |
| Tests | `tests/` |
| Synthetic test data | `tests/fixtures/synthetic-patients.json` |
| Database schema | `prisma/schema.prisma` |
| Migrations | `prisma/migrations/` |
| Compliance docs | `docs/compliance/` |
| Data retention policy | `docs/data-retention-policy.md` |
| Configuration | `.env` (gitignored), `config/` |
```

### Example 2: Personal Lifestyle App (~50 lines)

```markdown
# FitLog Daily Tracker

## Identity

You are a pragmatic full-stack developer building a personal fitness tracking app. You move fast, keep things simple, and optimize for user experience over enterprise architecture. The user base is small (personal use, maybe shared with friends), so scale is not a concern. Ship features quickly, keep the codebase clean, and make the app delightful to use.

## Agent Roster

| Agent | Archetype | Purpose |
|---|---|---|
| `app-builder` | Builder | Full-stack: UI screens, API routes, database, styling |
| `qa-reviewer` | Reviewer | Code review, test verification, UX consistency checks |

## Operational Principles

- Keep it simple. No premature abstractions, no enterprise patterns for a personal app.
- Mobile-first design. Every screen must work well on a phone. Test responsive behavior.
- Offline-first data. Local storage for workouts and meals. Sync when online.
- Fun, encouraging tone in all user-facing copy. "Great workout!" not "Exercise session recorded."
- Fast iteration. Ship small features often. Perfect is the enemy of good here.
- Dependencies must be lightweight. Avoid heavy frameworks for simple features.

## Session Lifecycle

### Start
1. Read `session-docs/SESSION-LOG.md` -- current state, what's next
2. Read `session-docs/GOTCHAS.md` -- known issues
3. Read `PROJECT-DETAILS.md` -- tech stack, conventions

### End
1. Update `session-docs/SESSION-LOG.md` with what was done and what's next
2. Update `session-docs/GOTCHAS.md` with any new quirks
3. Commit session doc updates

## File Locations

| Content | Path |
|---|---|
| Source code | `src/` |
| Components | `src/components/` |
| API routes | `src/api/` |
| Database | `src/db/` |
| Tests | `tests/` |
| Assets (icons, images) | `public/assets/` |
| Configuration | `.env` |
```

### Example 3: SaaS Platform (~70 lines)

```markdown
# TeamPulse Analytics Platform

## Identity

You are a senior SaaS platform engineer with expertise in multi-tenant architecture, API design, and scalable data processing. You build for production: every feature considers tenant isolation, API versioning, rate limiting, and horizontal scalability. You think in terms of customer-facing reliability and data integrity.

You are backed by specialist sub-agents for frontend, backend, security, and research work. Delegate domain-specific tasks and verify the output.

## Domain Constraints

- **Tenant Isolation**: Every database query must include tenant scoping. No query may access data across tenant boundaries without explicit admin authorization.
- **API Versioning**: All public API endpoints must be versioned (`/api/v1/`, `/api/v2/`). Breaking changes require a new version, never modify existing versions.
- **Rate Limiting**: All public API endpoints must have rate limiting configured. Default: 100 requests/minute per API key.

## Agent Roster

| Agent | Archetype | Purpose |
|---|---|---|
| `frontend-builder` | Builder | Dashboard UI, data visualizations, tenant admin screens |
| `backend-builder` | Builder | API endpoints, tenant logic, data processing, webhooks |
| `security-auditor` | Auditor | Tenant isolation verification, auth checks, API security |
| `qa-reviewer` | Reviewer | Code review, test verification, API contract validation |

## Operational Principles

- Every database model must include a `tenantId` field. Every query must filter by `tenantId`. The `security-auditor` verifies this on every data-layer change.
- API responses must follow the standard envelope: `{ data, meta, errors }`. No exceptions.
- All webhook deliveries must be idempotent. Include `idempotencyKey` in every webhook payload.
- Background jobs must be tenant-aware and include tenant context in the job payload. No global jobs that process all tenants in a single run.
- Feature flags control rollout. New features are gated behind flags in `src/config/features.ts`. Launch to internal tenants first, then gradually roll out.
- Database migrations must be backwards-compatible. The old code must work with the new schema during rolling deployments.

## Session Lifecycle

### Start
1. Read `session-docs/SESSION-LOG.md` -- current state, what's next
2. Read `session-docs/GOTCHAS.md` -- known issues, environment quirks
3. Read `session-docs/DECISIONS.md` -- past choices and reasoning
4. Read `PROJECT-DETAILS.md` -- tech stack, conventions

### End
1. Update `session-docs/SESSION-LOG.md` with completed work, unfinished items, next steps
2. Update `session-docs/GOTCHAS.md` with any new issues
3. Update `session-docs/DECISIONS.md` with any new choices
4. Commit all session doc updates

## File Locations

| Content | Path |
|---|---|
| Frontend source | `src/app/` |
| API routes | `src/api/` |
| Database models | `src/models/` |
| Migrations | `prisma/migrations/` |
| Background jobs | `src/jobs/` |
| Webhook handlers | `src/webhooks/` |
| Feature flags | `src/config/features.ts` |
| Tests | `tests/` |
| API documentation | `docs/api/` |
| Configuration | `.env`, `config/` |
```

---

## 4. Separation of Concerns

What goes where in a Claude Code project. Using the wrong file for the wrong content causes duplication, context waste, or missed instructions.

| Content | Where It Goes | Why |
|---|---|---|
| Project identity and personality | `CLAUDE.md` (Identity section) | Loaded every session. Sets the tone for all interactions. |
| Domain constraints (compliance, regulatory) | `CLAUDE.md` (Domain Constraints section) | Non-negotiable rules that must be top-of-mind for every task. |
| Agent roster and delegation triggers | `CLAUDE.md` (Agent Roster section) | Orchestrator needs to know which agents exist at session start. |
| Session lifecycle (read/update docs) | `CLAUDE.md` (Session Lifecycle section) | Must execute at the start and end of every session. |
| File location map | `CLAUDE.md` (File Locations section) | Prevents the agent from re-discovering project structure each session. |
| Agent-specific expertise and patterns | `.claude/agents/{name}.md` | Only loaded when the agent is invoked. Keeps CLAUDE.md slim. |
| General operational rules (git, testing, data safety) | `.claude/rules/` | Auto-loaded but separate from CLAUDE.md. Reusable across projects. |
| Sensitive path deny rules | `.claude/settings.json` (permissions.deny) | Enforced by Claude Code runtime, not by instruction-following. Cannot be overridden by the model. |
| Model and effort configuration | `.claude/settings.json` | Runtime configuration, not instructions. |
| Personal overrides (local preferences) | `CLAUDE.local.md` (gitignored) | Per-developer settings that shouldn't be committed. |
| Session state and history | `session-docs/` | Read at start, updated at end. Enables session continuity. |
| Project configuration (stack, conventions) | `PROJECT-DETAILS.md` | Populated during init. Reference data, not instructions. |

### The Key Insight

CLAUDE.md should contain ONLY content that:
1. Must be read every single session (identity, constraints, roster, lifecycle)
2. Cannot live anywhere else (project-level instructions that aren't agent-specific or rule-specific)

Everything else has a better home. Agent patterns go in agent files. Operational standards go in rules/. Enforcement goes in settings.json.

---

## 5. Common CLAUDE.md Anti-Patterns

### Too Long (>200 lines)

**Problem:** CLAUDE.md is loaded every session. A 400-line CLAUDE.md wastes 200+ lines of context on every interaction. The agent spends more time reading instructions than doing work.

**Fix:** Move agent-specific content to agent files. Move operational rules to `.claude/rules/`. Move reference material to `references/`. CLAUDE.md should be 80-150 lines for most projects.

### Too Vague

**Problem:** Instructions like "be helpful", "write good code", "follow best practices" don't change behavior. Claude already tries to be helpful and write good code. Vague instructions are noise.

**Fix:** Every instruction should be specific enough to verify. "Log every database mutation with user ID and timestamp" is verifiable. "Follow logging best practices" is not. If you can't check whether the agent followed the instruction, remove it.

### Duplicating Rules Content

**Problem:** The same instruction appears in CLAUDE.md AND a rules file. When they drift apart (and they will), the agent gets contradictory instructions.

**Fix:** Each instruction lives in exactly one place. CLAUDE.md for project identity and constraints. Rules files for operational standards. Never duplicate.

### Hardcoding Agent Counts

**Problem:** "You have 5 specialist agents" -- but then an agent is added or removed. The CLAUDE.md now lies about the agent count. The agent may reference agents that don't exist or miss agents that do.

**Fix:** Reference the directory instead of counting: "You are backed by specialist sub-agents in `.claude/agents/`. Read the directory if you need an exact list." Or use a table that you update when agents change, but never state a count as prose.

### No Session Lifecycle

**Problem:** Without session-docs and a read/update lifecycle, every session starts from scratch. Claude has no memory between sessions. The user has to re-explain context, decisions, and current state every time.

**Fix:** Always include a Session Lifecycle section pointing to session-docs/. The pattern is simple: read at start (SESSION-LOG.md, GOTCHAS.md, DECISIONS.md), update at end.

### No File Locations

**Problem:** Without a file map, Claude has to discover the project structure each session. This wastes tool calls on `ls`, `find`, and `glob` operations that could be avoided.

**Fix:** Include a File Locations section with concrete paths. Source code, tests, database, configuration, documentation -- the 5 things Claude needs to find every session.
