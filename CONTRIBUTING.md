# Contributing to claude-code-agent-builder

Thanks for considering a contribution. This doc covers the scope, mechanics, and quality bar.

## Scope — what kinds of contributions land cleanly

**Welcome:**

- **New agent archetype templates** under `templates/agents/` — e.g. a `migration-specialist.md`, a `compliance-auditor.md`, a `prompt-engineer.md`. Match the existing structure (6-field frontmatter, the section order documented in `.claude/rules/02-output-format.md`).
- **Domain-specific reference docs** under `references/` — e.g. a HIPAA scaffold guide, a Rust agent design guide, a Phoenix LiveView project profile. These help the builder make better decisions for that domain.
- **Default MCP server configurations** — additions to `templates/mcp.json` or copy-paste snippets in `references/tool-sources.md` for MCPs that materially improve agent capability (firecrawl, tavily, postgres, obsidian, etc.).
- **Refinements to existing patterns** — the research-wave dispatch heuristics, the lexicon kit, the slimming-guide principles. PRs that improve clarity, correctness, or alignment with the latest Anthropic guidelines.
- **Bug fixes** — drift-guard false positives, broken cross-references, stale model IDs, template-output bugs that ship to generated projects.
- **Documentation** — tightening prose, adding worked examples, fixing typos, improving the README.

**Out of scope (will likely be declined):**

- **Application code.** This repo produces Claude Code configuration, not application code. PRs adding Python / JavaScript / Rust runtime code don't fit.
- **Personal forks of the agent roster.** The builder generates *your* agents; it doesn't ship its own. Roster customisation belongs in `output/` (generated) or your own fork.
- **AUP-redundant policy padding.** If a rule restates a behaviour already baked into Claude's system prompt (refusal of harmful requests, secrets handling, copyright respect), it adds tokens without changing behaviour. See `references/claude-md-slimming-guide.md`.
- **No-op deny rules.** Every entry in `permissions.deny` must reference a tool that actually exists. Audit the MCP tool surface before adding.

## Mechanics

1. **Fork** the repo on GitHub.
2. **Clone** your fork locally.
3. **Branch** from `main`: `git checkout -b <short-description>`.
4. **Make changes.** For template changes, run `bash scripts/check-template-paths.sh` before committing — it catches paths that would dangle in generated projects.
5. **Test with a real generation.** If your change affects template or generation logic, run a smoke-test: open this repo in Claude Code, ask for a small Full-Suite generation, verify the output is correct.
6. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/) prefixes: `feat:` / `fix:` / `docs:` / `refactor:` / `chore:`.
7. **PR** against `main` with a clear summary + test plan.

## Quality bar

- **Templates ship to every generated project.** A typo in `templates/claude-md-template.md` propagates to every project the builder creates after merge. Read your changes twice.
- **Reference docs are the builder's knowledge base.** Inaccurate or stale references produce inaccurate roster decisions. Cite sources (especially for Anthropic-specific claims).
- **No personal-context citations.** Avoid hardcoding personal names, organisation names, project names, or local paths in templates or references. The agent builder is meant to scaffold for *anyone*; replace concrete identifiers with abstract placeholders ("the project", "the operator", `{primary_id}`).
- **British English is conventional** for the agent-builder's own docs and prose (you'll see `-ise` / `-our` throughout). PRs in American English are accepted; we don't reject on spelling.

## Drift guard

Before any PR that touches `templates/`:

```bash
bash scripts/check-template-paths.sh
```

The script must exit 0. If it doesn't, it's flagging a reference inside `templates/` that resolves inside this repo but not inside generated projects — fix by rephrasing the citation to be self-contained.

## Issue templates

For bug reports + feature requests, please use the templates under `.github/ISSUE_TEMPLATE/`. They prompt for the information needed to triage quickly.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Licence

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](./LICENSE), the same licence as the rest of the project. This includes an explicit patent grant — see `LICENSE` § 3 for details.

## Questions

Open a GitHub Discussion or an issue with the `question` label. PRs are reviewed on a best-effort basis.
