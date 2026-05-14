# Claude Code Agent Builder

A meta-agent for [Claude Code](https://claude.com/claude-code) that scaffolds disciplined, production-grade project directories — complete with a tuned `CLAUDE.md`, specialist subagents, settings, hooks, MCP config, and session-doc templates.

You point it at a new project idea; it asks 4-5 questions, proposes an agent roster, and generates the whole working tree.

```
You:  "I need a Claude Code setup for a personal-finance tracker."
Bot:  [4-5 intake questions]
Bot:  [Proposes 3-4 agents with role + tools]
You:  "Approved."
Bot:  [Generates the full directory into output/]
```

## What you get

Each generated project ships with:

- **`CLAUDE.md`** — domain-aware identity, operational principles, agent roster, file locations (~80-150 lines)
- **`.claude/agents/*.md`** — 3-5 specialist subagents, each with the right tool scope (Builders write, Auditors don't, etc.)
- **`.claude/settings.json`** — Opus 4.7 + xhigh effort + 6 default plugins (`superpowers`, `feature-dev`, `code-review`, `frontend-design`, `context-mode`, `skill-creator`) + deny list + PreCompact + PostToolUse hooks
- **`.mcp.json`** — 4 default MCP servers (`context7`, `gitnexus`, `playwright`, `scrapling` via `uvx`)
- **`.claude/hooks/`** — `pre-compact-state-write.mjs` (auto-updates STATE.md before context compaction) + `prompt-injection-scan.mjs` (scans tool-response inputs for known injection patterns)
- **`.claude/skills/`** — operator-facing README + starter `SKILL.md` template
- **`session-docs/`** — `STATE.md` / `SESSION-LOG.md` / `GOTCHAS.md` / `DECISIONS.md` / `AUDIT-CHECKLIST.md`
- **`docs/tool-sources.md`** — install URLs + activation notes for every default tool
- **`docs/research/`** — wave-based research index, populated if you opted into a research wave at intake
- **`start.bat`** — one-click session launcher with `-n "<project-name>"` so `/resume` stays readable
- **`init.sh`** — operator-customisable project setup script
- Optional: **lexicon kit** (19-layer schema-of-schemas + drift register + naming rule) for app-shaped projects with ≥5 domain entities
- Optional: **`docs/VISION.md`** for projects with mission scope bigger than v1

## Design principles

- **Four-agent ceiling.** Most projects need 3-5 agents. Anything beyond 7 needs explicit justification — benefits plateau at 4 and ~80% of multi-agent failures come from coordination overhead, not missing capability.
- **Tool scoping is the primary safety value.** Auditors and Reviewers never get `Write` or `Edit`. Builders get a curated set. Researchers get web + Context7. The roster is shaped by what each agent can *touch*, not just what it knows.
- **Positive delegation triggers.** Per Anthropic's Opus 4.7 guidelines: agent files say "Delegate to X when …" not "Avoid over-delegating." Opus 4.7 under-spawns by default; positive framing calibrates it.
- **Research-wave dispatch.** When a new project has 3+ orthogonal research territories (third-party APIs, regulatory boundaries, competitor sweeps, library evals, domain rule sets), the builder dispatches a parallel subagent wave — one subagent per territory — and synthesises into `docs/research/00-recommendations.md` before proposing the roster.
- **Lexicon discipline.** App-shaped projects get a `lexicon/resources/_schema.yml` + an auto-loaded naming rule. Code generates from the lexicon; the lexicon does not generate from code.
- **Tight outputs.** No AUP-redundant policy padding (Anthropic's system prompt already handles it). No no-op deny rules (audit your MCP tool surface first). See `references/claude-md-slimming-guide.md`.

## Quick start

You'll need [Claude Code](https://claude.com/claude-code) installed. The builder runs as a Claude Code session inside this repository.

```bash
# Clone
git clone https://github.com/ZSlayerHQ/claude-code-agent-builder.git
cd claude-code-agent-builder

# Open in Claude Code
claude --dangerously-skip-permissions -n "agent-builder"
```

Then in the session:

> "Build me a Claude Code setup for a {your project description}"

The builder will run the 4-5 intake questions, propose a roster, and on approval generate the full project tree into `output/<project-name>/`. From there you typically `cp -r output/<project-name> ../<project-name>/` to promote it to a sibling directory and start working in the new project.

## What this repo is

- **`CLAUDE.md`** — the builder's own identity + operating rules
- **`templates/`** — every starting point the builder copies into a generated project
- **`references/`** — the builder's knowledge base (15 reference docs covering Anthropic guidelines, decomposition heuristics, tool scoping, MCP design, security patterns, the slimming guide, research-wave dispatch, lexicon discipline, etc.)
- **`scripts/check-template-paths.sh`** — drift guard. Run before committing template changes — catches BAB-internal paths that would dangle in every generated project.
- **`.claude/rules/`** — auto-loaded operating rules (identity + output-format)
- **`session-docs/`** — `GOTCHAS.md` (8 real failure modes with fixes) + `AUDIT-CHECKLIST.md` (8-step honest-audit procedure)

## Modes

The builder has three operating modes:

| Mode | Trigger | Output |
|------|---------|--------|
| **Full-Suite** | "Build me a setup for X" / "New project: X" | Complete directory generated into `output/<name>/` |
| **Individual** | "Add a {researcher / auditor / reviewer} agent to {existing project}" | One agent file added to the existing roster |
| **Audit** | "Is it ready?" / "Audit this" / "Does X look solid?" | Runs `AUDIT-CHECKLIST.md` end-to-end against the artifact |

See `CLAUDE.md` for the full flow of each mode.

## Versioning

This repo follows the Claude model generation it targets. Current target: **Opus 4.7 / Sonnet 4.6 / Haiku 4.5** (May 2026 generation). When Anthropic ships a new generation, the relevant reference docs are updated and the templates pinned to the new model IDs.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution flow + scope guidance. Issues and PRs welcome — particularly:

- New agent archetype templates
- Domain-specific reference docs (compliance scaffolds, niche stacks)
- Additional default MCP server configurations
- Refinements to the research-wave dispatch pattern
- Documentation improvements

## License

[Apache-2.0](./LICENSE) — permissive, with patent grant. See [`NOTICE`](./NOTICE) for third-party attribution.

## Related

- [Anthropic — Claude Code docs](https://code.claude.com/docs)
- [Anthropic — Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic — How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)
