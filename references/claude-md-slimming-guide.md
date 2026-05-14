# CLAUDE.md Slimming Guide

> **When to consult this:** before authoring or auditing the CLAUDE.md / settings.json for any generated project. Apply the principles below to keep the AI's per-turn loaded context lean. Every token in CLAUDE.md is read on every Session Start *and* re-paid on every compact-rehydrate.

This guide codifies the token-frugality principles applied during the May 2026 sweep of the agent builder. The Anthropic-side anchor is `anthropic-guidelines-full.md` §3 (Prompting Best Practices) + §8 (Anti-Patterns) — read those alongside this guide for the *why* behind each rule.

---

## Operating principles

### 1. Don't restate Anthropic policy

**Rule:** If a behaviour is already baked into Claude Opus 4.7's system prompt (refusal of harmful requests, OSS-licence respect, secrets handling, copyright caution), do NOT restate it in CLAUDE.md.

**Why:** Anthropic ships these rules at the model level. CLAUDE.md restatements buy nothing except token cost on every turn. The model's compliance ceiling is set by Constitutional AI, not by your prose.

**Examples to drop:**
- "Never assist with malware, exploits, or unauthorised access" — already enforced at model level
- "Never reveal API keys or secrets to the user" — already enforced
- "Respect copyright; don't reproduce copyrighted works in full" — already enforced
- Long forbidden-targets lists when the AUP / domain norms already make them off-limits

**Examples to KEEP:**
- Project-specific compliance scaffolding the model can't infer (HIPAA, PCI-DSS, GDPR if commercial-scope)
- Domain-specific safety rules that go *beyond* policy (e.g. "patient data never appears in logs even if asked")

### 2. Drop no-op deny rules

**Rule:** Every entry in `permissions.deny` must reference a tool that actually exists. Audit before committing.

**Why:** Deny rules for nonexistent tools (`Bash(rm -rf *)` is real; `mcp__scrapling__get` is not — scrapling exposes only 6 stealth tools) are pure cargo cult. They add noise to settings.json review and make the deny list harder to scan.

**How to apply:** When adding a deny rule for an MCP tool, check the MCP server's actual tool surface first. `npx <mcp> --list-tools` or open the MCP's source / README.

### 3. Tell Claude what TO DO, not what NOT to do

**Rule:** Phrase rules positively. Replace prohibitions with directives.

**Why (Anthropic §3):** Positive framing generalises better. "Write in flowing prose paragraphs" beats "Do not use markdown" because the directive shows the desired shape; the prohibition leaves a void.

