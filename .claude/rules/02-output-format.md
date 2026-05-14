# Output Format Standards

## Agent File Structure

Every generated agent file follows this exact section order:

1. **YAML frontmatter** (required — 6 fields)
   ```yaml
   ---
   name: Title Case Agent Name
   description: One sentence (soft target ≤120 chars), specific enough for orchestrator routing.
   invocation: When to delegate to this agent — concrete trigger conditions.
   model: claude-opus-4-7
   effort: xhigh
   tools: [Scoped tool list per archetype]
   ---
   ```

   `model` + `effort` defaults are calibrated for Opus 4.7 agentic Claude Code use cases. Override per-agent only when the project has a specific reason (latency-critical hot paths can downgrade to `model: claude-haiku-4-5-20251001` + `effort: medium`).

2. **# Agent Title** — matches the `name` field

3. **## Role** — 1-2 sentences. What this agent does and what domain it owns.

4. **## When to Invoke** — bullet list of concrete trigger conditions (not vague "when needed").

5. **## Tools** — table with | Tool | Usage | columns. Each tool gets a specific usage description.

6. **## Procedure** — domain-specific patterns as bold-prefixed single-line bullets. No lectures — the model already knows general concepts. Include only project-specific or domain-specific guidance. Renamed from `## Key Patterns` 2026-05-11 per community convention (Hermes-agent uses `Procedure`; obra/superpowers uses 6-section structure with `Procedure` between `When to Use` and `Pitfalls`).

7. **## Output Format** — what this agent produces. Table, code block, or numbered list of deliverables.

8. **## Verification** — concrete checklist of things to verify before claiming work is done.

9. **## Handoff Triggers** — table with | Condition | Route To | columns. When does this agent pass work to another agent?

10. **## Anti-Patterns** — 3-6 concrete things this agent should avoid. Each entry should NAME THE RATIONALISATION the agent will use to skip the rule, in italics. Format: `**{Pattern}** — _"{the excuse the model will tell itself}."_ {one-sentence slap explaining why the excuse fails}. {what to do instead}`. Pattern lifted from obra/superpowers anti-pattern entries — anti-patterns that pre-empt the specific excuse are markedly more effective than generic "don't do X" framings.

## Agent File Targets

- **Line count:** 60-80 lines per agent file. Dense, not verbose.
- **No general knowledge lectures.** Don't explain what HIPAA is, what REST means, or what SQL injection is. The model knows. Include only actionable rules and domain-specific patterns.
- **Concrete over abstract.** "Hash passwords with bcrypt, minimum 12 rounds" beats "Use appropriate password hashing."

## CLAUDE.md Structure (for output projects)

Every generated CLAUDE.md follows this section order:

1. **# Project Name** — the project name
2. **## Identity** — who Claude is for this project (domain, expertise, personality)
3. **## Domain Constraints** — compliance, regulatory, industry-specific rules (if any)
4. **## Agent Roster** — table of specialist agents with name, archetype, and 1-line purpose
5. **## Operational Principles** — 5-8 project-specific rules
6. **## Session Lifecycle** — read session-docs at start, update at end
7. **## File Locations** — where source code, tests, docs, config, database live

## settings.json Adaptation

