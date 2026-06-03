---
name: security
description: Comprehensive security discipline for writing AND reviewing code — find trust boundaries, match untrusted input to dangerous sinks, enforce auth/authz/ownership on every state-changing path, treat secrets as leaked, fail closed. Includes a 10-point threat-model checklist, audit categories (CWE-mapped), and severity calibration. Activates when writing or reviewing code that touches untrusted input, auth, secrets, external calls, IaC/CI, or on "security review" / "is this secure?".
---

# Security Discipline

> **Treat every untrusted input as adversarial. Treat every trust boundary as a contract that must be enforced. Treat every secret as already leaked unless proven otherwise. When in doubt, fail closed and surface the risk.**

Security is a property of every line, not a feature added at the end. On every read and every write, ask: *what would an attacker do here?*

> **Shelf-life note:** specific crypto parameters (hash rounds, algorithms) and CWE references below are current best practice as of 2026 but evolve — verify against current OWASP / NIST guidance for anything safety-critical. The *disciplines* are durable.

## The Five Disciplines

### 1. Find the trust boundaries
For every piece of code, identify where data crosses a boundary:
- **Untrusted → trusted**: HTTP body → DB query, env → command, file → render, network → eval, repo file → execute
- **Tenant A → Tenant B**: any `userId` from URL/JWT must filter all queries by ownership
- **Internal → external**: outbound fetch, webhook delivery, log shipping (PII?), email send, third-party API
- **Build-time → runtime**: dependencies, container images, CI actions, package scripts

Every boundary needs a contract. Every contract needs enforcement. Missing enforcement is the bug.

### 2. Match input to sink
Vulnerabilities live where untrusted input reaches a dangerous sink. Pattern-match `(source, sink)` pairs:

| Sink | Risk | Defense |
|---|---|---|
| `eval`, `new Function`, `vm`, `exec` | Code injection | Don't. Use a parser. |
| `child_process.exec`, `subprocess(shell=True)` | OS command injection | `execFile`/array args, no shell |
| SQL string-concat / `$queryRawUnsafe` / `sql.raw` | SQL injection | Parameterized queries |
| Mongo `$where`, splatted query operators | NoSQL injection | Type-coerce, allowlist operators |
| `dangerouslySetInnerHTML`, `innerHTML`, `v-html` | XSS | Escape, or DOMPurify |
| `fetch(userUrl)`, `requests.get` | SSRF | Allowlist host + private-IP block + protocol pin |
| `fs.readFile(userPath)`, `send_file` | Path traversal | `path.resolve` + prefix check |
| `pickle.loads`, `yaml.load`, `ObjectInputStream` | Deserialization RCE | JSON + schema; never on untrusted bytes |
| `redirect(userUrl)` | Open redirect | Allowlist of internal paths |
| `Object.assign(target, parsed)`, `_.merge` user data | Prototype pollution | `Object.create(null)`, key allowlist |
| Server Action / RPC handler first line | Missing auth | `await auth()` then ownership check |

### 3. Auth on every state-changing path
Three checks, every time:
1. **Authentication** — *who is this?* Verified server-side, not just claimed in headers
2. **Authorization** — *are they allowed?* Not just role, but **ownership**: `WHERE userId = current_user_id`
3. **Input validation** — *is this shape what we expected?* Schema (zod, Pydantic, class-validator) **before** any side effect

Flag immediately: handlers whose first non-trivial line is not an auth check; `findById(id)` returned without ownership filter (IDOR); `User.update(req.body)` (mass assignment); admin endpoints relying on URL obscurity.

### 4. Secrets are already leaked
Treat any secret that has touched code, logs, container env, CI logs, or client bundles as **compromised**. Plan for rotation as default, not emergency.
- High-entropy strings in code → flag
- `NEXT_PUBLIC_*` (or any client-exposed prefix) containing private values → flag
- Secrets in Docker `ENV` directives → flag (image layer)
- Secrets in k8s `env: value:` → flag (use `secretRef`)
- Secrets echoed in log lines or error responses → flag
- Committed to git history (even if removed) → flag with rotation note

### 5. Fail closed, log loudly, blast-radius small
- **Default deny**: NetworkPolicy, IAM, security groups, k8s PSA — start at zero, grant explicitly
- **Failure mode = deny**: a thrown exception in auth must yield 401/403, never proceed-as-anonymous
- **Sanitized errors**: never return DB errors, stack traces, or filesystem paths to clients
- **Audit-log every security event**: auth attempts, denies, admin actions, key use
- **Blast-radius minimization**: if this code is fully owned, what else falls?

## The Threat-Model Checklist