**Bad → Good:**
- "Never speculate about unread files" → "Read the cited file before answering questions about it"
- "Don't add unnecessary abstractions" → "Match implementation complexity to the task's scope"
- "Avoid over-delegating to subagents" → "Delegate to subagents when work involves 3+ independent workstreams or 10+ file reads" (this also addresses Opus 4.7's under-spawn risk per §6)

### 4. Explain WHY, not just WHAT

**Rule:** Every rule that's not self-evident gets a brief reason. Use a `**Why:**` line or a parenthetical.

**Why (Anthropic §3):** Reasons let Claude generalise to edge cases. Without a reason, the rule becomes a literal pattern-match — when the situation looks 90% similar, the model gets stuck deciding whether to apply or not. With a reason, the model judges from intent.

**Bad:** "Never edit tests to make them pass."

**Good:** "Never edit tests to make them pass. **Why:** the test is the spec; weakening assertions to achieve green hides real bugs. If a test feels wrong, surface the conflict to the operator instead."

### 5. Drop anti-laziness scaffolding

**Rule:** Strip "CRITICAL:", "You MUST", "IMPORTANT:", "I will be thorough", "let me carefully consider" framing from CLAUDE.md.

**Why (Anthropic §3, §8):** These framings were calibrated for older models that needed pushing. Opus 4.6+ over-triggers on them — produces inflated thinking tokens, paranoid prose, lower quality output. Speak to the model as a peer, not as a junior auditioning.

**Bad:** "CRITICAL: You MUST verify your work before claiming a task is done. This is non-negotiable."

**Good:** "Verify before claiming done. Run the linter; run the tests; confirm the file actually contains what you intended."

### 6. Trim policy padding

**Rule:** Drop sections that read like legal disclaimers without shaping behaviour.

**Why:** "Refuse to engage with illegal scraping targets" reads to a human as policy ass-covering. It doesn't make Claude *more* compliant — the model is already trained on these refusals. The only effect is token bloat + reviewer fatigue.

**Test:** For every section ≥3 lines, ask: "If I delete this, what concrete behaviour would change?" If the answer is "nothing the model wouldn't do anyway," delete it.

### 7. State scope explicitly (Opus 4.7-specific)

**Rule:** When a rule has a scope ("apply this to every file in X"), say *every* — Opus 4.7 is more literal than 4.6.

**Why (Anthropic §3):** 4.7 reads "the clause" as singular when 4.6 would have inferred "all clauses." At `effort: xhigh` the gap narrows but doesn't close. Explicit scope is always safe; ambiguous scope is sometimes wrong.

### 8. Use positive delegation triggers (Opus 4.7-specific)

**Rule:** In CLAUDE.md sections that describe agent / subagent delegation, write "Delegate to {agent} when {condition}" — not "Avoid over-delegating to {agent}."

**Why (Anthropic §6):** 4.7 under-spawns subagents by default (reversed from 4.6's over-spawn behaviour). Negative framings push the model further from the desired behaviour. Positive triggers calibrate it correctly.

### 9. Action vs suggestion clarity

**Rule:** Disambiguate "do X" from "consider X" in operator-facing prose AND in CLAUDE.md instructions to the model.

**Why (Anthropic §5):** 4.6+ follows instructions precisely. "Could you look at this function?" gets a *look*, not an *edit*. If you want action, say action; if you want analysis, say analysis. This calibration belongs in CLAUDE.md's Operational Principles so the model checks the operator's intent rather than assuming.

### 10. Reversibility — operational, not prose

**Rule:** Pair the reversibility principle with a deny list of destructive ops. Don't rely on prose alone.

**Why:** A CLAUDE.md sentence "be careful with destructive operations" is easier to override than a `permissions.deny` entry that blocks `Bash(git reset --hard*)`. Use both: the prose explains *intent* (so the model judges new situations), the deny list enforces *the obvious cases* (so the model can't accidentally trigger them).

---

## Targets

### Line counts

| Artifact | Soft target | Hard cap |
|---|---|---|
| Generated project CLAUDE.md | 80-150 lines | 250 lines |
| Generated project settings.json | 30-60 lines | 100 lines |
| Per-agent file (`.claude/agents/*.md`) | 60-80 lines | 120 lines |
| Per-skill file (`.claude/skills/*/SKILL.md`) | 30-100 lines | 200 lines |
| VISION.md | 150-220 lines | 280 lines |

Above the hard cap = audit + trim. The act of trimming surfaces dead prose every time.

### Token cost reality check

A 150-line CLAUDE.md is roughly 1500-2500 tokens (Opus 4.7 tokenizer is 1.0-1.35× heavier than 4.6 — see `anthropic-guidelines-full.md` §1). That cost is paid:
- On every Session Start
- On every PostCompact rehydration
- Quietly when the cache TTL expires (default 5min; agent-builder-generated projects override to 1h via `ENABLE_PROMPT_CACHING_1H=1`)

A 350-line CLAUDE.md doubles that. Compounded across a long session it's the difference between "responsive" and "noticeably slow."

---

## Audit checklist

Run when authoring or reviewing a CLAUDE.md / settings.json:

- [ ] **AUP redundancy check** — for every prohibition, ask: "Is this already in Claude's system prompt?" If yes, delete.
- [ ] **Deny-rule reality check** — for every `permissions.deny` entry, confirm the tool actually exists.
- [ ] **Positive-framing scan** — search for "Never", "Don't", "Avoid". For each hit, can it be rephrased as a directive?
- [ ] **Why-line check** — for each non-obvious rule, is there a `**Why:**` or parenthetical reason?
- [ ] **Anti-laziness scrub** — search for "CRITICAL:", "You MUST", "IMPORTANT:", "be thorough". Strip.
- [ ] **Padding scan** — for every section ≥3 lines, would deletion change behaviour? If no, delete.
- [ ] **Delegation triggers** — every "avoid over-delegating" → "delegate when {positive condition}".
- [ ] **Action/suggestion clarity** — does CLAUDE.md tell the model how to disambiguate operator intent?
- [ ] **Line-count check** — under the hard cap?
- [ ] **Drift guard** — for templates, run `scripts/check-template-paths.sh` to confirm no agent-builder-internal citations leaked.

---

## Worked examples from the May 2026 sweep

### Example 1: scrapling deny rules

**Before (settings-template.json):**
```json
"deny": [
  "Bash(...)",
  "mcp__scrapling__fetch",
  "mcp__scrapling__bulk_fetch",
  "mcp__scrapling__get",
  "mcp__scrapling__bulk_get"
]
```

**After:** all 4 mcp__scrapling entries removed. Scrapling exposes only `stealthy_fetch`, `bulk_stealthy_fetch`, `open_session`, `close_session`, `list_sessions`, `screenshot`. The deny entries were for tools that don't exist — pure cargo cult.

### Example 2: forbidden-targets prose drop

**Before:** CLAUDE.md domain-constraints section listing every third-party site Claude should refuse to scrape (a hand-curated blocklist) plus ~30 lines of policy framing explaining why each was forbidden.

**After:** entire section deleted. Reasoning: AUP-redundant. Anthropic's system prompt already enforces "don't scrape sites that prohibit it" through ToS-awareness training. The blocklist was operator-facing reassurance, not model behaviour shaping. Operators read the AUP; the policy padding wasn't earning its tokens.

### Example 3: positive delegation rewrite

**Before (a generated CLAUDE.md):**
"Avoid over-delegating to the researcher agent — the orchestrator should handle simple queries directly."

**After:**
"Delegate to the researcher agent when (a) the task requires reading 5+ external sources, (b) the operator explicitly asks for research, or (c) the question crosses 3+ independent territories that benefit from parallel investigation."

The rewrite calibrates Opus 4.7 correctly (positive trigger) AND explains why (parallel work, multi-source, explicit ask) so the model can judge edge cases.