- `defaultMode`: `bypassPermissions` for high autonomy, remove for confirmation mode
- `deny` list: always include the 5 standard Bash safety rules + the 3 Read rules for .env/secrets. Add domain-specific deny rules (e.g., `Read(./patient-data/**)` for medical apps).
- `enabledPlugins`: default to the 6-plugin set per `templates/settings-template.json` (`superpowers@claude-plugins-official`, `code-review@claude-plugins-official`, `feature-dev@claude-plugins-official`, `frontend-design@claude-code-plugins`, `context-mode@context-mode`, `skill-creator@claude-plugins-official`). The marketplaces vary per plugin and must match the exact `@source` reported by `/plugin list` on a machine that has them installed — don't generalise to a single marketplace. `interface-design` (from `https://github.com/Dammyjay93/interface-design`) is documented in `references/tool-sources.md` for manual install only. Context7 is an MCP server, not a plugin — declare it in `.mcp.json`, never in `enabledPlugins`.
- `env`: include `CLAUDE_CODE_MAX_OUTPUT_TOKENS: "64000"` and `ENABLE_PROMPT_CACHING_1H: "1"` (the latter opts back into 1h prompt cache TTL — Anthropic silently dropped the default to 5min on 2026-03-06; Claude Code 2.1.108+ ships the env var as the opt-in escape hatch).
- `hooks.PreCompact`: every generated project includes a PreCompact hook wired to `node $CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact-state-write.mjs` with both `manual` and `auto` matchers. The hook auto-updates `session-docs/STATE.md` with current git state (branch, last commit, dirty file count, recent file changes) and injects an `additionalContext` block reminding the AI to update the narrative sections of STATE.md. Required — without it STATE.md goes stale (per upgrade #7 INTEGRATION-NOTES).
- **NOT in settings.json `env`:** `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` belongs in `start.bat` as a `set` before the `claude` invocation, NOT in `.claude/settings.json` `env`. The settings.json `env` block only feeds hook subprocesses; it doesn't override Claude Code's own auto-compact behaviour. The generated `start.bat` includes `set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70` pre-launch.
- `hooks.PostToolUse`: every generated project includes a PostToolUse hook wired to `node $CLAUDE_PROJECT_DIR/.claude/hooks/prompt-injection-scan.mjs` with matcher `WebFetch|WebSearch|mcp__.*__(fetch|get|stealthy_fetch|bulk_stealthy_fetch|crawl|search)`. Hook scans INPUTS to the model (tool responses), not model outputs — see `references/security-patterns.md` for the threat catalogue and tuning. Tune the matcher per-project if the project uses additional external-content fetch tools (e.g. project-specific MCP browsers).

## start.bat

Every output project includes:
```bat
@echo off
cd /d "%~dp0"
claude --dangerously-skip-permissions -n "<project-name>"
```

The `-n "<project-name>"` flag is mandatory (per the agent builder's output rules) — without it, `/resume` and terminal titles render as generic UUIDs instead of a readable project name.

## Manifest Entry Format

After generating, add to `manifest.md`:
```markdown
## {project-name} ({date})
**Domain:** {one-line domain description}
**Constraints:** {compliance requirements or "None"}
**Agents:**
- {agent-name}.md — {archetype} — {one-line purpose}
```

If lexicon scaffold was included (step 4a), append:
```markdown
**Lexicon scaffold:** `_schema.yml` v2 + README + empty `DRIFT-REGISTER` + `naming-lexicon` rule + `00-NAMING-CONVENTIONS` doc. Resources + enums seeded empty (project-specific authoring deferred to first session).
```

If VISION.md was included (step 4b), append:
```markdown
**Vision document:** `docs/VISION.md` — {one-line summary of the mission}
```

## Lexicon Kit Section (when scope includes lexicon discipline)

Every generated lexicon scaffold ships these files (copied verbatim from `templates/`):

- `lexicon/resources/_schema.yml` — schema-of-schemas (v2; 19 required layers + 3 optional cross-cuts)
- `lexicon/resources/README.md` — derivation table + decisions log structure (D1-D7 placeholders)
- `lexicon/DRIFT-REGISTER.md` — empty drift log with format documented
- `.claude/rules/naming-lexicon.md` — auto-loaded enforcement rule
- `docs/agents/00-NAMING-CONVENTIONS.md` — verb whitelist (15-verb starter) + casing rules + extension policy
- Empty `lexicon/resources/` (with `.gitkeep`) + `lexicon/enums/` (with `.gitkeep`) for the operator to author project-specific yml in the first session.

Reference doc: `references/lexicon-discipline-guide.md` (when to use, how to integrate with codegen, how to assign ownership to a researcher agent).

## VISION.md Structure (when in scope)

When `Full-Suite Mode` step 4b chose VISION.md, the generated file follows this section order (12 items including the title):

1. **# {Project Name} — Vision** — title
2. **## Mission** — one-sentence mission + paragraph
3. **## The bar** — explicit benchmark + differentiator
4. **## Who it serves** — primary v1 user + eventual users + per-user-state-awareness mandate
5. **## Scope** — v1 focus + architectural scope + out-of-scope
6. **## The capability surface** — the signal stack / capability categories the project covers (with sub-bullets for each)
7. **## {Per-context} awareness** — context dimensions that branch recommendations (skip if not applicable)
8. **## The framing** — optimisation priority order
9. **## What {project} is NOT** — explicit non-goals
10. **## The agent's cognitive frame** — capability ambition paired with operational discipline
11. **## Success metric** — v1 + v2+ + platform-at-scale
12. **## Bar-raising mandate** — continuous-improvement axes

**Length target:** 150-220 lines. Above = padding; below = under-specified.

**Tone:** plain English. No hype. Every aspirational claim paired with a concrete artifact or metric.

Reference template: `templates/vision-template.md`. The template itself ships the structure; any generated project that opted into VISION.md becomes a worked example.
