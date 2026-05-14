# Default Tooling Stack — Sources + Install

The tools listed here are the operator's preferred default stack for every Claude Code project. This file lives at `docs/tool-sources.md` inside each generated project so the AI (and any new collaborator) knows where each tool lives and how to install it.

Tools fall into four install categories:

- **Machine-level CLI** — install once per developer machine; works across all projects (RTK).
- **Plugin (auto-enabled)** — listed in `.claude/settings.json` `enabledPlugins`; activates on session start.
- **Plugin (manual install)** — must run `/plugin install <url>` once per machine before settings can enable it.
- **MCP server (project-scope)** — declared in `.mcp.json` at project root; starts on session start. Four are wired by default — see "Default MCP servers" below.
- **Per-project dependency** — installed into the project as a runtime dependency when the project needs it (Scrapling).

---

## Default MCP servers (project-scope `.mcp.json`)

Every generated project ships a `.mcp.json` at root with these 4 servers active. No API keys committed — all 4 are operator-portable.

| MCP | Command | Purpose |
|---|---|---|
| `context7` | `npx -y @upstash/context7-mcp@latest` | Library / framework docs lookup (Next.js, Prisma, SQLAlchemy, MapLibre, etc.). Use during implementation when an API surface is unfamiliar. |
| `gitnexus` | `npx -y gitnexus@latest` | Code intelligence — `route_map`, `impact`, `tool_map`, dependency graph, change-impact analysis. Use during refactors + reviews to find dependents two files away. |
| `playwright` | `npx -y @playwright/mcp@latest` | Browser automation — navigate, click, type, screenshot, evaluate JS, fill forms. Use for E2E tests + visual regression + UI debugging. |
| `scrapling` | `uvx scrapling mcp` | Stealth web fetch with anti-bot bypass. 6 tools: `stealthy_fetch`, `bulk_stealthy_fetch`, `open_session`, `close_session`, `list_sessions`, `screenshot`. `uvx` auto-installs scrapling on first use (requires `uv` on PATH). |

### Adding project-specific MCPs

Append to `mcpServers` in `.mcp.json` as needed. Common additions and their configs:

