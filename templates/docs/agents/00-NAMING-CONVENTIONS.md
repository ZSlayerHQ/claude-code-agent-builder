# Naming Conventions

Authoritative reference for verbs, casing, and term shape. Paired with `.claude/rules/naming-lexicon.md` (auto-loaded enforcement) and `lexicon/resources/_schema.yml` (resource shape).

---

## 1. Casing rules (recommended lock — D3 in `lexicon/resources/README.md`)

| Surface | Casing | Example |
|---|---|---|
| Database column / table | `snake_case` | `created_at`, `score_breakdown` |
| ORM model name | `PascalCase` | `User`, `ScoreBreakdown` |
| TypeScript variable / property | `camelCase` | `createdAt`, `scoreBreakdown` |
| JSON API key (request + response) | `camelCase` | `"createdAt": "..."` |
| Zod schema | `PascalCase` + `Schema` suffix | `UserSchema`, `ScoreBreakdownSchema` |
| Enum type name | `PascalCase` | `Severity`, `Confidence` |
| Enum value | `snake_case` | `deal_breaker`, `high` |
| Event name | `PascalCase` past-tense | `UserCreated`, `RecordEmbedded` |
| Background-job queue name | `kebab-case` | `score-record`, `enrich-record` |
| URL path segment | `kebab-case` plural | `/api/users`, `/api/score-breakdowns` |
| File / directory | `kebab-case` (files) or `snake_case` (lexicon yml) | `score-breakdown.ts`, `lexicon/resources/score_breakdown.yml` |
| React component | `PascalCase` | `<UserCard />`, `<ScoreBadge />` |

No exceptions without a Drift Register entry.

---

## 2. Verb whitelist (starter — 15 verbs)

A verb is permitted in tool names, sheet names, command names, and method names only if it appears here. Adding a verb requires:

1. A Drift Register entry citing the owner sign-off.
2. An update to this file.
3. Justification: why no existing verb fits.

| # | Verb | Meaning | Example tool |
|---|---|---|---|
| 1 | `Create` | Persist a new record from explicit user input | `CreateUser` |
| 2 | `Update` | Mutate an existing record | `UpdateUser` |
| 3 | `Delete` | Remove a record (soft or hard depending on resource policy) | `DeleteUser` |
| 4 | `Get` | Retrieve a single record by id | `GetUser` |
| 5 | `List` | Retrieve a paginated set | `ListUsers` |
| 6 | `Search` | Full-text or filtered query | `SearchUsers` |
| 7 | `Find` | Lookup by canonical id | `FindUserByEmail` |
| 8 | `Import` | Ingest from external source | `ImportRecord` |
| 9 | `Parse` | Transform raw text/HTML into structured fields | `ParseInput` |
| 10 | `Resolve` | Standardise + canonicalise | `ResolveAddress` |
| 11 | `Enrich` | Attach external data to an existing record | `EnrichRecord` |
| 12 | `Refresh` | Re-fetch + re-store stale enrichment | `RefreshRecord` |
| 13 | `Generate` | LLM-produced output | `GenerateMemo` |
| 14 | `Validate` | Schema or rule check; never a mutation | `ValidateInput` |
| 15 | `Send` | Outbound communication | `SendNotification` |

**Reserved candidates (require sign-off before promotion to whitelist):**
`Score`, `Reassess`, `Estimate`, `Project`, `Approve`, `Reject`, `Watchlist`, `Archive`, `Detect`, `Audit`, `Snapshot`, `Replay`, `Geocode`. Add per project as needed via Drift Register.

---

## 3. Sheet-name derivation

Sheet (UI form / dialog / page that performs a primary action) name = `<CanonicalVerb><Resource>Sheet`.

The canonical verb is the one declared in the resource's `tools.canonical_create` field in `lexicon/resources/<resource>.yml`. Not every resource uses `Create`:

| Resource (illustrative) | `tools.canonical_create` | Sheet |
|---|---|---|
| _(Manually-entered entity)_ | `CreateEntity` | `CreateEntitySheet` |
| _(URL/text-imported entity)_ | `ImportEntity` | `ImportEntitySheet` |
| _(Parsed-from-raw entity)_ | `ParseEntity` | `ParseEntitySheet` |
| _(Multi-scenario projection)_ | `ProjectEntity` | `ProjectEntitySheet` |
| _(LLM-generated artifact)_ | `GenerateEntity` | (system-triggered, no user sheet) |

If a resource has multiple legitimate creation paths, the sheet inherits the verb of the actual flow.

---

## 4. Event-name derivation

Past-tense PascalCase, formed from the canonical mutation tool:

| Tool | Event |
|---|---|
| `CreateRecord` | `RecordCreated` |
| `UpdateRecord` | `RecordUpdated` |
| `DeleteRecord` | `RecordDeleted` |
| `ImportRecord` | `RecordImported` |
| `ScoreRecord` | `RecordScored` |
| `GenerateMemo` | `MemoGenerated` |

The `_schema.yml` `derived_emitter` field captures the tool→event mapping per resource. CI verifies every tool has either a declared emitter or an explicit `emits: []` (no event).

---

## 5. Extension policy

To add a new verb, new severity, new strategy, new enum value, or any locked-decision override:

1. Open `lexicon/DRIFT-REGISTER.md`.
2. Append a row with: id (`D-N`), date, term, why-no-existing-fit, owner sign-off, migration plan.
3. Owner signs off in commit message: `lex(drift): D-N approved — <reason>`.
4. Update this file (verbs) or `lexicon/resources/_schema.yml` (schema layers) or `lexicon/enums/<enum>.yml` (enum values).
5. Run lexicon-check (must pass). Run lexicon codegen. Commit.
6. The reviewer verifies the Drift Register entry on the merge gate.

No drift entry → no merge. The reviewer doesn't accept "I'll add it later."
