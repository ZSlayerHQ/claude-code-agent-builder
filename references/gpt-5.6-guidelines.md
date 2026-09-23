# GPT-5.6 / Codex ("Sol") Guidelines Reference

The OpenAI-side analog to `anthropic-guidelines-full.md`: the **model-understanding** layer for
the model family this kit uses as its independent cross-check. Built 2026-07-19 via a 3-agent research
wave (OpenAI official docs + comparative/verification research + hands-on dispatch notes). The **operational dispatch layer** (hardened `codex exec`
recipes, long-run spawn patterns, verdict schemas) lives in the `codex-dispatch` skill
(`.claude/skills/codex-dispatch/`) — load that when you actually dispatch; this doc does not repeat it.

> **GPT-6 update (2026-09).** OpenAI now ships **GPT-6 Astra** (`gpt-6-astra`, flagship, GA on the API
> 2026-09-03) and **GPT-6 Sol / Luna** (`gpt-6-sol`, `gpt-6-luna`) — Sol is OpenAI's recommended Codex model, at
> half the 5.6 Sol price. There is no GPT-6 Terra. The 5.6 tiers "remain available during the rollout". This doc's
> prompting doctrine, CLI mechanics and cross-family verification theory still apply; model-specific facts below
> are for the 5.6 tiers unless a row says otherwise, and the `codex-dispatch` skill carries the current lane choice.
> **One measured head-to-head (2026-09-23):** same review prompt on a website compliance audit, both at `medium`,
> read-only. Astra found the most real issues but ranked a false positive first (it miscounted a `../..` import
> as unresolvable, which a read-only run cannot build to check); GPT-6 Sol found every core issue (one partially)
> with zero false positives at about a fifth of Astra's cost. One run each: a data point, not a benchmark.

> **Sol is the outside view.** Consensus among Claude instances multiplies confidence, not truth —
> a model family shares blind spots. A different family (GPT-5.6) is the independent check. That,
> not cost, is the primary reason to use it (see §9, which has the measured backing).

> **Verify fast-moving specifics.** GPT-5.6 went GA 2026-07-09 — days old. Treat every price,
> benchmark, and tier detail as "true at announcement," confirm against live OpenAI docs before
> quoting externally. The durable content (capability shape, prompting doctrine, verification
> theory, dispatch mechanics) is what this doc is for.

---

## 1. The family (GA 2026-07-09 — real, verified)

OpenAI ships **one generation, three durable capability tiers** (the number is the generation;
Sol/Terra/Luna persist across generations):

| Model (API id) | Tier | Best for | Cost /1M in → out (short ctx; long ctx)* |
|---|---|---|---|
| **`gpt-6-astra`** | Next-gen flagship (GA on the API 2026-09-03) | the hardest judgment-heavy reviews and sign-off audits; tool calling only through the Responses API; `none` effort returns 400 | **$10 → $50; $20 → $75** (cached $1.00; cache writes $12.50; Fast mode 2x, none with EU data residency) |
| **`gpt-6-sol`** (2026-09) | GPT-6 mid tier — OpenAI's recommended Codex default ("complex coding and agentic workflows"; `gpt-5.4` → `gpt-6-sol` is the documented migration) | the default verifier lane; at `low`, mechanical / fan-out legs (there is no GPT-6 Terra). Effort `none`–`max` (default `medium`); 1.05M ctx / 922K in / 128K out; Apr 20 2026 cutoff; Chat Completions tool calling only at `none` | **$2 → $10; $4 → $15** (cached $0.20; cache writes $2.50) |
| **`gpt-6-luna`** (2026-09) | GPT-6 fast tier — "focused, repeatable tasks": extraction, classification, structured summaries; `gpt-5.4-mini` → `gpt-6-luna` | effort up to `max`, **no Ultra**; 1.05M ctx; May 18 2026 cutoff | **$0.10 → $0.50; $0.20 → $0.75** (cached $0.01) |
| **`gpt-5.6-sol`** (alias `gpt-5.6`) | Flagship (5.6) | rollout fallback for the Sol lane; best long-context of the 5.6 tiers | **$4 → $20; $8 → $30** (promo through at least 2026-11-21) |
| `gpt-5.6-terra` | Mid | fast/light sweeps, subagent legs; "competitive with GPT-5.5" at lower cost. `gpt-6-sol` at `low` now covers this lane (same input and cached rates, cheaper output) | $2 → $12; $4 → $18 |
| `gpt-5.6-luna` | Fast/cheap | extraction / classification / routing / high volume, and web research; **weak long-context, never big-repo audits** | $0.20 → $1.20; $0.40 → $1.80 |

