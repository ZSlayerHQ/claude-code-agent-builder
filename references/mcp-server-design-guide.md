# MCP Server Design Guide

How to design a Model Context Protocol (MCP) server that an AI client (Claude Code, Claudia, opcode, ccmanager, etc.) can actually use without falling over. Distilled from the AWS Labs design guidelines, Snyk's best-practices write-up by Liran Tal, the awesome-mcp-best-practices list, and the official `modelcontextprotocol/servers` reference implementations.

This is a **design** reference. For implementation patterns (transports, SDK shape, code) see `mcp-implementation-patterns.md`. For landscape and discovery see `mcp-ecosystem-landscape.md`.

---

## 1. Project structure

The AWS guidelines codify a structure that maps cleanly to JS/TS projects. Adapted for Node:

```
my-mcp-server/
├── README.md               # What it does, how to install, example client config
├── CHANGELOG.md            # Version history
├── LICENSE
├── package.json            # ESM ("type": "module" if using SDK >= 1.x)
├── .gitignore
├── src/
│   ├── index.mjs           # Entry: builds server, wires transport, exports stop()
│   ├── transport.mjs       # Transport selection (stdio | streamable-http)
│   ├── auth.mjs            # Bearer-token validation (HTTP only)
│   ├── allowlist.mjs       # Path/resource allowlists + deny-list checks
│   ├── audit.mjs           # Audit log for mutating calls
│   ├── logger.mjs          # Structured logger (pino)
│   └── tools/              # One file per domain, NOT one big tools.mjs
│       ├── services.mjs
│       ├── docs.mjs
│       ├── git.mjs
│       └── ...
└── __tests__/
    ├── allowlist.test.mjs
    ├── tools.services.test.mjs
    └── ...
```

**Why split tools by domain:** an MCP client lists every tool with its full description in its initial context window. Co-locating related tools makes review and testing tractable. AWS's larger servers (e.g., `bedrock-kb-retrieval-mcp-server`) follow the same split.

**Why ESM:** the official `@modelcontextprotocol/server` SDK is ESM-first as of 1.x. CommonJS consumers can dynamic-`import()` from a CJS host, but the MCP server's own code should be ESM.

---

## 2. Tool naming conventions

### 2.1 Required rules (per MCP spec)

- ✅ Maximum **64 characters** for the fully qualified name
- ✅ Must **start with a letter** (a-z, A-Z)
- ✅ Use only alphanumeric, `_`, `-`, `.`, `/`
- ✅ **Case-sensitive** and unique within their namespace
- ❌ No spaces, commas, or special characters (`@`, `$`, `!`)
- ❌ Must not start with a number

### 2.2 Recommended style

**`snake_case` with a `domain_verb` shape.** ~90% of the public ecosystem uses this (zazencodes survey). It aligns with both the official Python reference servers and the convention LLM tokenizers handle most reliably.

| ✅ Good | ❌ Avoid | Why |
|---|---|---|
| `service_list` | `listServices` | Less robust to GPT/Claude tokenization edge cases |
| `doc_read` | `read.doc` | Dot separators cause client routing failures (Snyk) |
| `git_status` | `git status` | Spaces fail the spec |
| `cc_session_list` | `cc-session-list` | Dashes work but mixing with snake_case in the same server is a smell |

### 2.3 Domain prefixes

Group tools by the subsystem they touch — `service_*`, `doc_*`, `git_*`, `metrics_*`. This both helps the LLM disambiguate and matches AWS's `domain-noun-verb` recommendation.

For vendor servers, use a vendor prefix: `awslabs_bedrock_*`, `atlassian_jira_*`. Single-author servers can skip the vendor prefix.

### 2.4 Server-name conventions (separate from tool names)

40% of public servers end with `-mcp` (e.g., `kubectl-mcp-server`); 35% start with `mcp-`. Either is fine. **Do not** apply this convention to *tool* names — `service_list_mcp` is noise.

---

## 3. Tool descriptions

This is the single highest-leverage thing to get right. Clients (especially Claude) decide whether to call your tool based largely on its description. Short descriptions cause the tool to be skipped entirely.