| Use case | MCP block |
|---|---|
| Screen capture (operator's local-patched build only — not portable to collaborators) | `"screen-capture": { "type": "stdio", "command": "node", "args": ["<path-to-screen-capture-mcp/dist/index.js>"], "env": {} }` |
| Postgres queries | `"postgres": { "type": "stdio", "command": "uvx", "args": ["postgres-mcp", "--access-mode=restricted"], "env": { "DATABASE_URL": "${DATABASE_URL}" } }` |
| Obsidian vault integration | `"obsidian": { "type": "stdio", "command": "npx", "args": ["-y", "@markuspfundstein/mcp-obsidian@latest"], "env": { "OBSIDIAN_API_KEY": "${OBSIDIAN_API_KEY}" } }` |
| Firecrawl (paid web fetch) | `"firecrawl": { "type": "stdio", "command": "npx", "args": ["-y", "firecrawl-mcp"], "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" } }` |
| Tavily (search) | `"tavily": { "type": "stdio", "command": "npx", "args": ["-y", "tavily-mcp@latest"], "env": { "TAVILY_API_KEY": "${TAVILY_API_KEY}" } }` |
| Discord admin | `"discord-admin": { "command": "cmd", "args": ["/c", "npx", "-y", "@quadslab.io/discord-mcp"], "env": { "DISCORD_TOKEN": "${DISCORD_TOKEN}", "DISCORD_GUILD_ID": "${DISCORD_GUILD_ID}" } }` |
| YouTube data | `"youtube": { "command": "cmd", "args": ["/c", "npx", "-y", "youtube-mcp-server"], "env": { "YOUTUBE_API_KEY": "${YOUTUBE_API_KEY}" } }` |
| Reddit search | `"reddit": { "command": "cmd", "args": ["/c", "npx", "-y", "reddit-mcp-buddy"] }` |

Env vars come from `.env` (gitignored) — never commit secrets to `.mcp.json`. See `references/mcp-implementation-patterns.md` for deeper guidance on per-project MCP design.

---

## Project `.gitignore` stack snippets

The generated `.gitignore` ships with universal entries only (secrets, Claude Code per-user, OS cruft, IDE, logs, test artifacts, archives, OneDrive metadata, research scratch). Append the snippets below that match the project's tech stack. Snippets are additive; pick the ones that apply.

### Node / npm / pnpm / yarn

```
# --- Node / npm / pnpm / yarn ------------------------------------------------
node_modules/
.pnpm-store/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.npm/
.yarn/cache/
.yarn/install-state.gz
```

### Python / pip / poetry / uv

```
# --- Python ------------------------------------------------------------------
__pycache__/
*.py[cod]
*$py.class
.Python
.venv/
venv/
env/
.pytest_cache/
.mypy_cache/
.ruff_cache/
.pytype/
.tox/
.coverage
.coverage.*
htmlcov/
*.egg-info/
dist/
build/
```

### Rust / cargo

```
# --- Rust --------------------------------------------------------------------
target/
# Keep Cargo.lock for binary crates; drop the next line. Library crates: keep ignored.
Cargo.lock
```

### Go

```
# --- Go ----------------------------------------------------------------------
*.exe
*.exe~
*.test
*.out
vendor/
```

### Web frameworks (Next.js / Nuxt / SvelteKit / Astro / etc.)

```
# --- Web frameworks ----------------------------------------------------------
.next/
.nuxt/
.svelte-kit/
out/
.output/
.cache/
.parcel-cache/
*.tsbuildinfo
.eslintcache
```

### Docker

```
# --- Docker ------------------------------------------------------------------
.docker/
docker-compose.override.yml
```

### Local databases (only if the project uses file-based DBs)

```
# --- Databases (local only — keep migrations) --------------------------------
# Comment out if you intentionally commit a seed DB.
*.sqlite
*.sqlite3
*.db
*.db-journal
```

### Authoring guidance

- Append only the snippets that match the stack. Empty `.venv/` blocks in a pure-JS project waste reader attention.
- Each snippet's leading `# --- <name>` divider matches the universal template's style — keep them so future audits can spot misplaced entries.
- If the project has a build tool not listed here (Bun, Deno, Zig, etc.), add the section here first so future generated projects inherit it.

---

## RTK — Rust Token Killer

| Field | Value |
|---|---|
| Source | https://github.com/rtk-ai/rtk |
| Category | Machine-level CLI |
| Install | Follow repo README; usually `cargo install rtk` or similar |
| Activation | Use the `rtk` prefix on every shell command. See user-level `~/.claude/CLAUDE.md` for the full command catalogue (build, test, git, gh, files, etc.). |
| Purpose | Filters/compresses command output to reduce token consumption (60–99% savings on common dev operations). Safe pass-through if no filter matches. |

The AI should prefix every command with `rtk` per the global CLAUDE.md pattern. If `rtk` isn't on the user's machine, commands fall through cleanly — but you lose the token savings.

---

## superpowers (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `superpowers@claude-plugins-official` (official Anthropic marketplace) |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | Workflow skills: brainstorming, debugging, root-cause analysis, TDD discipline, skill-creator framework |

---

## frontend-design (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `frontend-design@claude-code-plugins` (community marketplace) |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | UI design helpers: component generation, design-system scaffolds, layout reasoning. |

---

## interface-design (Claude Code plugin)

| Field | Value |
|---|---|
| Source | https://github.com/Dammyjay93/interface-design |
| Category | Plugin (manual install) |
| Install | Run `/plugin install https://github.com/Dammyjay93/interface-design` once per machine, then add the resulting `interface-design@<marketplace>` entry to `enabledPlugins`. The exact marketplace name is reported back by the install command. |
| Purpose | Companion to `frontend-design` — interface-level layout, micro-interaction, and motion patterns. |

This one is NOT auto-enabled because GitHub-hosted plugins need a manual install step before settings.json can reference them. After install, edit settings.json to add the entry the install command reported.

---

## context-mode (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `context-mode@context-mode` (self-named marketplace) |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | Sandboxed bash output / context-window protection. Routes large tool outputs through an indexed sandbox so raw output doesn't flood the conversation context. |

---

## code-review (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `code-review@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | Structured code-review workflow — diff analysis, severity-tiered findings, approve / approve-with-notes / needs-fixes verdicts. |

---

## feature-dev (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `feature-dev@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | Feature-development workflow — architecture exploration, planning, scoped implementation. Includes its own `code-architect`, `code-explorer`, `code-reviewer` subagents. |

---

## skill-creator (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `skill-creator@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Pre-enabled in `.claude/settings.json` — no manual step |
| Purpose | Authoring custom Claude Code skills (the `.claude/skills/<name>/SKILL.md` files that get loaded per session). |

---

## Scrapling — stealth-capable scraping (Python)

| Field | Value |
|---|---|
| Source | https://github.com/D4Vinci/Scrapling |
| Category | Per-project dependency (opt-in) |
| Install | Only when a project needs lawful web scraping. Set up as a Python sidecar: `uv pip install scrapling` (or similar) inside `scrapling-svc/` with its own Dockerfile + thin HTTP API the main app calls. |
| Activation | Project-by-project. Builders + data-connector agents wire it in only when a research / data-collection use case exists. |
| Purpose | Stealth web fetching for sites with Cloudflare / anti-bot defences. Defaults to stealth via `uvx scrapling mcp`. |

---

## Pulling latest versions

For plugins, Claude Code's plugin marketplace handles updates — they refresh on session start when `autoUpdatesChannel: "latest"` is in settings.json (the default in the agent builder's settings template).

For RTK and Scrapling (non-plugin), follow each repo's release tags or update via the package manager (cargo / pip).

For the GitHub-hosted interface-design plugin, re-run `/plugin install https://github.com/Dammyjay93/interface-design` to pull the latest.