*Rates verified 2026-09-21/22 against the official developers.openai.com pricing page. **Pricing is two-tier by
context length** (short vs long context columns). The 2026-07-30 cuts (Luna −80%, Terra −20%) are confirmed on the
primary rate card; 5.6 Sol carries a further >20% promotional cut from 2026-08-21, good at least through 2026-11-21 —
re-check after that date. Cache reads for 5.6: Sol $0.40, Terra $0.20, Luna $0.02 (short ctx). Batch and Flex run at
half price; "Priority processing" was renamed **Fast mode** on 2026-07-30 (`service_tier: "fast"`, old
`"priority"` still accepted) at roughly 2x standard rates. Also on the card: `gpt-5.6-cyber` ($12.50 → $75, short
ctx only) under the Daybreak cyber program.*

> **Context window — two numbers, both real.** On the **OpenAI API**, every current model page (`gpt-6-astra`,
> `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-sol/terra/luna`) states a **1,050,000-token context window, 922,000 max
> input, 128,000 max output**. The **272,000** figure in the 2026-08-08 Codex changelog is the **short-context pricing
> boundary** (and the window Codex advertises for the 5.6 tiers under ChatGPT-plan sign-in), not the API window. The
> Codex setting that costs money is `model_auto_compact_token_limit`: on API-key auth every request whose input
> exceeds 272K is billed at the long-context rate (2x input, 1.5x output) for the whole request, so keep auto-compact
> around 200K there. On ChatGPT-plan auth the per-token rate is moot and plan usage is the constraint.

**Effort ladder:** `none → minimal → low → medium
→ high → xhigh → max`, plus **`ultra`** (subagent fan-out, a distinct axis, not deeper thinking;
plan-gated). `reasoning.mode` is a second axis: `standard` (default) vs `pro` (more thorough).

**vs Anthropic Fable 5.1** (`claude-fable-5-1`, $10 → $50): 5.6 Sol is well under half the price and GPT-6 Sol a fifth of it. They are not
substitutes — Fable is Anthropic's *within-family* frontier/creative tier; Sol is the *outside-view*
verifier. Reach for Sol to cross-check a Claude artifact, not to replace a Claude generator.

---

## 2. Capability profile (what to route where)

Public evidence splits into **measured** (benchmarks) and **subjective** (developer taste). Keep them apart.

- **Backend / systems coding — contested, task-shape-dependent.** SWE-bench *Verified* (single, well-scoped
  patches): GPT and Claude are ~tied. SWE-bench *Pro* (multi-file, architectural, real repos): **Claude
  leads clearly**. The recurring read: **GPT/Sol edges on tool-precision, file navigation, and token
  economy; Claude edges on cross-file architectural reasoning.** So "use Sol for backend" is true for
  scoped/systems/tool-precise work, less so for large architectural refactors.
- **Frontend / UI — Claude.** Consistent cross-source developer consensus (design-system consistency,
  "feels like a real product" vs "generic SaaS template"). Use GPT only when a human iterates on the output.
- **Creative / generative brainstorming — genuinely unsettled.** No benchmark; opinion is split both ways.
  This is exactly where a single operator's preference legitimately overrides the (non-existent) consensus.