### 3.1 Recommended convention (from awesome-mcp-best-practices)

Use semantic XML-ish tags inside the description string:

```js
server.registerTool(
  'doc_write',
  {
    description: `<use_case>Use this tool to overwrite an allowlisted documentation file (e.g., recent-project.md, a project CLAUDE.md, or a session log) with refreshed content. Always preview the new content to the user and ask permission before calling.</use_case>
<important_notes>
- The path must match the doc allowlist; out-of-list paths return an error and do NOT write.
- A .bak of the previous version is written automatically.
- Atomic write: temp file + rename, so partial writes are impossible.
- Maximum content size: 1 MB.
- This tool does NOT git-commit; user commits manually after review.
</important_notes>`,
    inputSchema: { /* ... */ },
  },
  async (args) => { /* ... */ }
);
```

### 3.2 What tags to use

- `<use_case>` — one or two sentences on when to call this tool
- `<important_notes>` — bullets covering edge cases, prerequisites, output guarantees, side effects
- `<example>` — optional concrete usage example (helpful for tools with non-obvious params)

### 3.3 Anti-patterns

| ❌ Anti-pattern | Why it fails |
|---|---|
| `"Get a thing"` | LLM has no signal for when to choose this over another similar tool |
| `"Returns the data"` | No when, no why |
| `"Internal use only"` | Don't expose it then; if exposed, document it |
| Mentioning HTTP routes or implementation details | The LLM doesn't care about your URL paths; it cares about behaviour |
| Copy-pasted descriptions across tools | Forces the LLM to disambiguate purely on tool name — fragile |

### 3.4 Length

Aim for 80–300 words including the tags. Long enough to disambiguate, short enough that the full tool catalog fits in the model's initial context.

---

## 4. Parameter descriptions

Per AWS guidelines: **every parameter description is an instruction to the AI.** This is where you encode workflow constraints, validation rules, and allowed values.

### 4.1 Recommended convention (Zod / Standard Schema)

```js
inputSchema: z.object({
  path: z.string().describe(
    "Absolute file path. Must match an allowlist pattern " +
    "(recent-project.md, project CLAUDE.md, session-*.md, " +
    "or docs/superpowers/{specs,plans}/*.md). Out-of-list paths are " +
    "rejected server-side."
  ),
  content: z.string().describe(
    "Full file content as UTF-8 markdown. Replaces the entire file. " +
    "Maximum 1 MB."
  ),
  message: z.string().optional().describe(
    "Optional commit message. Currently ignored — user commits manually."
  ),
})
```

### 4.2 Workspace directory pattern (AWS)

For tools that operate on files, take the workspace as a parameter rather than inferring it from the server's CWD:

```js
workspace_dir: z.string().describe(
  "The absolute path to the user's current workspace directory. " +
  "Pass the directory the user is currently working in. " +
  "If you don't know, ask the user — never guess."
)
```

This keeps the server stateless and lets the AI provide the correct context per call.

### 4.3 What to encode in descriptions

- **Allowed values** — for enum-like params, list them (or use `z.enum`)
- **Required preconditions** — "call X first to obtain a valid id"
- **Format hints** — "ISO 8601 timestamp", "absolute path", "git ref"
- **Defaults and limits** — "defaults to today; max 30 days back"
- **Negative instructions** — "never pass a relative path", "do not include credentials"

---

## 5. Tool annotations

The MCP spec (post-2025-03-26) defines annotation hints clients can use to set permission UX defaults:

| Annotation | Set when | Effect on Claude Code |
|---|---|---|
| `readOnlyHint: true` | Tool only reads state — no side effects | Auto-allow in normal use; one-time approval at most |
| `destructiveHint: true` | Tool deletes/overwrites in a way that matters | Stronger permission prompt; sometimes per-call |
| `idempotentHint: true` | Same args produce same result, safe to retry | Client may auto-retry on transport errors |
| `openWorldHint: false` | Tool talks only to local/private resources | Reduces "external network" friction in some clients |

Example:

```js
server.registerTool('service_list', {
  description: '<use_case>...</use_case>',
  inputSchema: z.object({}),
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
}, /* handler */);

server.registerTool('doc_write', {
  description: '<use_case>...</use_case>',
  inputSchema: z.object({ path: z.string(), content: z.string() }),
  annotations: { destructiveHint: true, openWorldHint: false },
}, /* handler */);
```

**Default to setting at least one of these on every tool.** Clients that respect annotations give a better UX; clients that don't lose nothing.

---

## 6. Server `instructions` field

The `Server` constructor takes an `instructions` field returned in the `initialize` response. This is the only server-level natural-language context the client gets — use it.

```js
const server = new McpServer({
  name: 'launcher',
  version: '1.0.0',
  instructions: `
This is the launcher MCP server. It exposes the local service stack and
project docs to morning-briefing and ad-hoc developer agent sessions.

Use it to:
- Inspect current state of services (service_list, service_status, service_logs)
- Inspect CC sessions (cc_session_list)
- Pull git state for projects (git_status, git_log, git_diff)
- Read project docs (doc_read) and refresh them with user approval (doc_write)
- Query token spend (usage_query) and recent activity (activity_recent)

Conventions:
- Always call service_list first to learn what services exist by id.
- For doc_write, present a unified diff and ask the user before calling.
- Project ids: cortana, liftai, launcher, serenity-launcher.
- Never assume a service is running — confirm via service_status.
`.trim(),
});
```

This instruction gets folded into the model's system context every session — it's the cheapest piece of routing logic you can write.

---

## 7. Response shape

All tool handlers return objects of shape:

```js
{
  content: [
    { type: 'text', text: '...' },
    // optionally more content blocks: image, resource, etc.
  ],
  isError: false  // true on errors — see §9
}
```

### 7.1 The empty-result rule (awesome-mcp-best-practices §1.4)

**Never return an empty content array.** Empty results cause client-side routing failures and the LLM tends to retry uselessly. If there's nothing to return, return text describing why:

| ❌ Don't | ✅ Do |
|---|---|
| `{ content: [] }` | `{ content: [{type: 'text', text: 'No services are currently running.'}] }` |
| `{ content: [{type: 'text', text: ''}] }` | `{ content: [{type: 'text', text: 'No matching documents found in scope.'}] }` |
| 404 from underlying API → throw | `{ content: [{type: 'text', text: 'No GitHub issue with that id. Did you mean issue 1234?'}], isError: true }` |

### 7.2 Structured data

For data the LLM will reason over, return JSON-stringified text, not raw JS objects:

```js
return {
  content: [{
    type: 'text',
    text: JSON.stringify({ status: 'success', services: [...] }, null, 2),
  }],
};
```

The model parses JSON reliably; raw objects in `text` get coerced to `[object Object]`.

### 7.3 Long output

For potentially-large output (logs, diffs, file contents), truncate server-side with a clear marker:

```
[truncated — showing 200 of 1843 lines. Call again with tail=N for more.]
```

Do not stream multi-megabyte payloads through MCP responses — context window costs are real.

---

## 8. Allowlists and path safety (the security boundary)

MCP servers run with the privileges of whoever launched them. Defence in depth is mandatory.

### 8.1 Allowlist pattern

```js
const ALLOWED_WRITE_PATTERNS = [
  /^D:\\Games\\SPT 2026\\Development\\Projects\\docs\\recent-project\.md$/i,
  /^D:\\Games\\SPT 2026\\Development\\Projects\\Build\\[^\\]+\\CLAUDE\.md$/i,
  // ...
];

const DENY_LIST = [
  /\.env$/i, /\.env\./i, /\.pem$/i, /\.key$/i,
  /personality\.js$/i, /agents\.json$/i, /config\.js$/i,
  /node_modules[\\/]/i, /\.git[\\/]/i, /secrets[\\/]/i,
];

function isWritable(rawPath) {
  // 1. Resolve to absolute, normalize separators, collapse `..`
  const normalized = path.resolve(rawPath);

  // 2. Reject any traversal even if normalized
  if (rawPath.includes('..')) return false;

  // 3. Deny list overrides allowlist
  if (DENY_LIST.some((re) => re.test(normalized))) return false;

  // 4. Must match an allowlist pattern
  return ALLOWED_WRITE_PATTERNS.some((re) => re.test(normalized));
}
```

