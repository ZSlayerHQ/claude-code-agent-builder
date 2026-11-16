# Default Tooling Stack — Sources + Install

The tools listed here are the operator's preferred default stack for every Claude Code project. This file lives at `docs/tool-sources.md` inside each generated project so the AI (and any new collaborator) knows where each tool lives and how to install it.

Tools fall into these install categories:

- **Machine-level CLI** — install once per developer machine; works across all projects (RTK, optional).
- **Plugin (auto-enabled)** — listed in `.claude/settings.json` `enabledPlugins`; activates on session start once this machine has it installed (see "Plugin setup on a new machine").
- **Plugin (manual install)** — must run `/plugin install <url>` once per machine before settings can enable it.
- **MCP server (project-scope)** — declared in `.mcp.json` at project root; starts on session start. Three are wired by default — see "Default MCP servers" below.
- **Per-project dependency** — installed into the project as a runtime dependency when the project needs it (Scrapling).

---

## Default MCP servers (project-scope `.mcp.json`)

Every generated project ships a `.mcp.json` at root with these 3 servers active. No API keys committed — all 3 are operator-portable.

| MCP | Command | Purpose |
|---|---|---|
| `context7` | `npx -y @upstash/context7-mcp@3` | Library / framework docs lookup (Next.js, Prisma, SQLAlchemy, MapLibre, etc.). Use during implementation when an API surface is unfamiliar. |
| `playwright` | `npx -y @playwright/mcp@latest` | Browser automation — navigate, click, type, screenshot, evaluate JS, fill forms. Use for E2E tests + visual regression + UI debugging. |
| `scrapling` | `uvx scrapling mcp` | Stealth web fetch with anti-bot bypass. 6 tools: `stealthy_fetch`, `bulk_stealthy_fetch`, `open_session`, `close_session`, `list_sessions`, `screenshot`. `uvx` auto-installs scrapling on first use (requires `uv` on PATH). |

### Adding project-specific MCPs

The tables below list servers the maintainers run across real projects (checked 2026-11-16), plus three common ones
they do not. Add a row's server when its "Offer when" fits the project, and say first which need a key and which cost
money per call.

**Where the config goes, and what goes with it**

- **A key or a machine path in the config: local scope.** `claude mcp add <key> -s local -- <launch>` keeps it in
  `~/.claude.json` under the project, so nothing secret reaches git. Each machine that runs the project adds it again.
- **Keyless and portable: the project's `.mcp.json`.** A committed `.mcp.json` takes a key only as `${VAR}` from a
  gitignored `.env`, never the value.
- **An agent reaches a server only when its `tools:` line lists `mcp__<key>`,** with the key exactly as the config
  spells it. A name no config provides is dropped without a warning.
- **A server that spends money or runs code** gets an exact version pin, deny lines in `.claude/settings.json` for
  the tools the project must not call, and an agent rule that a paid call needs the operator's go-ahead for that run.
- **`<pin>` means an exact version.** Raise it on purpose, after reading what the release adds: a new release can
  add a paid tool that the deny lines do not cover yet.
- **Launch form:** `npx -y <package>`, or `cmd /c npx -y <package>` on a Windows setup where the first does not start.

**Games and 3D**

| Key | Launch | Keys | Offer when |
|---|---|---|---|
| `ue-mcp` | `npx -y ue-mcp@<pin> <path to the .uproject>`; env `UE_EDITOR_PATH`, `UE_MCP_SERVER_MODE=in-process`, `UE_MCP_FEEDBACK_MODE=defer`, `UE_MCP_DIALOG_MODE=defer`, and `UE_MCP_PORT` when two editors run | none | The project is built in Unreal Engine. Drives the editor: levels, actors, Blueprints, play-in-editor, captures |
| `blender` | `uvx mcp-for-blender@<pin>`, env `DISABLE_TELEMETRY=true`, plus the same release's `blender_mcp.py` add-on in Blender's user `scripts/addons` (server and add-on must be one release) | none | 3D assets are inspected, measured, repaired or built by script. It runs arbitrary Python with no login, so deny its model-generation and world-generation tools unless the project wants them |
| `meshy` | `npx -y @meshy-ai/meshy-mcp-server@<pin>` | `MESHY_API_KEY` | Generated 3D models are acceptable for the asset in hand. Paid per job |
| Unity editor | `http://127.0.0.1:<port>/mcp`, served by the MCP package inside the open editor; the key is whatever the project names it | none | The project is built in Unity |

