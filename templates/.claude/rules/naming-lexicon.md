# Naming Lexicon Rule (auto-loaded)

This rule is loaded every session. It enforces the lexicon discipline.

## The rule

**Every domain term in this repo must originate in `lexicon/`.**

Code generates from the lexicon. The lexicon does not generate from code. There are no exceptions; overrides are tracked in `lexicon/DRIFT-REGISTER.md` with a `D-` decision id and an owner sign-off.

## What counts as a "domain term"

- Entity names
- Field names on those entities
- Enum values
- Tool / verb names — see `docs/agents/00-NAMING-CONVENTIONS.md`
- Event names (past-tense PascalCase)
- Status / severity / confidence / strategy values
- API route segments
- AI prompt template names
- Background-job queue / job names
- Notification / email / webhook template names
- Audit-log event types

## Sheet-and-tool primary verb derivation

A "sheet" (UI form / dialog / page that performs a primary action) inherits its primary verb from the **canonical creation tool** for the resource it operates on — not always `Create`. Examples:

| Resource (illustrative) | Canonical creation tool | Sheet name |
|---|---|---|
| _(Domain entity A)_ | `ImportEntityA` | `ImportEntityASheet` |
| _(Domain entity B)_ | `ParseEntityB` | `ParseEntityBSheet` |
| _(Domain entity C)_ | `LogEntityC` | `LogEntityCSheet` |
| _(Domain entity D)_ | `ProjectEntityD` | `ProjectEntityDSheet` |
| _(Domain entity E)_ | `GenerateEntityE` | (system-triggered, no user sheet) |

If a resource has multiple legitimate creation paths, the sheet inherits the verb that matches its actual flow.

## What kicks the rule in

If you would write any of the following without first checking `lexicon/`, stop:

- A new column in an ORM model
- A new field in a Zod schema
- A new enum branch in TypeScript / target language
- A new key in an API response
- A new label in the UI
- A new prompt fragment that names a domain entity
- A new background-job queue
- A new event emitted to the audit log
- A new connector mapping a third-party field

## How to add a new term

1. Identify the resource (or open `lexicon/resources/_schema.yml` if creating a new resource).
2. Edit the relevant `lexicon/resources/<resource>.yml` — add the field / enum value / tool / event.
3. If introducing a new verb, edit `docs/agents/00-NAMING-CONVENTIONS.md` (verb whitelist) and add a Drift Register entry citing the owner sign-off.
4. Run the lexicon-check CI command (must pass).
5. Run lexicon codegen (regenerates the TS + ORM artifacts).
6. Now you can use the term in code.

## How to override a locked decision

1. Open `lexicon/DRIFT-REGISTER.md`.
2. Add a row: `D-N | <date> | <override description> | <owner> | <reason> | <migration plan>`.
3. Get owner sign-off.
4. Update `lexicon/resources/README.md` decisions log if the override generalises.
5. Then change the lexicon yml. Code may follow.

## Enforcement

- **Compile-time:** ORM + Zod codegen breaks if a yml field is referenced that doesn't exist.
- **CI gate:** lexicon-check scans the source tree for hard-coded strings (enum literals, status values, severities) that don't appear in `lexicon/`. Fails the build if found.
- **Review gate:** the reviewer agent blocks PRs that add domain terms outside the lexicon flow.
- **Runtime:** Zod validation on every AI output rejects values absent from lexicon enums; rejected outputs go to the audit log's malformed bucket.

## Anti-patterns this rule prevents

- "I'll just add `cornerPlot` here and `corner_plot` there and align them later" — no, align them in `lexicon/` first.
- "I'll alias `score_total` to `totalScore` in the API layer" — no, the casing rule (D3 in README) fixes the case mapping.
- "I'll let the LLM emit free-form severity strings and normalise them" — no, AI outputs Zod-validated against lexicon enums.
- "This is a one-off internal field, no need to lexicon-ise" — every field becomes a UI label, an API key, or an LLM token eventually. Lexicon-ise it now.