### 8.2 Why all four steps matter

- **`path.resolve`** — `./foo/../bar` and `foo\bar` and `foo/bar` should hash to the same identity. Without normalization the regex check is bypassable.
- **Reject `..` even after normalization** — defence against creative encodings (URL-encoded, mixed slashes). Cheap belt-and-braces.
- **Deny list overrides allowlist** — if someone adds a permissive allowlist pattern by accident, the deny list still catches `.env` files.
- **Allowlist match required** — opt-in, not opt-out. New paths require a code change.

### 8.3 Document why each entry exists

Per AWS guidelines: **comment every allowlist entry with the reason and date added.** Saves an audit trail for security review:

```js
const ALLOWED_WRITE_PATTERNS = [
  // Project-level state-of-the-world doc, refreshed by morning-briefing agent.
  // Added 2026-05-10 (mcp-briefing spec).
  /^D:\\Games\\SPT 2026\\Development\\Projects\\docs\\recent-project\.md$/i,
  // ...
];
```

### 8.4 No shell-string concatenation

The Snyk write-up's example is deliberately vulnerable to command injection because it does `execSync(\`npm view ${packageName}\`)`. Anti-pattern. Always use `execFile` (no shell), or `spawn` with arg arrays:

```js
// ✅ Safe
const { execFileSync } = require('child_process');
const result = execFileSync('npm', ['view', packageName], { encoding: 'utf-8' });

// ❌ Vulnerable
const result = execSync(`npm view ${packageName}`); // packageName="foo; rm -rf /"
```

---

## 9. Error handling

### 9.1 Return errors as MCP responses, don't throw

Throwing crashes the transport layer. Return errors as data:

```js
async function handle(args) {
  if (!validateInput(args)) {
    return {
      content: [{ type: 'text', text: 'Invalid input: path is required.' }],
      isError: true,
    };
  }
  // ...
}
```

### 9.2 Error response convention

Every error response should:

1. Set `isError: true`
2. Include a human-readable message
3. Include a hint on how to recover (which tool to call to find valid inputs, which arg to fix)

```js
return {
  content: [{
    type: 'text',
    text: 'Unknown service id "cortana-bott". Did you mean "cortana"?\n' +
          'Hint: call service_list to see all valid ids.',
  }],
  isError: true,
};
```

### 9.3 Don't leak internals in error messages

| ❌ Don't | ✅ Do |
|---|---|
| `'EACCES: permission denied open D:/secrets/db.pem'` | `'File access denied.'` |
| `'TypeError: Cannot read property foo of undefined at handler:42'` | `'Internal error processing request. Logged for review.'` |
| `'Path must match /^D:\\\\Games\\\\.../i'` | `'Path is not in the allowlist. See server instructions for writable paths.'` |

The full error goes to the structured log; the client sees a sanitised message.

---

## 10. Timeouts

Long-running tools must be bounded. The spec gives no timeout default — set one yourself.

```js
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

server.registerTool('git_log', { /* ... */ }, async (args) => {
  try {
    const out = await withTimeout(runGitLog(args), 10_000, 'git_log');
    return { content: [{ type: 'text', text: out }] };
  } catch (e) {
    return { content: [{ type: 'text', text: e.message }], isError: true };
  }
});
```

**Recommended defaults:** 30s server-wide; 5–10s for fast operations (file reads, simple git commands); 60s for known-slow ones (full builds, large diffs).

---

## 11. Logging

Per AWS guidelines: **structured logging on every request** so you can audit what the AI did. In Node, use pino (smaller and faster than winston):