**Pictures, sound and video**

| Key | Launch | Keys | Offer when |
|---|---|---|---|
| `image-gen-mcp` | `uv --directory <clone of lansespirit/image-gen-mcp> run image-gen-mcp` | `PROVIDERS__OPENAI__API_KEY`, so local scope | Raster art is part of the work: icons, banners, interface art, textures, concept pictures. Paid per image |
| `elevenlabs` | `uvx elevenlabs-mcp@<pin>`; `ELEVENLABS_MCP_BASE_PATH` sets where files land | `ELEVENLABS_API_KEY` | Voice lines, sound effects or music are generated. Paid per call. It also has tools that clone voices and place phone calls, so deny what the project does not need |
| `nano-banana-2` | `npx -y nano-banana-2-mcp` | `GEMINI_API_KEY` | Pictures from Google's image model are wanted beside OpenAI's. Billed to the Gemini key |
| `suno` | remote: `https://api.suno.com/mcp` | Suno account sign-in | Music is generated. Check what your Suno plan allows commercially |
| `obs` | `npx -y obs-mcp@latest` | `OBS_WEBSOCKET_PASSWORD` | The project controls OBS for streaming or recording |
| `youtube` | `npx -y youtube-data-mcp-server`; `YOUTUBE_TRANSCRIPT_LANG` | `YOUTUBE_API_KEY` | Video data or transcripts are a source |

**Web and interface**

| Key | Launch | Keys | Offer when |
|---|---|---|---|
| `chrome-devtools` | `npx chrome-devtools-mcp@latest` | none | Page speed or runtime behaviour is debugged in a real Chrome |
| `next-devtools` | `npx -y next-devtools-mcp@latest` | none | The app is built on Next.js |
| `magic` | `npx -y @21st-dev/magic@latest` | `API_KEY` (21st.dev) | Interface components are generated from a description |
| `stitch` | `npx @_davideast/stitch-mcp proxy` | `STITCH_API_KEY` | Screens are designed in Google Stitch |
| `threejs-devtools` | `npx -y threejs-devtools-mcp`; env `BROWSER=none`, `DEV_PORT` | none | A three.js scene is inspected while it runs |
| `cloudflare` | remote: `https://mcp.cloudflare.com/mcp` | account sign-in | The project deploys to Cloudflare |

**Research, data and operations**

| Key | Launch | Keys | Offer when |
|---|---|---|---|
| `postgres` | `uvx postgres-mcp --access-mode=restricted` | `DATABASE_URL` | Agents query a Postgres database. Keep the restricted mode |
| `obsidian` | `uvx mcp-obsidian`; `OBSIDIAN_HOST`, `OBSIDIAN_PORT` | `OBSIDIAN_API_KEY` | The project's notes live in an Obsidian vault |
| `exa` | remote: `https://mcp.exa.ai/mcp` | Exa account key | Research needs a search engine beyond the built-in web search |
| `reddit` | `npx -y reddit-mcp-buddy` | none | Reddit threads are a research source |
| `rea` | `npx -y rea-agents@<pin> mcp`; `GHIDRA_INSTALL_DIR` and `JAVA_HOME` for native targets | none | Shipped software is taken apart. The project's own skill (`github.com/morluto/rea`) drives it |
| `ms365` | `npx -y @softeria/ms-365-mcp-server@<pin> --org-mode` | `MS365_MCP_CLIENT_ID`, `MS365_MCP_TENANT_ID` | Mail, calendar or files in Microsoft 365 are part of the work |
| `resend` | `npx -y resend-mcp` | `RESEND_API_KEY` | The project sends email through Resend |
| `cpanel` | `npx -y mcp-cpanel-api@<pin>` | `CPANEL_HOST`, `CPANEL_USER`, `CPANEL_TOKEN`, `CPANEL_PORT` | Hosting is managed through cPanel |
| `discord-admin` | `npx -y @quadslab.io/discord-mcp` | `DISCORD_TOKEN`, `DISCORD_GUILD_ID` | The project manages a Discord server |
| `github` | `npx -y @modelcontextprotocol/server-github` | `GITHUB_PERSONAL_ACCESS_TOKEN` | Structured, high-volume GitHub work only (see the note below). Not run by the maintainers |
| `firecrawl` | `npx -y firecrawl-mcp` | `FIRECRAWL_API_KEY` | Paid crawling beyond Scrapling. Not run by the maintainers |
| `tavily` | `npx -y tavily-mcp@latest` | `TAVILY_API_KEY` | A paid search API is preferred. Not run by the maintainers |

