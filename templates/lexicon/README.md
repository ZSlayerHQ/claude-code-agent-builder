# Lexicon — Resources

Source-of-truth for every domain term in this project. Code is generated from yml here. The lexicon is not generated from code.

This directory contains:

- `_schema.yml` — schema-of-schemas (v2). Defines the 19 layers every resource yml must conform to.
- `README.md` — this file. Derivation table + decisions log + Drift Register summary + resource inventory.
- `<resource>.yml` — one yml per domain entity (gold or stub).

Companion paths:

- `../enums/<enum>.yml` — single-source enum values
- `../DRIFT-REGISTER.md` — log of every override of a locked decision or whitelist
- `../../docs/agents/00-NAMING-CONVENTIONS.md` — verb whitelist + casing rules + extension policy
- `../../.claude/rules/naming-lexicon.md` — auto-loaded enforcement rule

## 19-layer derivation table

Every resource yml conforms to `_schema.yml` v2 and declares all 19 layers (or `null` if not applicable).

| Layer | Field | Purpose |
|---|---|---|
| 1 | `resource` | Snake-case canonical name (matches filename). |
| 2 | `kind` | `table` (row-bearing) / `view` / `report` / `service` / `external_table` / `enum_owner`. |
| 3 | `canonical_id` | Field that uniquely identifies a row. |
| 4 | `fields` | All columns. snake_case at DB; camelCase derives in TS via codegen. |
| 5 | `enums` | Which enum yml files this resource binds. |
| 6 | `tools` | Verb-prefixed operations. Includes `canonical_create` declaration. |
| 7 | `events` | Past-tense PascalCase. Each: `name`, `payload_shape`, `triggers`. |
| 8 | `derived_emitter` | Tool→event mapping. CI verifies every tool has an emitter or `emits: []`. |
| 9 | `permission_scope` | Who can read / write / mutate. |
| 10 | `audit_resource_type` | The string written to AuditLog.resource_type for events on this resource. |
| 11 | `data_sources` | Which connectors populate this resource. |
| 12 | `examples` | 1–3 worked examples (full JSON). |
| 13 | `business_rules` | Domain rules not expressible as type constraints. |
| 14 | `failure_modes` | Common ways this resource fails — each with detection + recovery. |
| 15 | `related_tools` | Sequencing hints — tools that typically follow each other. |
| 16 | `ui_bindings` | UI components / pages that bind to this resource. |
| 17 | `zod_schema` | Generated Zod schema name. |
| 18 | `prisma_model` | Generated ORM model name (or null for views/reports/services). |
| 19 | `test_fixtures` | Paths to fixture files used by unit + integration tests. |

**Cross-cut additional layers** (declared in `_schema.yml` but not always populated):

- `llm_prompt_refs` — which AI prompts cite this resource by name.
- `realtime_channels` — background-job queue / channel names that touch this resource.
- `notification_templates` — email / chat / webhook template names referencing this resource.

## Decisions log

Locked decisions specific to this project. Overrides require a Drift Register entry.

> **NOTE for new projects:** the placeholders below are starter-shape examples. Replace each with the project's own locked decisions — score dimensions, canonical id strategy, casing rules, currency representation, etc. — before authoring any gold resource yml.

### D1 — _(Project-specific decision — e.g. score shape lock, key entity shape lock)_

Document the decision + rationale + override path. Example shape: "Score = N dimensions + risk penalty (locked). Adding another dimension requires versioning to ScoreBreakdownV2; do not mutate v1."

### D2 — _(Canonical id strategy)_

Document which field is the canonical id for the central entity + fallback strategy when the canonical id is unresolvable. Example shape: "{primary_id} primary; {fallback_hash} fallback."

### D3 — Casing rules (recommended lock)

`snake_case` at DB / yml. `camelCase` in TS variables + JSON keys. `PascalCase` for Zod schemas / ORM models / React components / event names. `kebab-case` for URL segments + queue names + filenames. Enum values are `snake_case`.

**No exceptions.** Codegen handles the snake↔camel transform; never write a manual alias.

### D4 — _(Strategy / state-machine enum lock)_

Document any business-critical enum whose values must remain stable.

### D5 — Severity = 5 levels (recommended lock)

`none` < `low` < `medium` < `high` < `deal_breaker`. Five-level ordinal. Used wherever severity / risk / impact ranking is needed.

### D6 — Confidence = 3 levels (recommended lock)

`high` | `medium` | `low`. No `very_high` / `very_low` / numeric percentages. Every AI-output Zod schema enumerates exactly these three.

### D7 — _(Currency / numeric representation if applicable)_

If the project handles money, lock the representation. Example shape: "integer minor units (cents / pence) at DB; major units float at user-facing boundaries."

## Drift Register summary

See `../DRIFT-REGISTER.md` for the active log.

| Metric | Value |
|---|---|
| Active overrides | 0 |
| Retired overrides | 0 |
| Last reviewed | _(domain researcher updates this at each audit)_ |

## Resource inventory

| Resource | Status | Owner-of-flesh-out |
|---|---|---|

> **NOTE:** Add one row per resource as it is added. Status starts at `scaffold_stub` and progresses to `draft` then `gold`. The owner-of-flesh-out is the agent that will promote it.

Stub resources are placeholder yml files marked `status: scaffold_stub`. The named owner-agent fleshes them out per `_schema.yml` v2 in their first sprint.