**Single-operator hands-on read (2026-07, anecdotal — not a study):** Sol > Fable at backend; Sol weaker
at UI/frontend and creative; Sol best as a **hardening layer** (adversarial refute pass on Claude-authored
plans/brainstorms). The frontend/creative reads match public consensus. The backend read **diverges** from
public SWE-bench Pro (which favors Claude on multi-file work) — likely because (a) Sol is newer than the
GPT-5.5 in most public comparisons, or (b) that "backend" workload leaned tool-precision, not architecture.
Treat it as a hypothesis to test on your own work, not a finding.
Flag the divergence; don't smooth it over.

---

## 3. When to dispatch Sol

- **Pre-build plan / migration-runbook review** — adversarial read before code exists.
- **Post-ship verification scan** — multi-file / multi-layer change (drift, siblings, stale assertions).
- **Cross-cutting diagnostic sweeps** — enumerate a class (contract mismatches, deprecated-name residue, consumer lists).
- **Second-opinion / hardening on a design or brainstorm** — e.g. a new project's roster, a lexicon, an architecture call.
- **Backend/systems second opinion** — scoped, tool-precise, systems work.
- **NOT for:** 1-3 line fixes, docs-only changes, frontend/creative generation, anything a grep answers.

**Stage-0 premise check before reviewing a fix/claim:** fetch the disputed artifact's CURRENT state first.
A review validates a design against its premise; it cannot catch a *false* premise — every reviewer is
downstream of the same secondhand report.

---

## 4. Model + effort selection

