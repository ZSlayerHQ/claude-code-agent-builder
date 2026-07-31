# GPT-5.6 / Codex ("Sol") Guidelines Reference

The OpenAI-side analog to `anthropic-guidelines-full.md`: the **model-understanding** layer for
the model family this kit uses as its independent cross-check. Built 2026-07-19 via a 3-agent research
wave (OpenAI official docs + comparative/verification research + hands-on dispatch notes). The **operational dispatch layer** (hardened `codex exec`
recipes, long-run spawn patterns, verdict schemas) lives in the `codex-dispatch` skill
(`.claude/skills/codex-dispatch/`) — load that when you actually dispatch; this doc does not repeat it.

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

| Model (API id) | Tier | Best for | Cost /1M in → out* |
|---|---|---|---|
| **`gpt-5.6-sol`** (alias `gpt-5.6`) | Flagship | judgment-heavy verification / review / audit / plan-hardening; best long-context | **$5 → $30** |
| `gpt-5.6-terra` | Mid | fast/light sweeps, subagent legs; "competitive with GPT-5.5" at lower cost | $2.50 → $15 |
| `gpt-5.6-luna` | Fast/cheap | extraction / classification / routing / high volume; **weak long-context — never big-repo audits** | $1 → $6 |

*Prices per the OpenAI announcement — verify live. **Effort ladder:** `none → minimal → low → medium
→ high → xhigh → max`, plus **`ultra`** (subagent fan-out, a distinct axis, not deeper thinking;
plan-gated). `reasoning.mode` is a second axis: `standard` (default) vs `pro` (more thorough).

**vs Anthropic Fable 5** (`claude-fable-5`, ~$10 → $50): Sol is roughly half the price. They are not
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

- **Model:** `sol` for judgment-heavy/long-context; `terra` for fast/light/mechanical or fan-out legs; `luna` only for defined-output extraction (never big-repo audits).
- **Effort:** review/verification scans → `high`; hardest quality-first audits → `xhigh` (compare `max` only if measured better); mechanical/scoped → `medium`. Migrating from 5.5-era settings, test ONE level lower first — 5.6 often holds quality with fewer tokens.
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
  Deprecated: `--full-auto` (use explicit `--sandbox workspace-write`).
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

*Correction 2026-07-27 (§6, Codex CLI dispatch mechanics): the previously documented "canonical safe
review combo" was `--sandbox read-only --ask-for-approval never`, which does not parse. `-a` /
`--ask-for-approval` is a global-only flag; after `exec` it is a hard error that kills the run before
the model is reached. Found by an actual failed dispatch, then confirmed by direct test on codex-cli
0.144.1: global position parses, post-subcommand is rejected, and `-c approval_policy=never` is
accepted by `exec`. Upstream tracks the docs/CLI mismatch in openai/codex #13614 and #26602. The
lesson generalises: `--search` was already documented as global-only, and the same rule governs `-a`.*
