# Claude Code Agent Builder

A meta-agent for [Claude Code](https://claude.com/claude-code) that scaffolds disciplined, production-grade project directories — complete with a tuned `CLAUDE.md`, specialist subagents, settings, hooks, MCP config, and session-doc templates.

You point it at a new project idea; it asks a short set of intake questions, proposes an agent roster, and generates the whole working tree.

```
You:  "I need a Claude Code setup for a personal-finance tracker."
Bot:  [intake questions]
Bot:  [Proposes 3-4 agents with role + tools]
You:  "Approved."
Bot:  [Generates the full directory into output/]
```

## What you get

Each generated project ships with:

- **`CLAUDE.md`** — domain-aware identity, operational principles, agent roster, file locations (~80-150 lines)
- **`.claude/agents/*.md`** — 3-5 specialist subagents, each with the right tool scope (Builders write, Auditors don't, etc.)
- **`.claude/settings.json`** — the `opus` alias (Opus 5.5 on Claude Code ≥ 2.1.280) + pinned `xhigh` effort + 6 default plugins (`superpowers`, `feature-dev`, `code-review`, `frontend-design`, `context-mode`, `skill-creator`) + deny list + PreCompact / PostToolUse / PreToolUse / UserPromptSubmit hooks
- **`.mcp.json`** — 3 default MCP servers (`context7`, `playwright`, `scrapling` via `uvx`), with a catalogue of others the builder offers when they fit the project
- **`.claude/hooks/`** — `pre-compact-state-write.mjs` (auto-updates STATE.md before context compaction) + `prompt-injection-scan.mjs` (scans tool-response inputs for known injection patterns) + `pre-edit-gotcha-check.mjs` (surfaces matching GOTCHAS entries inline before an Edit/Write fires) + `user-prompt-gotcha-dedup-reset.mjs`
- **`.claude/skills/`** — operator-facing README + starter `SKILL.md` template + 9 default-on skills: `stale-docs-audit`, `post-compact-reload`, `session-end-update`, `security`, `search-optimization`, `commit-and-push`, `consent-cmp`, `systematic-debugging` and `test-driven-development`; plus `codex-dispatch` (independent verification via OpenAI Codex CLI) when you have the Codex CLI
- **`session-docs/`** — `STATE.md` / `SESSION-LOG.md` / `GOTCHAS.md` / `DECISIONS.md`
- **`docs/tool-sources.md`** — install URLs + activation notes for every default tool
- **`docs/research/`** — wave-based research index, populated if you opted into a research wave at intake
- **`start.bat`** + **`start.command`** — one-click session launchers (Windows; macOS and Linux) with `-n "<project-name>"` so `/resume` stays readable
- **`init.sh`** — operator-customisable project setup script
- Optional: **lexicon kit** (19-layer schema-of-schemas + drift register + naming rule) for app-shaped projects with ≥5 domain entities
- Optional: **`docs/VISION.md`** for projects with mission scope bigger than v1

## Design principles

- **Four-agent ceiling.** Most projects need 3-5 agents. Anything beyond 7 needs explicit justification — benefits plateau at 4 and ~80% of multi-agent failures come from coordination overhead, not missing capability.
- **Tool scoping is the primary safety value.** Auditors and Reviewers never get `Write` or `Edit`. Builders get a curated set. Researchers get web + Context7. The roster is shaped by what each agent can *touch*, not just what it knows.
- **Explicit delegation thresholds.** Agent files state when to delegate as a concrete condition ("when work spans 3+ independent workstreams or 10+ file reads") rather than a vague lean in either direction. This matters because the model-side calibration keeps flipping — Opus 4.6 over-spawned, 4.7/4.8 under-spawned, Opus 5 over-spawns again — and an explicit threshold survives the flip where "delegate more" or "delegate less" does not.
- **Research-wave dispatch.** When a new project has 3+ orthogonal research territories (third-party APIs, regulatory boundaries, competitor sweeps, library evals, domain rule sets), the builder dispatches a parallel subagent wave — one subagent per territory — and synthesises into `docs/research/00-recommendations.md` before proposing the roster.
- **Lexicon discipline.** App-shaped projects get a `lexicon/resources/_schema.yml` + an auto-loaded naming rule. Code generates from the lexicon; the lexicon does not generate from code.
- **Tight outputs.** No AUP-redundant policy padding (Anthropic's system prompt already handles it). No no-op deny rules (audit your MCP tool surface first). See `references/claude-md-slimming-guide.md`.

## Quick start

You'll need [Claude Code](https://claude.com/claude-code) installed. The builder runs as a Claude Code session inside this repository.

**Prerequisites:** Claude Code 2.1.293 or later (the templates use the `opus` and `haiku` aliases), Node.js 20+ (the hooks and the `npx` MCP servers), [`uv`](https://docs.astral.sh/uv/) (the Scrapling MCP server), and on Windows, Git for Windows. The default Playwright and Scrapling servers download browser binaries the first time they are used. The six default plugins need their marketplaces added once per machine: the commands are in `references/tool-sources.md` under "Plugin setup on a new machine". The [`gh`](https://cli.github.com/) CLI, [RTK](https://github.com/rtk-ai/rtk) and the OpenAI Codex CLI are optional.

**Cost of the defaults:** generated projects use the `opus` model alias at `xhigh` effort, which is thorough and expensive. Tell the builder at intake if you want a cheaper default, for example `sonnet` at `high`.

```bash
# Clone
git clone https://github.com/ZSlayerHQ/claude-code-agent-builder.git
cd claude-code-agent-builder

# Open in Claude Code
claude --dangerously-skip-permissions -n "agent-builder"
```

`--dangerously-skip-permissions` lets the builder write files without asking each time. Leave it off to approve each action.

Then in the session:

> "Build me a Claude Code setup for a {your project description}"

The builder will run the intake questions, propose a roster, and on approval generate the full project tree into `output/<project-name>/`. From there you typically `cp -r output/<project-name> ../<project-name>/` to promote it to a sibling directory, run `git init` in it (the commit and audit skills expect a repository), and start working in the new project.

## What this repo is

- **`CLAUDE.md`** — the builder's own identity + operating rules
- **`templates/`** — every starting point the builder copies into a generated project
- **`references/`** — the builder's knowledge base (18 reference docs covering Anthropic and OpenAI model guidelines, decomposition heuristics, tool scoping, MCP design, security patterns, the slimming guide, research-wave dispatch, lexicon discipline, etc.)
- **`scripts/check-template-paths.sh`** — drift guard. Run before committing template changes — catches agent-builder-internal paths that would dangle in every generated project.
- **`.claude/rules/`** — auto-loaded operating rules (identity + output-format)
- **`session-docs/`** — `GOTCHAS.md` (23 real failure modes with fixes) + `AUDIT-CHECKLIST.md` (a step-by-step honest-audit procedure)

## Modes

The builder has three operating modes:

| Mode | Trigger | Output |
|------|---------|--------|
| **Full-Suite** | "Build me a setup for X" / "New project: X" | Complete directory generated into `output/<name>/` |
| **Individual** | "Add a {researcher / auditor / reviewer} agent to {existing project}" | One agent file added to the existing roster |
| **Audit** | "Is it ready?" / "Audit this" / "Does X look solid?" | Runs `AUDIT-CHECKLIST.md` end-to-end against the artifact |

See `CLAUDE.md` for the full flow of each mode.

## Versioning

This repo follows the Claude model generation it targets. Current target: **Opus 5.5** (with Fable 5.2 / Sonnet 5.5 / Haiku 5.5 as the surrounding current generation). Templates use the `opus` alias rather than a pinned ID, so generated projects move to a new Opus with a Claude Code update; effort stays pinned at `xhigh` because each new model can ship a different default. When Anthropic ships a new generation, the relevant reference docs are updated.

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