- **Model (GPT-6, 2026-09):** `gpt-6-sol` for verification / review / plan-hardening; `gpt-6-astra` when a review is the hardest judgment-heavy work and worth 5x the price; `gpt-6-sol` at `low` for fast / mechanical / fan-out legs; Luna only for defined-output extraction and web research (never big-repo audits). The 5.6 tiers are rollout fallbacks. Within the 5.6 family the shape was `sol` judgment-heavy, `terra` fast/mechanical, `luna` extraction.
- **Effort:** OpenAI's recommended GPT-6 starting points are Sol `medium`, Luna `high`, Astra `low` — "reasoning efforts don't map exactly between model generations", so re-test a familiar task one level lower when you switch. Review/verification scans that come back thin → `high`; hardest quality-first audits → `xhigh` (compare `max` only if measured better); mechanical/scoped → `medium`. Migrating from 5.5-era settings, test ONE level lower first — 5.6 often holds quality with fewer tokens.
- **Effort is a tuning knob, not a quality-recovery lever** (OpenAI's own words). If output is wrong, fix the prompt/output contract first; don't just crank effort.

---

## 5. Check your global config before dispatching

**Read your own `~/.codex/config.toml` before trusting any dispatch command in this doc.** It sets
defaults globally, and a permissive config silently overrides the CLI's safe built-in behaviour. The
common trap is a config written for autonomous build work:

```toml
model = "gpt-5.6-sol"
model_reasoning_effort = "high"
model_context_window = 800000
approval_policy = "never"
sandbox_mode = "danger-full-access"     # <- a bare `codex exec` now runs unsandboxed
```

With that config a bare `codex exec` runs with **full filesystem and network access and no approval
prompts** — the opposite of the CLI's built-in `read-only` default, and the opposite of what the
`codex-dispatch` skill's prose assumes.

**Consequence: for any verification or diagnostic dispatch, pass `-s read-only` explicitly.** Do not
rely on the default being safe. Better still, define a review profile and pin it:
`--profile readonly_quiet` holding `sandbox_mode = "read-only"` + `approval_policy = "never"`, so a
script that forgets the override still cannot write.

---

## 6. Codex CLI dispatch mechanics (essentials; skill has the hardened recipes)

- **`codex exec`** = non-interactive/headless. I/O contract: progress → **stderr**, final message → **stdout**
  (clean to pipe). `--json` emits a JSONL event stream (`thread.started` / `turn.completed` / `item.*` /
  `error`) with per-turn token+cache usage — use it for liveness and cost.
- **Prompt in:** positional, or `codex exec -` to make **stdin the whole prompt** (`codex exec - < prompt.md`).
  Inline prompt? Always close stdin (`... < /dev/null`) — a TTY-less pipe with no writer hangs it forever.
- **Deliverable out:** `-o <file>` / `--output-last-message` guarantees the final message lands on disk
  (the model can't "forget"). For gateable verdicts: `--output-schema schema.json -o result.json`, then branch in `jq`.
- **Global-only flags must precede the subcommand.** `-a`/`--ask-for-approval` and `--search` are parsed by
  the top-level `codex` command, NOT by `exec`. Putting them after `exec` is a hard parse error
  (`error: unexpected argument '--ask-for-approval' found`) that kills the run before the model is reached.
  `-s`/`--sandbox`, `-m`, `-c`, `-o`, `-i`, `-p`, `--json`, `--output-schema`, `--skip-git-repo-check` are
  accepted by `exec` itself. Upstream tracks the docs/CLI mismatch in openai/codex #13614 and #26602.
- **Sandbox (`-s`):** `read-only` / `workspace-write` (default low-friction; edits in-workspace, net off) /
  `danger-full-access`. **Approval** is an independent axis: `untrusted` / `on-request` / `never` / `granular`.
  Canonical safe review combo, verified on codex-cli 0.144.1 (2026-07-27):
  ```bash
  codex exec -s read-only -m gpt-5.6-sol -c model_reasoning_effort=high -o out.md - < prompt.md
  ```
  `exec` is non-interactive and already runs without prompting, so an approval flag is usually redundant.
  When you do need it explicitly, either put it in global position (`codex -a never exec …`) or pass it as
  config, which `exec` DOES accept (`-c approval_policy=never`). All three forms tested directly.
  **Removed, not merely deprecated (Codex changelog, 2026-08-08): `codex exec --full-auto`.** Use
  `--sandbox workspace-write`; a script still passing `--full-auto` now fails to parse.
  `--dangerously-bypass-approvals-and-sandbox` (`--yolo`) = neither.
- **Network** is off even in `workspace-write`; enable via `[sandbox_workspace_write] network_access = true`,
  constrain with the `network_proxy` domain allow/deny feature (proxy alone grants nothing).
- **Config/CI:** `--profile <name>` layers `$CODEX_HOME/<name>.config.toml`; `--ignore-user-config` /
  `--ignore-rules` for hermetic runs; `-c key=value` per-run overrides; MCP with `required = true` hard-fails
  the run instead of degrading silently.
- **Project instructions:** `AGENTS.md` (Codex walks root→cwd, concatenating). **MCP:** `codex mcp add <name> -- <cmd>`
  (stdio) or Streamable-HTTP remote. **Subagents:** on by default, `/agent` to inspect; cost more tokens — the
  dispatcher must define division of labor + join condition + output contract (same discipline as the research-wave dispatch pattern).
- **Long runs (>~8 min) under the Claude Code harness:** the Bash tool caps at 10 min and can reap background
  jobs — use the skill's WMI-spawn scripts + the write-early (`STATUS: IN PROGRESS` first) protocol. Short runs: plain background is fine.
- **Re-verified 2026-09-21 on the official non-interactive page:** `codex exec` still documents `--output-schema` plus `-o` for structured deliverables and prompt-plus-stdin piping (`npm test 2>&1 | codex exec "..."`); no flag removals since 2026-08-08 were found. A reported `--approve-for-me` flag stays unverified until it shows in `codex exec --help`.
- **Model availability:** GPT-6 Sol / Luna appear in Codex "when available" to your plan and client — run a one-line smoke (`codex exec -m gpt-6-sol ... < /dev/null`) before relying on them. GPT-5.4 left Codex-with-ChatGPT sign-in on 2026-08-31 and **GPT-5.5 leaves it on 2026-10-14** (both stay on the API).

---

## 7. Prompting GPT-5.6 (differs from Claude)

- **Describe the destination, not the route** — goal + hard constraints + explicit output contract; drop
  step-by-step prescription. Reasoning models plan better than they follow scripts.
- **State each instruction once.** Repeating "do not modify" / "ask first" now causes spurious approval pauses.
- **Name file paths explicitly** — the CLI can't see your conversation or open files.
- **Don't say "be concise"** (5.6 is terse by default; it over-truncates). Use the `text.verbosity`
  parameter for a default level; use prose only for task-specific structure. State preserve-vs-omit priority instead.
- **Plan/reflect around tool calls** — the documented "plan extensively before each function call, reflect on
  outcomes" nudge stops mechanical call-chaining without goal-checking.
- **Include a premise-challenge layer** in any review/verify prompt — ask it to REFUTE the strongest version of
  your framing, not to "review" it (see §9). This is the single highest-leverage line in a verifier prompt.
- **Long agentic loops:** tag messages with `phase` (`commentary` vs `final_answer`) or use `previous_response_id`,
  so an intermediate preamble isn't mistaken for the final answer.
- Leaner prompts reportedly outperform elaborate scaffolding (secondary sources cite ~+10-15% eval / −41-66% tokens — directional, unverified against a primary source).

**GPT-6 Astra addendum (official prompt guidance, verified 2026-09-21).** Astra follows longer instructions better than the 5.6 family but is MORE sensitive to unclear or conflicting guidance in context: a skill file that contradicts the task can make it pause and block work early. State precedence explicitly (the official line: "The user's instructions take precedence over guidelines provided in a skill. If explicit user instructions conflict with a skill's instructions, prioritize the user's instructions."), and when a dispatch stalls, ask it to name and quote the exact instruction that caused the pause. API rules that also bite through Codex config: `reasoning_effort = "none"` returns 400 (start at `low` when migrating from `none`/`minimal`); `temperature`, `top_p` and `top_logprobs` are rejected; tool calling needs the Responses API; mid-conversation effort changes go through `configuration_update` items so the cached prefix survives.

---

## 8. Structured outputs = machine-gateable verdicts

To make a GREEN/RED verdict a program can branch on (not "probably-valid-ish JSON"): **Structured Outputs**
with strict JSON Schema — `response_format: {type:"json_schema", json_schema:{strict:true, schema:…}}` (Chat) or
`text.format` (Responses). This is what `codex exec --output-schema` rides on.
- Supported schema surface: String, Number, Boolean, Integer, Object, Array, Enum, `anyOf`. **Not** supported:
  `allOf` / `not` / `if`-`then`-`else` / `dependentRequired` — lint your schema, don't discover at runtime.
- **`refusal` gotcha:** a safety refusal does not match your schema. Always check the `refusal` field before
  trusting `parsed` — a downstream step that blindly trusts a "verdict" blob will misread a refusal.
- SDK helpers: Pydantic (Python) / Zod (TS). Recommend starting new schemas at `gpt-5.6`.

---

## 9. Why cross-family verification works (the load-bearing "why")

Not mysticism about diversity — correlated-error statistics:

- **Family bias is measured, not hypothesized.** Judges favor same-family outputs ("Justice or Prejudice",
  arXiv:2410.02736); self-preference has dedicated measurement methods ("Play Favorites", arXiv:2508.06709).
- **Ensembling same-family judges reduces *variance*, not *shared bias*.** Three separate Claude calls cut noise
  but don't touch a blind spot the whole family shares. "Multiplying confirmations from correlated sources
  multiplies apparent confidence, not independence." (Adaline; arXiv:2604.07650 formalizes verifier independence.)
- **So a second Claude confirming a first is *consistency*, not *correctness*.** A GPT-family verifier has a
  materially different failure-mode distribution, so it can catch the class of error Claude's family systematically
  under-weights. That is the whole value of the Sol cross-check.
- **Instruct the verifier to REFUTE, not review.** Ratify-by-default framing invites sycophancy even across
  families. Steelman-then-refute the *strongest* version of the plan; separate empirical claims (falsifiable)
  from value/tradeoff judgments. (Steelman; "Ask Don't Tell" arXiv:2602.23971; "Who Flips?" arXiv:2606.16011.)
- **Caveat:** cross-model *debate* has its own failure modes (persuasion/tone swaying correctness — arXiv:2509.05396).
  Prefer structured independent-rubric grading over free-form debate.

---

## 10. How this informs generated projects

- **Route by task shape:** Sol for backend/systems/verification/plan-hardening; keep frontend + creative
  generation on Claude. It's a tie-breaker on coding, a clearer call on frontend/creative.
- **A true independence guarantee (security review, pre-ship plan audit) must come from a different family** — never from a second Claude pass.
- **Verdict conventions are three-valued:** per-layer `GREEN/AMBER/RED` + one `Overall` of `GREEN` (auto-pass) /
  `RED` (block) / `READY-WITH-CHANGES` (triage — fold changes, then proceed). A `jq` gate on `=="GREEN"` alone
  silently converts triage into a block; branch on all three.
- **Programmatic Tool Calling (PTC)** fits bounded, tool-heavy runs where code filters/joins/ranks many results
  into a small output. Prefer direct calls when one call suffices, outputs are already small, the model needs to
  stay in the loop between calls, or citations must be preserved. Resource savings only count if it still passes evals.
- Reports are claims-about-code unless the run executed something — require quoted command output for any runtime
  claim, or keep the run read-only so the report is honest by construction.

---

## Sources (primary)

- OpenAI: [GPT-5.6 announcement](https://openai.com/index/gpt-5-6/) · [Previewing Sol](https://openai.com/index/previewing-gpt-5-6-sol/) · Codex docs ([noninteractive](https://developers.openai.com/codex/noninteractive), [sandboxing](https://developers.openai.com/codex/concepts/sandboxing), [approvals/security](https://developers.openai.com/codex/agent-approvals-security), [subagents](https://developers.openai.com/codex/agent-configuration/subagents)) · API guides ([reasoning](https://developers.openai.com/api/docs/guides/reasoning), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [tools+MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp), [prompt guidance](https://developers.openai.com/api/docs/guides/prompt-guidance)) · [openai/codex](https://github.com/openai/codex)
- Verification theory: arXiv 2410.02736, 2508.06709, 2604.07650, 2602.23971, 2606.16011; Adaline LLM-as-judge bias; Steelman.
- Hands-on: the `codex-dispatch` skill; `~/.codex/config.toml`; `codex-cli 0.144.1` (`codex exec --help`).
- Single-operator production experience, 2026-07 — labeled anecdotal wherever cited.

---

*Update 2026-09-23 — GPT-6 generation folded in, verified against the official developers.openai.com model pages, pricing page, reasoning guide and Codex models / non-interactive pages: GPT-6 Astra / Sol / Luna rows and the 5.6 re-pricing in §1; the 1.05M-window-vs-272K-billing-boundary clarification; `--full-auto` removal; the 5.4 / 5.5 Codex sign-in retirements; the Astra prompting addendum (§7); GPT-6 lane and effort guidance (§4); one measured Astra-vs-GPT-6-Sol head-to-head (header).*

*Correction 2026-07-27 (§6, Codex CLI dispatch mechanics): the previously documented "canonical safe
review combo" was `--sandbox read-only --ask-for-approval never`, which does not parse. `-a` /
`--ask-for-approval` is a global-only flag; after `exec` it is a hard error that kills the run before
the model is reached. Found by an actual failed dispatch, then confirmed by direct test on codex-cli
0.144.1: global position parses, post-subcommand is rejected, and `-c approval_policy=never` is
accepted by `exec`. Upstream tracks the docs/CLI mismatch in openai/codex #13614 and #26602. The
lesson generalises: `--search` was already documented as global-only, and the same rule governs `-a`.*