Before declaring code "secure," answer all 10:
1. **Trust boundaries** — list every untrusted-to-trusted crossing
2. **AuthN/AuthZ** — identity verified server-side; ownership (not just role) checked
3. **Input validation** — schema validates type/shape/length/charset before any side effect
4. **Output encoding** — escaped for the destination context (HTML/SQL/shell/log/URL/header)
5. **Secrets** — in env/vault/KMS, never in code/logs/client/error responses; rotation plan
6. **Failure mode** — fails closed (deny) on error
7. **Blast radius** — if owned, what else falls? (Egress, FS, sibling tenants, cloud metadata, CI)
8. **Supply chain** — deps pinned (lockfile + SHA), audit clean
9. **Logging & detection** — log line for security events, sensitive data redacted
10. **Replay protection** — idempotency keys, nonces, CSRF tokens, rate limits

If any answer is "I don't know," the code is **not** cleared.

## Audit Categories (when reviewing)

1. **Injection** (CWE-79/89/78/94/77) — SQL, NoSQL, OS command, code, template, LDAP, XPath
2. **Broken Access Control** (CWE-862/863/639/352) — IDOR, BOLA, BOPLA, missing auth, mass assignment, CSRF
3. **Cryptographic Failures** (CWE-327/328/330/916) — MD5/SHA1, weak password hashing, `Math.random()` for tokens, ECB, JWT `alg: none`, HS256/RS256 confusion
4. **SSRF** (CWE-918) — user-controllable URL without allowlist + private-IP block + protocol pin
5. **Path Traversal** (CWE-22) — user paths without resolve+prefix-check
6. **Insecure Deserialization** (CWE-502) — `pickle.loads`, `yaml.load` (not safe_load), `ObjectInputStream`, `vm2`
7. **XSS** (CWE-79) — `dangerouslySetInnerHTML`, unsafe markdown, DOM-based via `location.hash`
8. **Authentication & Session** (CWE-287/384/521) — plaintext compare, JWT in localStorage, missing rate limit, weak reset tokens
9. **Hardcoded Secrets** (CWE-798) — cloud keys, VCS/CI tokens, payment keys, model-provider keys, JWTs, private keys
10. **Cloud Misconfig** — public object storage, IAM `*:*`, SG 0.0.0.0/0:22, instance-metadata v1, missing encryption
11. **Container/K8s** — `privileged: true`, `runAsUser: 0`, `hostNetwork: true`, missing limits, `image:latest`
12. **CI/CD** — `pull_request_target` + checkout fork code, untrusted event fields in shell, mutable Action tags, `permissions: write-all`
13. **Supply Chain** — unpinned Action tags, `:latest` Docker tags, missing SRI, `curl … | sh`, postinstall scripts
14. **Open Redirect** (CWE-601), **ReDoS** (CWE-1333), **Server Action authz**, **Sensitive Data Exposure** (CWE-200), **CSRF/CORS/Cookies** (CWE-352)
15. **LLM-specific** (when applicable) — output to a dangerous sink, excessive agency, secrets in system prompt, prompt-injection via retrieved/tool content

## Severity Calibration

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | Direct RCE / full data exposure / auth bypass / mass exfiltration. Fix before merge. | SQLi on auth route, RCE via deserialization, hardcoded prod credential, public object store with PII |
| **High** | Significant data exposure / privilege escalation / DoS / IDOR. Fix this sprint. | XSS on authenticated page, SSRF without metadata block, missing ownership check, weak password hashing |
| **Medium** | Likely-exploitable but limited blast radius, or requires interaction. | Open redirect, missing CSRF on low-impact route, verbose errors, missing login rate limit |
| **Low** | Defense-in-depth gap. | Missing security header, missing HSTS, weak password policy, missing audit log |
| **Info** | Best-practice deviation worth noting. | Outdated lib (no CVE), inconsistent error handling |

Calibrate to **production impact**, not theoretical purity. `Math.random()` for an element ID is Info; the same code for a session token is Critical.

## Reading vs Writing

**Reading** (review): scan sinks, trace input source, check auth on every state-changing handler, note unsafe library APIs, check IaC for cloud/k8s misconfigs, check lockfiles. Surface findings with severity, file:line, and a concrete fix.

**Writing** (generation): parameterized queries always; schema validation at every boundary; auth check as first line of every state-changing handler; scope queries by ownership; no secrets in source; strong, current-standard crypto (a memory-hard or vetted password hash at sufficient cost; authenticated encryption; asymmetric JWT alg; CSPRNG for tokens — verify current parameters); sanitize HTML output; SSRF protection on any user-controllable URL; container non-root + drop ALL caps + read-only root FS; CI pinned to SHA + `permissions: read-all` default. **Security headers (CSP/HSTS/X-Frame-Options/etc.) are owned here** — other skills (e.g. `consent-cmp`) reference this skill rather than re-implementing them.

## When You're Unsure

1. **State the concern.** "I see `db.query(`...${x}`)` — is `x` user-controllable?"
2. **Trace the input.** Is `x` from `req`, env, DB, constant?
3. **Ask** if you can't determine source.
4. **Default to suspicious.** Flag as Medium pending clarification rather than silently passing.

You are a senior reviewer. Senior reviewers don't approve what they don't understand.

## One-Line Distillation

> **Untrusted input → dangerous sink without sanitization is the bug. Find the pair. Break the chain.**
