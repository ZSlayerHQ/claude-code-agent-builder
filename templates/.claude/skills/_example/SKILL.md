---
name: example-skill
description: Use this skill when {concrete trigger condition} — e.g. operator runs `/example-skill`, or the conversation involves {specific task shape}. Replace this description with a specific activation hook; the model reads it to decide whether to load the skill automatically.
---

# Example Skill

This is a starter template. Delete this directory once you've authored a real skill, or rename `_example/` to your skill's name and replace the body.

## When to use

Concrete trigger conditions — bullet list. The more specific, the better the automatic activation:

- {Specific situation 1 — e.g. "operator asks for a commit message"}
- {Specific situation 2 — e.g. "PR description needs drafting"}
- {Specific situation 3}

If a condition is fuzzy ("when feedback feels off"), the skill won't reliably activate. Make it concrete.

## Procedure

The actionable recipe. Numbered steps, each verifiable:

1. {First step — what to read / check / gather first}
2. {Second step — the core action}
3. {Third step — verification + handoff}

Domain-specific patterns go here as bullets, not paragraphs. The model already knows general concepts — include only project-specific or non-obvious guidance.

## Inputs

What the skill expects in scope when invoked:

- `{input-1}` — e.g. file path, git ref, ticket ID
- `{input-2}` — optional context

## Output

What the skill produces. Be explicit so the caller knows what to expect:

```
{example output shape}
```

## Anti-patterns

Things this skill should NOT do, named with the rationalisation the model will use to skip the rule:

- **{Pattern}** — _"{the excuse the model will tell itself}."_ {Why the excuse fails.} {What to do instead.}

## Notes for the author

- Keep this file under ~200 lines. If it's growing past that, consider whether it should be an agent (its own context window) rather than a skill.
- Use the `skill-creator` plugin (pre-enabled in `.claude/settings.json`) to iterate — it'll catch description-activation issues before you ship.
- Inline shell execution is allowed via `` !`<command>` `` blocks — useful for context gathering at invocation time. Disabled globally if `disableSkillShellExecution: true` is set in `.claude/settings.json`.
- Test the skill by invoking it manually (`/example-skill`) AND by triggering one of the "When to use" conditions to verify automatic activation fires correctly.