```js
const pino = require('pino');
const log = pino({ level: 'info' }, pino.destination('./mcp.log'));

server.registerTool('doc_write', { /* ... */ }, async ({ path: p, content }) => {
  const requestId = crypto.randomUUID();
  log.info({ requestId, tool: 'doc_write', path: p, byteCount: content.length });
  try {
    await write(p, content);
    log.info({ requestId, status: 'ok' });
    return { content: [{ type: 'text', text: 'Wrote.' }] };
  } catch (e) {
    log.error({ requestId, status: 'error', err: e.message, stack: e.stack });
    return { content: [{ type: 'text', text: 'Write failed.' }], isError: true };
  }
});
```

### 11.1 Audit log for mutating tools

Keep a separate, **never-rotated** audit log for any tool that changes state:

```js
const audit = pino({ level: 'info' }, pino.destination('./mcp-audit.log'));

audit.info({
  ts: new Date().toISOString(),
  tool: 'doc_write',
  path: normalizedPath,
  sha256: crypto.createHash('sha256').update(content).digest('hex'),
  byteCount: content.length,
  requestId,
});
```

The audit log is human-tail-able. `tail -f mcp-audit.log` during a session = live "exactly what the agent touched."

---

## 12. Anti-patterns to avoid

| Anti-pattern | Why | Fix |
|---|---|---|
| Tool name `getNpmPackageInfo` mixed with `list-services` in same server | Inconsistent style breaks LLM's mental model | Pick one style and stick to it (snake_case recommended) |
| Single 800-line `tools.mjs` file | Untestable, unreviewable | Split by domain |
| Returning JS objects instead of JSON-stringified text | Coerces to `[object Object]` in client display | `JSON.stringify(...)` |
| `execSync(\`some-cmd ${userInput}\`)` | Command injection | `execFile('some-cmd', [userInput])` |
| Allowlist as a single regex | Unreadable, easy to break with one bad edit | Array of patterns with comments |
| Throwing on validation errors | Crashes transport | Return `{isError: true, content: [...]}` |
| Empty `content: []` on no results | Client routing failure | Return text explaining why empty |
| Tool description "Returns the X" | LLM has no when-to-call signal | `<use_case>` + `<important_notes>` |
| Passing the user's `process.env` as tool args | Leaks secrets to the LLM | Server reads its own env; never echoes back |
| No timeout on `git diff`, `npm install`, etc. | Hangs the agent indefinitely | `withTimeout` wrapper, 5–60s per tool |
| `dangerouslySkipPermissions` baked into client config | Defeats CC's protection | Let CC prompt; trust the user |

---

## 13. When to use this guide

- **Always** when designing or reviewing a new MCP server's tool surface
- During code review of any MCP server PR
- Before publishing a server to a registry (Smithery, MCP Registry)
- When a Claude Code session reports it can't find a tool you defined → likely a naming-convention issue (see §2.2)

For implementation details (transport setup, SDK packages, code shape), continue to `mcp-implementation-patterns.md`.

For ecosystem/discovery (what exists, who uses what), continue to `mcp-ecosystem-landscape.md`.

---

## 14. Sources

- [AWS Labs MCP — Design Guidelines](https://github.com/awslabs/mcp/blob/main/DESIGN_GUIDELINES.md) — the most comprehensive single document; structure, naming, parameter conventions, security, logging
- [Awesome MCP Best Practices — lirantal](https://github.com/lirantal/awesome-mcp-best-practices) — the `<use_case>`/`<important_notes>` description convention, empty-result rule
- [5 Best Practices for Building MCP Servers — Snyk / Liran Tal](https://snyk.io/articles/5-best-practices-for-building-mcp-servers/) — naming standards, command-injection vulnerabilities (real example)
- [MCP Server Naming Conventions — zazencodes](https://zazencodes.com/blog/mcp-server-naming-conventions) — survey data: 90% snake_case, 40% `-mcp` suffix
- [Tool organization — AWS Prescriptive Guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/mcp-strategies/mcp-tool-strategy-organization.html) — `domain-noun-verb` pattern
- [Model Context Protocol — Reference Servers (85.3k stars)](https://github.com/modelcontextprotocol/servers) — see `src/filesystem`, `src/git`, `src/everything` for canonical implementations
- [MCP Spec — Tool annotations](https://modelcontextprotocol.io/specification) — `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`
