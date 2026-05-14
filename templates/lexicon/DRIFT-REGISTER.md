# Drift Register

Every override of a locked decision (D1–DN in `lexicon/resources/README.md`), every new verb beyond the whitelist in `docs/agents/00-NAMING-CONVENTIONS.md`, and every lexicon term that intentionally diverges from the schema-of-schemas (`lexicon/resources/_schema.yml`) is logged here.

The reviewer agent verifies on every PR that any drift in code is matched by an entry below. **No drift entry → no merge.**

## Entry format

```markdown
### D-N — <date YYYY-MM-DD> — <short title>

- **Type:** decision_override | verb_addition | schema_extension | enum_extension | other
- **Reference:** which locked decision (D1–DN) or which verb / enum / schema layer
- **Description:** what changed, in one sentence
- **Why no existing fit:** explicit reasoning — why couldn't the existing terms cover this case
- **Owner sign-off:** <operator name> — `lex(drift): D-N approved — <reason>` (commit SHA: `<sha>`)
- **Migration plan:** if this affects existing data / consumers, how do we get there
- **Reviewer note:** any standing condition the reviewer should enforce going forward
```

## Active overrides

_(empty — no drift recorded yet)_

## Retired overrides

_(entries are never deleted; if an override is rolled back, append a "Rolled back" note with date and reason rather than removing the entry)_

## Statistics

| Metric | Value |
|---|---|
| Active overrides | 0 |
| Retired overrides | 0 |
| Verb whitelist size | _(see `docs/agents/00-NAMING-CONVENTIONS.md`)_ |
| Locked decisions | _(see `lexicon/resources/README.md` decisions log)_ |

## Audit cadence

The domain researcher (or designated owner) reviews this file every 14 days during a working stretch. Each review updates the Statistics block and confirms (or amends) Active overrides.