A server written for one project's own data or service stays with that project.

### GitHub: CLI by default, MCP only when structured access earns it

**Default to the `gh` CLI, not the GitHub MCP.** Every generated project already assumes `gh` for `git push`, PR creation, and the `commit-and-push` skill, so the CLI is a prerequisite the operator needs anyway — not an extra dependency. It costs **zero context budget** until invoked (runs through the Bash tool), authenticates once via `gh auth login` into the OS keychain (no PAT in any committed file), and pairs well with output-filtering wrappers. This is why the GitHub MCP is **not** in the default `.mcp.json`.

**Add the GitHub MCP (row above) only when a project does structured, high-volume GitHub work** — bulk issue triage, cross-repo PR automation, or reading issue/PR bodies as data to act on programmatically. There the structured tool calls beat parsing CLI text. Trade-offs to weigh before adding it: it loads dozens of tool schemas into **every** session's context budget (whether or not GitHub work happens that session), needs a PAT (put it in `.env` → `${GITHUB_TOKEN}`, **never** the committed `.mcp.json`), and its raw JSON responses are heavier than filtered CLI output. For occasional GitHub work, the CLI wins; for GitHub-as-a-data-source workloads, the MCP earns its place.

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
| Install | Follow the repository's README |
| Activation | Optional. When it is installed, prefix shell commands with `rtk`; `rtk init --global` writes its command catalogue into your user-level `~/.claude/CLAUDE.md`. |
| Purpose | Filters/compresses command output to reduce token consumption (60–99% savings on common dev operations). Safe pass-through if no filter matches. |

With RTK installed, the AI prefixes shell commands with `rtk`. Without it the prefix fails with "command not found", which is why the generated `CLAUDE.md` tells the AI to check for RTK first and run commands plainly when it is absent.

---

## Plugin setup on a new machine

The six default plugins are enabled in each generated `.claude/settings.json`, but a plugin loads only once this
machine knows its marketplace and has it installed. Run once per machine:

```
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin marketplace add anthropics/claude-code
claude plugin marketplace add mksglu/context-mode
claude plugin install superpowers@claude-plugins-official
claude plugin install code-review@claude-plugins-official
claude plugin install feature-dev@claude-plugins-official
claude plugin install skill-creator@claude-plugins-official
claude plugin install frontend-design@claude-code-plugins
claude plugin install context-mode@context-mode
```

Adding a marketplace that is already known is harmless.

---

## superpowers (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `superpowers@claude-plugins-official` (official Anthropic marketplace) |
| Category | Plugin (auto-enabled) |
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
| Purpose | Workflow skills: brainstorming, debugging, root-cause analysis, TDD discipline, skill-creator framework |

---

## frontend-design (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `frontend-design@claude-code-plugins` (community marketplace) |
| Category | Plugin (auto-enabled) |
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
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
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
| Purpose | Sandboxed bash output / context-window protection. Routes large tool outputs through an indexed sandbox so raw output doesn't flood the conversation context. |

---

## code-review (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `code-review@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
| Purpose | Structured code-review workflow — diff analysis, severity-tiered findings, approve / approve-with-notes / needs-fixes verdicts. |

---

## feature-dev (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `feature-dev@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
| Purpose | Feature-development workflow — architecture exploration, planning, scoped implementation. Includes its own `code-architect`, `code-explorer`, `code-reviewer` subagents. |

---

## skill-creator (Claude Code plugin)

| Field | Value |
|---|---|
| Source | `skill-creator@claude-plugins-official` |
| Category | Plugin (auto-enabled) |
| Install | Enabled in `.claude/settings.json`; installed once per machine (see "Plugin setup on a new machine") |
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
