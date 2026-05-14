# MCP Implementation Patterns Reference

Concrete patterns for actually building and running an MCP server in Node/TypeScript. Covers the official SDK shape, transport choice (stdio vs Streamable HTTP), authentication, ESM/CommonJS interop, and minimum-viable example code you can paste and adapt.

For *design* concerns (naming, descriptions, security model) see `mcp-server-design-guide.md`. For *landscape* (who's built what) see `mcp-ecosystem-landscape.md`.

---

## 1. SDK packages overview

The official TypeScript SDK is at `github.com/modelcontextprotocol/typescript-sdk` (12.4k stars). As of v1.x it's a **monorepo of split packages** — install only what you need:

| Package | Purpose | When to use |
|---|---|---|
| `@modelcontextprotocol/server` | Build MCP servers | Always, when authoring a server |
| `@modelcontextprotocol/client` | Build MCP clients | When writing your own MCP host (rare) |
| `@modelcontextprotocol/node` | Node.js Streamable HTTP transport wrapper for raw `IncomingMessage`/`ServerResponse` | When using vanilla `http.createServer` |
| `@modelcontextprotocol/express` | Express helpers (app defaults + Host header validation) | When you have an Express app already |
| `@modelcontextprotocol/hono` | Hono helpers | When using Hono (edge runtimes) |

The middleware packages are intentionally thin — they don't add MCP features, they just wire MCP into the runtime/framework. Pick one based on the host you already have.

### 1.1 Standard Schema

Tool and prompt schemas use [Standard Schema](https://standardschema.dev/) — bring **Zod v4**, **Valibot**, or **ArkType** (any compatible library). The SDK doesn't bundle a schema library; you choose. Zod is the de facto default in this ecosystem.

```bash
npm install @modelcontextprotocol/server zod
```

---

## 2. Transports — stdio vs Streamable HTTP

### 2.1 Stdio transport

The default for "MCP server is a subprocess of the client" relationships. The client (e.g., Claude Desktop, Claude Code) spawns the server, and they communicate via the server's stdin/stdout.

**When to use:**
- Server is short-lived, started per-session
- No need for multiple clients to share the server
- You want zero auth (the subprocess inherits the user's permissions; nothing else can talk to it)
- Bundling server with the client install is acceptable

**Example client config (`.mcp.json`):**

```json
{
  "mcpServers": {
    "my-tool": {
      "command": "node",
      "args": ["./dist/index.mjs"]
    }
  }
}
```

### 2.2 Streamable HTTP transport

Replaces the deprecated **HTTP+SSE** transport from protocol version 2024-11-05. **Use this for any HTTP-based MCP server** — not the older SSE pattern.

The transport uses HTTP `POST` and `GET` requests; the server can optionally use Server-Sent Events to stream multiple responses. A persistent server can handle multiple client connections concurrently.

**When to use:**
- Server is long-lived (a daemon, a desktop app subprocess, a hosted service)
- Multiple clients should share the server (e.g., several CC sessions all using the same launcher tools)
- The server is "infrastructure" and clients are "ephemeral consumers"
- You need network reachability (off-box use) — though add OAuth in that case

**Example client config (`.mcp.json`):**

```json
{
  "mcpServers": {
    "launcher": {
      "type": "http",
      "url": "http://127.0.0.1:3010/mcp",
      "headers": {
        "Authorization": "Bearer ${LAUNCHER_MCP_TOKEN}"
      }
    }
  }
}
```

The `${LAUNCHER_MCP_TOKEN}` is interpolated by the client from the spawning env.

### 2.3 Stateful vs stateless mode

Streamable HTTP supports two modes via `sessionIdGenerator`:

| Mode | `sessionIdGenerator` | Behavior | When to pick |
|---|---|---|---|
| **Stateless** | `undefined` | Each request gets a fresh transport instance; no session context | Short tool calls, infra-style servers, single-shot agents (briefings, queries) |
| **Stateful** | `() => randomUUID()` | Per-session transport with persistent SSE stream | Long-lived agent conversations, multi-turn tool flows, server-side memory |

**Default to stateless.** It's simpler, scales naturally, and works for the vast majority of tool-execution patterns. Add state only when you actually need it.

### 2.4 Decision matrix

| Question | stdio | Streamable HTTP (stateless) | Streamable HTTP (stateful) |
|---|---|---|---|
| Multiple concurrent clients? | ❌ | ✅ | ✅ |
| Server is long-lived (daemon, app)? | ❌ | ✅ | ✅ |
| Need auth? | ❌ (no, subprocess only) | ⚠ Recommended | ⚠ Recommended |
| Network reachable? | ❌ (stdin/out only) | ✅ | ✅ |
| Easiest to debug? | ✅ | ⚠ middle | ❌ (state to manage) |
| Multi-tenant safe? | n/a | ✅ | ⚠ session-scoping required |

---

## 3. Minimal stdio example

```js
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const server = new McpServer({
  name: 'greeting-server',
  version: '1.0.0',
  instructions: 'A toy server that greets users by name.',
});

server.registerTool(
  'greet',
  {
    description: '<use_case>Use this to greet a user by name.</use_case>',
    inputSchema: z.object({
      name: z.string().describe('The user\'s name to greet.'),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}!` }],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

This is the "hello world" from the official SDK README. Anything more involved keeps the same shape — `new McpServer(...)`, `registerTool(...)` calls, `connect(transport)` to start.

---

## 4. Streamable HTTP example (Node, no framework)

Using `@modelcontextprotocol/node` to wrap raw HTTP:

```js
import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/server';
import { StreamableHttpServerTransport } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import crypto from 'node:crypto';

const TOKEN = process.env.LAUNCHER_MCP_TOKEN;
if (!TOKEN) throw new Error('LAUNCHER_MCP_TOKEN env var required');

function authOk(req) {
  const header = req.headers.authorization || '';
  const sent = header.replace(/^Bearer\s+/i, '');
  if (sent.length !== TOKEN.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(TOKEN));
}

const server = new McpServer({
  name: 'launcher',
  version: '1.0.0',
  instructions: '...',
});

server.registerTool('service_list', {
  description: '<use_case>List all defined services.</use_case>',
  inputSchema: z.object({}),
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify(getServices(), null, 2) }],
}));

const transport = new StreamableHttpServerTransport({
  sessionIdGenerator: undefined,  // stateless
});
await server.connect(transport);

const httpServer = http.createServer(async (req, res) => {
  if (req.url !== '/mcp') {
    res.writeHead(404).end();
    return;
  }
  if (!authOk(req)) {
    res.writeHead(401, { 'WWW-Authenticate': 'Bearer' }).end();
    return;
  }
  await transport.handleRequest(req, res);
});

httpServer.listen(3010, '127.0.0.1', () => {
  console.error('MCP server on http://127.0.0.1:3010/mcp');
});

export function stop() {
  httpServer.close();
  transport.close();
}
```

Key points:

1. **Bind to `127.0.0.1`**, not `0.0.0.0`. Loopback-only is the first line of defence.
2. **Bearer token from env**, validated with `crypto.timingSafeEqual` (constant-time — prevents timing attacks even though the surface is tiny).
3. **Stateless mode** (`sessionIdGenerator: undefined`).
4. **Single endpoint** `/mcp` — POST and GET both routed to `transport.handleRequest`.
5. **Export `stop()`** so the host can shut down cleanly on app quit.

---

## 5. Streamable HTTP example (Express)

Same server, with Express helpers:

```js
import express from 'express';
import { McpServer } from '@modelcontextprotocol/server';
import { mcpExpressApp } from '@modelcontextprotocol/express';

const app = express();
const server = new McpServer({ /* ... */ });

// Register tools as in §4

// Bearer auth middleware
app.use('/mcp', (req, res, next) => {
  if (!authOk(req)) return res.status(401).set('WWW-Authenticate', 'Bearer').end();
  next();
});

// Mount MCP at /mcp with default helpers (Host header validation, stateless)
app.use('/mcp', mcpExpressApp(server));

app.listen(3010, '127.0.0.1');
```

The Express helper handles body parsing and Host header checks (defence against DNS rebinding). Use it if you're already in an Express app; otherwise the `/node` package is leaner.

---

## 6. Authentication

### 6.1 Decision tree

```
Is the server stdio (subprocess of the client)?
├─ Yes → No auth needed. Subprocess inherits user permissions.
└─ No (HTTP) →
   Is the server bound to localhost only?
   ├─ Yes → Bearer token (defence in depth — other localhost
   │        processes can hit unauthenticated loopback servers).
   └─ No (network reachable) → OAuth 2.1 (per MCP spec post-2025-06-18).
```

### 6.2 Bearer token pattern (localhost HTTP)

Per the official auth tutorial: *"A local stdio MCP server doesn't need authentication. For HTTP servers, even localhost, prefer at least a bearer token."*

```js
// On first launch, generate and persist:
const token = crypto.randomBytes(32).toString('hex');
fs.writeFileSync(prefsPath, JSON.stringify({ ...prefs, mcpToken: token }));

// On every launch, load into env:
process.env.LAUNCHER_MCP_TOKEN = prefs.mcpToken;

// Server validates:
if (!authOk(req)) return res.status(401).end();

// Client config references via interpolation:
// "headers": { "Authorization": "Bearer ${LAUNCHER_MCP_TOKEN}" }
```

**Rotation:** delete the token from prefs, restart the server. The client's `.mcp.json` doesn't need editing because it interpolates from the env.

### 6.3 OAuth 2.1 (network-reachable HTTP)

The HTTP transport in the 2025-06-18 spec uses OAuth 2.1. Implement the resource server side; pass MCP clients a JWT in the `Authorization: Bearer {token}` header.

Key rules from the spec:
- **HTTPS required** in production. Plain HTTP is allowed only for `localhost` development.
- **Validate the `aud` claim** — ensure the token was issued for *your* MCP server resource, not someone else's.
- **Enforce required scopes** per tool — never assume a valid token implies full access.
- **Don't accept tokens or redirect callbacks over plain HTTP** except localhost dev.

For most personal/local-first projects, OAuth is overkill; bearer-on-loopback covers the threat model.

### 6.4 Audience and scopes

When you do go OAuth:

```js
function validateToken(token) {
  const decoded = jwt.verify(token, publicKey, {
    audience: 'https://launcher.zslayerhq.com/mcp',  // your resource id
    issuer: 'https://auth.zslayerhq.com',
  });
  return decoded.scopes || [];
}

// Per-tool scope check
server.registerTool('doc_write', { /* ... */ }, async (args, ctx) => {
  if (!ctx.scopes.includes('docs:write')) {
    return { content: [{type:'text', text:'Insufficient scope.'}], isError: true };
  }
  // ...
});
```

---

## 7. ESM / CommonJS interop

The MCP TypeScript SDK is **ESM-first as of v1.x.** If your host application is CommonJS (a lot of Node apps still are — including most Electron projects), you have three choices:

### 7.1 Convert host to ESM (`"type": "module"`)

Cleanest if you can do it. All `require()` becomes `import`, file extensions matter, etc. Often non-trivial in big legacy codebases.

### 7.2 Dynamic import from CJS

Keep the host CJS; load the MCP server lazily:

```js
// CommonJS host (main.js)
async function startMcp() {
  const { createServer } = await import('./mcp-server/index.mjs');
  const handle = await createServer({ /* deps */ });
  return handle;  // { stop: () => {} }
}

app.whenReady().then(async () => {
  // ... existing setup
  try {
    mcpHandle = await startMcp();
  } catch (e) {
    console.error('MCP server failed to start:', e);
    // Continue without MCP — graceful degradation
  }
});

app.on('before-quit', async () => {
  if (mcpHandle) await mcpHandle.stop();
});
```

### 7.3 Sub-package with own `package.json`

Put the MCP server in its own folder with `"type": "module"`. This is the pattern used in the launcher mcp-briefing spec. Keeps the SDK's dep tree isolated from the host.

```
launcher/
├─ package.json              ← "type": "commonjs" (or omitted)
├─ main.js                   ← CommonJS, dynamic-imports the MCP server
└─ mcp-server/
   ├─ package.json           ← "type": "module"
   ├─ index.mjs              ← ESM, exports createServer({deps})
   └─ ...
```

This is also a clean precondition for moving to a child-process model later (just spawn the sub-package as a Node process instead of `import()`-ing it).

---

## 8. Configuration files

### 8.1 Server `.mcp.json` (in the workspace the agent runs from)

The standard config the MCP-aware client looks for:

```json
{
  "mcpServers": {
    "launcher": {
      "type": "http",
      "url": "http://127.0.0.1:3010/mcp",
      "headers": {
        "Authorization": "Bearer ${LAUNCHER_MCP_TOKEN}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

- HTTP servers: `type`, `url`, optional `headers`
- Stdio servers: `command`, `args` (and optional `env`)

### 8.2 Per-project vs global config

Claude Code looks in priority order:

1. `<workspace>/.mcp.json` — project-scoped
2. `~/.claude.json` (or `~/.claude/settings.json` depending on version) — user-global
3. Plugin-provided MCPs (when installed via plugins)

**Use project-scoped** for tools that only make sense in this project. **Use global** for tools you want available across every session (e.g. a shared launcher MCP or a workspace-wide knowledge base).

### 8.3 Hooks for session bootstrapping

Use a `SessionStart` hook (in `.claude/settings.json`) to inject context the agent needs immediately:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "echo Run the morning briefing per CLAUDE.md."
      }]
    }]
  }
}
```

Hooks run again on `resume` with `source: "resume"` set, so they can refresh ephemeral context (current branch, time of day, today's open PRs).

---

## 9. Testing

### 9.1 Unit tests

Use `node:test` (built-in) — no extra deps, plays well with ESM:

```js
import test from 'node:test';
import assert from 'node:assert';
import { createServer } from '../index.mjs';

test('service_list returns the services from the manager', async () => {
  const fakeManager = { getAll: () => [{ id: 'a', status: 'running' }] };
  const handle = await createServer({ services: fakeManager, transport: 'inproc' });
  const result = await handle.callTool('service_list', {});
  assert.match(result.content[0].text, /"id": "a"/);
  await handle.stop();
});
```

The trick: have `createServer` accept dependencies (manager instances, fs adapter) so tests can pass fakes. Avoid module-level singletons.

### 9.2 Integration tests

Spawn the server bound to port 0 (OS-assigned ephemeral port), then drive it with a real MCP client or with `curl`:

```bash
curl -X POST http://127.0.0.1:3010/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### 9.3 The MCP Inspector

The official `@modelcontextprotocol/inspector` tool gives you a UI for poking a server:

```bash
npx @modelcontextprotocol/inspector node ./dist/index.mjs
```

Lists tools, lets you call them with form-driven inputs, shows full request/response shapes. Use it during development.

---

## 10. Logging and observability

Per `mcp-server-design-guide.md` §11: structured logs (pino) + separate audit log for mutations.

For HTTP servers, consider exposing a **`/healthz`** endpoint outside the MCP path so external monitoring can poll without speaking MCP:

```js
http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  if (req.url === '/mcp') { /* MCP handler */ }
});
```

This is also useful for the host app's own UI ("MCP server status: ok") without the host having to be an MCP client.

---

## 11. Common pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Using deprecated SSE transport | Works in old clients, fails in new ones | Switch to Streamable HTTP (`@modelcontextprotocol/node`) |
| Stateful mode by default | Memory leaks, weird cross-session pollution | Set `sessionIdGenerator: undefined` for stateless |
| Binding to `0.0.0.0` | Server reachable from network without auth | Bind to `127.0.0.1` (loopback only) |
| Bearer token in URL query string | Logged by middleware, browser history, etc. | Use `Authorization: Bearer` header |
| ESM SDK in CJS host without dynamic import | `require()` of ESM throws at runtime | Use `await import()` from an `async` function |
| No `Host` header validation | Vulnerable to DNS rebinding from a malicious page | Use `@modelcontextprotocol/express` (which validates) or check `req.headers.host` against an allowlist |
| Using `execSync` with template strings | Command injection (Snyk-documented) | `execFile` with arg array |
| Throwing inside tool handlers | Crashes transport, kills server | Return `{isError: true, content: [...]}` |
| Forgetting to `await server.connect(transport)` | Server starts but doesn't respond | `connect` is async — await it |
| Stale `.mcp.json` after rotating tokens | 401 forever | Use `${ENV_VAR}` interpolation in `.mcp.json`, not the literal token |

---

## 12. Recommended starter stack (Node)

For a new MCP server in 2026:

```json
{
  "type": "module",
  "dependencies": {
    "@modelcontextprotocol/server": "^1",
    "@modelcontextprotocol/node": "^1",
    "zod": "^4",
    "pino": "^9"
  },
  "devDependencies": {
    "@modelcontextprotocol/inspector": "^0",
    "node": ">= 20"
  }
}
```

- **Transport:** Streamable HTTP, stateless, loopback-bound
- **Schema:** Zod v4 (matches official examples)
- **Logging:** pino + separate audit log
- **Tests:** built-in `node:test`
- **Inspector:** for development

This is enough for a production-quality local MCP server. Add OAuth/Express only when the requirements push you there.

---

## 13. Sources

- [Model Context Protocol — TypeScript SDK (12.4k stars)](https://github.com/modelcontextprotocol/typescript-sdk) — package layout, `Server`/`registerTool` API, examples
- [@modelcontextprotocol/sdk on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [MCP Spec — Transports (2025-03-26)](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — Streamable HTTP definition, deprecation of SSE
- [Streamable HTTP TypeScript Server starter — ferrants](https://github.com/ferrants/mcp-streamable-http-typescript-server) — minimal working example
- [MCP Authorization tutorial — official docs](https://modelcontextprotocol.io/docs/tutorials/security/authorization) — bearer/OAuth decision tree, localhost rules
- [Configure Bearer auth in MCP server — MCP Auth](https://mcp-auth.dev/docs/configure-server/bearer-auth) — JWT validation patterns, audience/scope
- [Best Practices for remote MCP bearer token authentication — modelcontextprotocol discussion #1247](https://github.com/modelcontextprotocol/modelcontextprotocol/discussions/1247)
- [Building a JavaScript "Hello, World" MCP server in 2026 — DEV Community](https://dev.to/chuckm/building-a-javascript-helloworld-mcp-server-in-2026-2lbc)
- [MCP Transport Scalability: Production Migration Guide for 2026](https://www.elegantsoftwaresolutions.com/blog/mcp-transport-scalability-production-migration-guide-2026)
- [How to Add Authentication to Your MCP Server — OAuth 2.1, Bearer Tokens — MCP Playground](https://mcpplaygroundonline.com/blog/mcp-server-oauth-authentication-guide)
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) — SessionStart hook details
