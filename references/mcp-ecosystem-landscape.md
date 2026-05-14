# MCP Ecosystem Landscape Reference

What exists in the MCP ecosystem as of May 2026: official reference servers, top community/vendor servers, discovery directories, and the adjacent agent-management/launcher tools that often accompany MCP-heavy workflows. Use this to avoid building what already exists, and to reference patterns that have proven out in production.

For *design* of a new server see `mcp-server-design-guide.md`. For *implementation* details see `mcp-implementation-patterns.md`.

---

## 1. Official MCP organisation and reference servers

### 1.1 The umbrella

[`github.com/modelcontextprotocol`](https://github.com/modelcontextprotocol) — Anthropic-stewarded GitHub org. Houses:

| Repo | Purpose | Stars |
|---|---|---|
| [`servers`](https://github.com/modelcontextprotocol/servers) | Reference server implementations | **85.3k** |
| [`typescript-sdk`](https://github.com/modelcontextprotocol/typescript-sdk) | Official TS SDK (clients + servers + middleware) | **12.4k** |
| `python-sdk` | Official Python SDK | 14k+ |
| `modelcontextprotocol` | Specification repo | 5k+ |
| `inspector` | UI for poking at servers during dev | 2k+ |

### 1.2 Reference servers (read these to learn idioms)

In `modelcontextprotocol/servers/src/`:

| Server | What it demonstrates | When to study |
|---|---|---|
| **`everything`** | Test/reference server with prompts, resources, AND tools | Anytime — shows the full surface |
| **`fetch`** | Web content fetching + HTML→markdown conversion | Building a server that calls external APIs |
| **`filesystem`** | Secure file operations with configurable access controls | Path allowlisting, atomic writes |
| **`git`** | Read/search/manipulate Git repositories | Wrapping CLI tools safely (no shell concat) |
| **`memory`** | Knowledge-graph-based persistent memory | Servers that maintain state across sessions |
| **`sequential-thinking`** | Dynamic problem-solving prompts | Prompt-server patterns (vs tool-server) |
| **`time`** | Time / timezone conversion | Tiny, very clean — good first read |

These are the canonical implementations. When in doubt about an idiom, grep these first.

---

## 2. Top community / vendor servers

Star counts and prominence as of May 2026.

### 2.1 Vendor / enterprise

| Server | Stars / signal | Notes |
|---|---|---|
| **AWS MCP servers** ([`awslabs/mcp`](https://github.com/awslabs/mcp)) | 9k stars | Multiple servers (bedrock-kb-retrieval, nova-canvas, etc.). Their `DESIGN_GUIDELINES.md` is the most-cited single doc in the ecosystem. |
| **GitHub MCP** | Official, in `modelcontextprotocol/servers` | Issues, PRs, repo ops |
| **Supabase MCP** | Mature, broadly adopted | DB ops, auth admin |
| **Vercel MCP** | Mature, broadly adopted | Deployments, env vars |
| **Microsoft MCP** ([`microsoft/mcp`](https://github.com/microsoft/mcp)) | Catalog of Microsoft-official servers | Azure, M365, GitHub-via-MS |
| **Atlassian Rovo MCP Server (Cloud)** | Official | Jira / Confluence with API token auth — see for OAuth patterns |
| **Box MCP** | Official | File operations on Box; published security guide |

### 2.2 Developer-tools / utility

| Server | Stars / usage | Notes |
|---|---|---|
| **kubectl-mcp-server** | 880 stars | AI ↔ Kubernetes clusters |
| **web-eval-agent** | 1.2k stars | Autonomously debugs web apps with browser-use agents |
| **Sequential Thinking** | 5,550+ uses (Smithery) | Decomposition prompts |
| **wcgw** (Shell + coding agent) | 4,920+ uses (Smithery) | Shell access — read its security caveats first |
| **Context7** | Mainstream | Live library/framework docs lookup |

### 2.3 Lessons from popularity

- **The most-used servers are read-mostly with a small mutation surface.** Sequential Thinking has zero mutations; web-eval-agent's mutations are scoped to its sandbox. Servers that try to be Swiss army knives ("do anything to my system") see less adoption.
- **Vendor servers dominate enterprise adoption** because they ship with proper auth (OAuth/SSO) and audit logs. Personal-project servers can skip OAuth but will not be adopted in regulated environments.
- **Naming "X-mcp" or "mcp-X"** correlates with discoverability; ~75% of public servers do one of those (zazencodes survey).

---

## 3. Discovery directories

Where to find servers built by others before you build yet another one:

| Directory | URL | Strength |
|---|---|---|
| **MCP Registry** | (official, in spec repo) | Authoritative; 2,000+ servers |
| **Smithery** | [smithery.ai](https://smithery.ai) | Usage data per server (e.g., Sequential Thinking 5,550+ uses) |
| **PulseMCP** | [pulsemcp.com](https://www.pulsemcp.com) | Curated server pages, SEO-friendly summaries |
| **mcpservers.org** | [mcpservers.org](https://mcpservers.org) | Catalog with practical examples |
| **awesome-mcp-servers — wong2** | [github.com/wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) | Curated awesome-list |
| **awesome-mcp-servers — appcypher** | [github.com/appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) | Curated awesome-list (alt) |
| **best-of-mcp-servers — tolkonepiu** | [github.com/tolkonepiu/best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers) | Ranked, updated weekly |
| **popular-mcp-servers — pedrojaques99** | [github.com/pedrojaques99/popular-mcp-servers](https://github.com/pedrojaques99/popular-mcp-servers) | Based on Smithery usage data |

**Search heuristic:** before building, grep all of `wong2/awesome-mcp-servers` + Smithery for the domain you're considering. There's likely a 60% solution already; sometimes a 95% one.

---

## 4. The 2026 protocol shifts (what's changed)

| Date | Change | Impact |
|---|---|---|
| **2024-11-05 spec** | HTTP+SSE transport defined | Now deprecated — don't build new servers on this |
| **2025-03-26 spec** | Streamable HTTP transport replaces SSE | All new HTTP servers should use this |
| **2025-06-18 spec** | OAuth 2.1 mandated for HTTP transport in production | Localhost dev still OK over plain HTTP; production requires HTTPS + OAuth |
| **2026 Q1** | TypeScript SDK v1.x stable | The split-package layout (server / client / node / express / hono) is now the recommended shape |
| **April 14, 2026** | Anthropic's Claude Code desktop redesign ships multi-session sidebar + routines | The "manage multiple CC sessions" niche is now an official Anthropic product, not a community gap — if you're building a multi-session manager, position around what they don't do |

---

## 5. Adjacent ecosystem — agent / session managers

These tools wrap MCP-aware clients (mostly Claude Code) and add session management, multi-tab UX, notifications, and orchestration. Useful both as competitive context and as references for UX patterns.

| Tool | Type | Strength | URL |
|---|---|---|---|
| **Claude Squad** | TUI (terminal) | tmux + git worktrees per session; isolated workspaces; diff preview / commit-and-push from inside the TUI | [github.com/smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad) |
| **Codeman** | Web UI | tmux + xterm.js + Mosh-style local echo; Matrix-themed connection lines | [github.com/Ark0N/Codeman](https://github.com/Ark0N/Codeman) |
| **ccmanager** | CLI | Multi-agent (CC, Gemini, Codex, Cursor, Copilot, Cline, OpenCode, Kimi) — agent-agnostic | [github.com/kbwo/ccmanager](https://github.com/kbwo/ccmanager) |
| **opcode** | Desktop | GUI for custom agents, interactive sessions, secure background agents | [github.com/winfunc/opcode](https://github.com/winfunc/opcode) |
| **Claudia** | Desktop | Visual interface for CC | [claudia.so](https://claudia.so) |
| **Claude Launcher (wolverin0)** | Tkinter GUI | Resume CC sessions after a restart | [github.com/wolverin0/claude-launcher](https://github.com/wolverin0/claude-launcher) |
| **CodeAgentSwarm** | Notification layer | Desktop / system tray notifications when CC finishes | [codeagentswarm.com](https://www.codeagentswarm.com) |
| **Agent Watch** | Multi-channel notifier | Slack/Teams/Discord/SMS when an agent needs input | [agent-watch.com](https://agent-watch.com) |
| **Multi-Agent Dashboard (agentsroom.dev)** | Web | Cross-device orchestration | [agentsroom.dev/multi-agent-dashboard](https://agentsroom.dev/multi-agent-dashboard) |
| **Anthropic's official CC desktop** (April 2026) | Desktop | Multi-session sidebar, drag-and-drop pane layout, integrated terminal, in-app file editor, routines | (built into Claude Pro/Max/Team/Enterprise) |

### 5.1 Patterns that have proven out

From watching this category mature:

1. **Three-state notifications win.** "Needs you" / "PR opened" / "Done" — only the first beeps. Universal across Agent Watch, CodeAgentSwarm, agentsroom.dev. Single-state ("done") nags; full-spectrum ("everything that happens") gets muted.
2. **Worktree isolation is the killer feature for parallel sessions.** Claude Squad's whole reason for existing. Anything multi-session that doesn't worktree-isolate will eventually have you fixing merge conflicts the agents created.
3. **Click-to-focus is table stakes.** Status indicator → terminal foreground in one click.
4. **Hooks-based telemetry beats stdout scraping.** The 2026 maturation of Claude Code hooks (SessionStart, PreToolUse, PostToolUse, Stop) made the older approach (PTY + sentinel-string detection) obsolete. New tools build on hooks.
5. **Subscription billing > API billing for ambient agents.** Tools that try to host their own LLM calls bleed money on idle context fees. Tools that spawn `claude` (using the user's subscription) win on cost.

---

## 6. Vibe-coding context (where MCP fits)

"Vibe coding" — the 2025 / 2026 catch-all for AI-assisted, flow-state, multi-session development — drives a lot of MCP demand. Notes from the broader research:

### 6.1 Pain points the field is addressing

| Pain | Tooling response |
|---|---|
| PRDs and process docs go stale within days | Self-updating docs via MCP doc tools (this is the "morning briefing" pattern) |
| Multiple sessions silently stuck on permission prompts | Awaiting-input notifications (Tier 1 of every multi-session manager) |
| AI-co-authored code has 2.74× higher security vulns (CodeRabbit data) | Security scanners as MCP tools (web-eval-agent, Snyk MCPs) |
| Drowning in process artifacts | "Ask the agent" replaces tickets/wikis for personal-scale work |
| Context-switching between projects | Cross-project MCP servers (the launcher MCP pattern) |

### 6.2 Tool categories vs MCP fit

| Category | Best as MCP? | Why |
|---|---|---|
| **App builders** (Lovable, v0, Replit) | ❌ | Hosted UI; users want browser flow, not agent flow |
| **AI coding assistants** (Cursor, CC, Windsurf, Copilot, Gemini CLI, Codex) | ✅ All of them speak MCP now | Direct fit |
| **Service launchers / process managers** | ✅ Underserved | The launcher MCP pattern fits here |
| **Doc maintainers** | ✅ Strong fit | Reactive (post-commit, session-start) keeps docs honest without API cost |
| **Notifiers** | ⚠ Often better as standalone | Notifications need OS-level integration, not MCP tool calls |
| **Worktree orchestration** | ⚠ Often better as CLI | Tight coupling to git plumbing; MCP layer adds latency |

---

## 7. What this means for designing a new MCP server

If you're designing one in May 2026, the field has converged enough to give clear guidance:

1. **Don't reinvent existing servers.** Filesystem, Git, GitHub, Postgres, Slack, Drive, Puppeteer, Memory, Sequential Thinking — already exist, well-maintained.
2. **Find the gap.** Look at what's *not* covered: domain-specific business logic, local infra (service launchers, dev daemons), personal automation (your habits, your projects).
3. **Use Streamable HTTP (stateless) by default** for any long-lived server. Use stdio only when the server is a true subprocess of one client.
4. **Bearer token on loopback is enough** for personal use. OAuth 2.1 only when you cross machines or need audit-grade auth.
5. **Subscription-billed agents > API-billed agents** for anything ambient. Spawn `claude` instead of calling the SDK; the user's existing subscription covers it.
6. **Lean on hooks for proactive behaviour.** SessionStart for context injection; PreToolUse/PostToolUse for guardrails; Stop for cleanup.
7. **Allowlist file writes; deny secrets explicitly.** Defence in depth, per `mcp-server-design-guide.md` §8.
8. **Match the awesome-mcp tool description style** (`<use_case>` + `<important_notes>`). Servers that don't get skipped by clients.

---

## 8. Sources

### Top servers and discovery
- [modelcontextprotocol/servers (85.3k stars)](https://github.com/modelcontextprotocol/servers) — official reference servers
- [awslabs/mcp (9k stars)](https://github.com/awslabs/mcp) — AWS-published servers + design guidelines
- [microsoft/mcp](https://github.com/microsoft/mcp) — Microsoft catalog
- [wong2/awesome-mcp-servers](https://github.com/wong2/awesome-mcp-servers) — curated list
- [appcypher/awesome-mcp-servers](https://github.com/appcypher/awesome-mcp-servers) — alt curated list
- [tolkonepiu/best-of-mcp-servers](https://github.com/tolkonepiu/best-of-mcp-servers) — ranked weekly
- [pedrojaques99/popular-mcp-servers](https://github.com/pedrojaques99/popular-mcp-servers) — Smithery-usage-driven
- [Smithery](https://smithery.ai) | [PulseMCP](https://www.pulsemcp.com) | [mcpservers.org](https://mcpservers.org) — directories

### Articles and guides
- [Top 10 MCP Servers Every Developer Should Know in 2026 — Fungies.io](https://fungies.io/top-mcp-servers-developers-2026/)
- [Best Model Context Protocol (MCP) Servers in 2025 — Pomerium](https://www.pomerium.com/blog/best-model-context-protocol-mcp-servers-in-2025)
- [MCP's Remote Revolution: Streamable HTTP, OAuth, and the Path to 18,000 Servers — Zylos Research](https://zylos.ai/research/2026-03-08-mcp-remote-evolution-streamable-http-enterprise-adoption)
- [Securing your MCP servers — Box Blog](https://blog.box.com/securing-your-mcp-servers)
- [Is that allowed? Authentication and authorization in MCP — Stack Overflow Blog](https://stackoverflow.blog/2026/01/21/is-that-allowed-authentication-and-authorization-in-model-context-protocol/)

### Adjacent agent / session-manager ecosystem
- [Best Claude Code Session Manager 2026 (5 Tools Compared) — Nimbalyst](https://nimbalyst.com/blog/best-session-managers-for-claude-code-and-codex/)
- [Claude Code Desktop Redesign: Multi-Sessions + Routines (2026) — Build Fast With AI](https://www.buildfastwithai.com/blogs/claude-code-desktop-redesign-2026)
- [Live blog: Code w/ Claude 2026 — Simon Willison](https://simonwillison.net/2026/May/6/code-w-claude-2026/)
- [Orchestrate teams of Claude Code sessions — Claude Code Docs](https://code.claude.com/docs/en/agent-teams)
- [AI Coding Agent Dashboard — Marc Nuri](https://blog.marcnuri.com/ai-coding-agent-dashboard)
- [Claude Code Notifications — CodeAgentSwarm](https://www.codeagentswarm.com/en/guides/codeagentswarm-notifications)
- [How I use Claude Code — Builder.io](https://www.builder.io/blog/claude-code)

### Vibe-coding context
- [The 10 Best Vibe Coding Tools in 2026 — roadmap.sh](https://roadmap.sh/vibe-coding/best-tools)
- [Vibe Coding for Product Teams 2026 — Build Better](https://blog.buildbetter.ai/vibe-coding-product-teams-ship-features-without-figma-linear-2026/)
- [The Complete Vibe Coding Guide for 2026 — SpunkArt](https://spunk.codes/blog/vibe-coding-guide-2026)
- [How I'm Vibe Coding in 2026 — Graham Mann](https://grahammann.net/blog/how-im-vibe-coding-2026)
- [Exploiting MCP Servers Vulnerable to Command Injection — Snyk](https://snyk.io/articles/exploiting-mcp-servers-vulnerable-to-command-injection/) — what to NOT do
