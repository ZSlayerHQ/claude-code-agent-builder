# Lexicon Discipline Guide

Reference for the agent builder on when to scaffold the lexicon kit during full-suite generation, and how it shapes the rest of the project's spine.

## What "lexicon-first" means

Every domain term in the project — entity names, field names, enum values, tool/verb names, event names, status / severity values, API route segments, AI prompt template names, background-job queue names, notification template names, audit-log event types — originates in `lexicon/` yml files.

**Code generates from the lexicon. The lexicon does not generate from code.**

Three companion artifacts make the discipline operational:
- `lexicon/resources/_schema.yml` — schema-of-schemas defining the 19-layer shape every resource yml must conform to
- `.claude/rules/naming-lexicon.md` — auto-loaded enforcement rule that fires on every session
- `docs/agents/00-NAMING-CONVENTIONS.md` — verb whitelist + casing rules + extension policy

Plus two operational artifacts:
- `lexicon/DRIFT-REGISTER.md` — tracks every override of a locked decision or whitelist
- `lexicon/resources/README.md` — derivation table + decisions log + resource inventory

## When to scaffold the kit

**Recommended (most cases):**

- Project has ≥5 domain entities that need consistent naming across DB / API / AI prompts / UI
- Project has any AI prompt that returns structured JSON (Zod validation against lexicon enums is high-leverage)
- Project has multiple data ingestion connectors (lexicon mapping at the connector boundary kills drift)
- Project will be touched by multiple agents (the lexicon is their shared vocabulary)
- Project is expected to grow (every term added under lexicon discipline costs less to maintain than one added free-form)

**Skip:**

- One-off scripts or content-only projects (no domain entities)
- Pure-LLM projects with no persistent schema
- Projects where the operator explicitly prefers ad-hoc naming and accepts the drift cost

## How the agent builder integrates the kit

When `Full-Suite Mode` includes lexicon scope (per CLAUDE.md step 4a), the generation step ships:

1. `lexicon/resources/_schema.yml` — copied verbatim from `templates/lexicon/_schema.yml` (the schema is generic; project-specific shape lives in resource ymls)
2. `lexicon/resources/README.md` — copied from `templates/lexicon/README.md`; operator fills in D1-D7 decisions per project at first session
3. `lexicon/DRIFT-REGISTER.md` — copied empty from template
4. `.claude/rules/naming-lexicon.md` — copied verbatim
5. `docs/agents/00-NAMING-CONVENTIONS.md` — copied with starter 15-verb whitelist; operator adds project-specific verbs via Drift Register
6. Empty `lexicon/resources/` (with .gitkeep) and `lexicon/enums/` (with .gitkeep) for the operator's project-specific yml authoring

## Operational principle templates to add to the project's CLAUDE.md

When lexicon kit is in scope, the generated CLAUDE.md should include these in Operational Principles:

> **Lexicon-first.** No domain term in code, AI prompt, DB column, API route, or UI label exists outside `lexicon/`. Code is generated from lexicon yml; the lexicon is not generated from code. New terms require a `lexicon/resources/` update; new verbs require a `docs/agents/00-NAMING-CONVENTIONS.md` update + Drift Register entry + owner sign-off.

> **Connector boundary is the drift line.** Every external API response is mapped to lexicon names inside the connector. App code never sees raw external field names.

> **Score everything; recommend nothing without evidence.** Every AI-generated output cites a record id (where applicable). Free-form prose claims are rejected by the reviewer.

## What goes into the project's first session

The first Claude Code session of the generated project should:

1. Read `lexicon/resources/_schema.yml` to internalise the 19-layer shape
2. Read `lexicon/resources/README.md` and write project-specific D1-D7 decisions (score shape, canonical id strategy, enum locks)
3. Author the first 3-5 gold-standard resource ymls (the project's central entities)
4. Write the first batch of stub ymls for the remaining entities
5. Author the first batch of enum ymls (severity, confidence, status, etc.)
6. Set up the codegen pipeline (`scripts/codegen.ts` or equivalent) that turns yml into ORM schema + Zod schemas + TS types
7. Wire `lexicon-check` into pre-commit + CI

## What the agent roster needs to do

When lexicon kit is in scope, the generated agent roster should include either a dedicated researcher who owns lexicon authoring (recommended for domain-heavy projects) or distribute lexicon ownership across the existing roster:

- **Researcher (e.g. domain-researcher)** owns `lexicon/`, `DRIFT-REGISTER.md`, `00-NAMING-CONVENTIONS.md`, and the 14-day audit cadence
- **Reviewer (e.g. compliance-reviewer)** enforces lexicon-check at the merge gate; rejects PRs that introduce strings absent from lexicon
- **Builders** generate code from lexicon via codegen pipeline; never hand-edit generated files

## Anti-patterns the kit prevents

- Drift between DB columns and JSON API keys (codegen enforces case mapping)
- AI prompt enums that don't match Zod schemas (both derive from lexicon yml)
- New connectors landing rows with unknown fields (mapping happens at boundary)
- "I'll just add `cornerPlot` here and `corner_plot` there and align them later" (lexicon-check fails the build)
- Free-form severity strings emitted by LLMs (Zod rejects values absent from `severity.yml`)

## Reference implementation

A reference project built with this kit will typically have the following shape:

- 19-layer schema-of-schemas at `lexicon/resources/_schema.yml`
- A growing collection of resource ymls (gold + stub) demonstrating the gold/stub progression
- Enum ymls demonstrating ordinal locks (severity, confidence) + open enums (project-domain types)
- Decisions D1-D7 covering score shape, canonical id, casing, strategy, severity, confidence, currency
- Drift Register format documented; populated only when locked decisions are overridden

When generating outputs that include the lexicon kit, encourage the operator to author the project's first resource yml as the worked example.

## When NOT to use the kit

- The project is content-only (a vault, a creator workflow set, a research repository)
- The project is a one-off script or a CLI tool with < 5 domain terms
- The operator has explicit reasons to favour ad-hoc naming (rare; the operator should be asked to confirm understanding of the drift cost)
- The project is greenfield with no clear domain yet (lexicon comes after the first few entities are clear, not before)
