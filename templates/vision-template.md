# {Project Name} — Vision

## Mission

{One-sentence mission. The "why this exists" stated as a single load-bearing claim. Example pattern: "Be the {single-best | most useful | most current} {tool / platform / agent} for {specific user / specific market} — a {capability descriptor} with {depth / breadth / signal coverage} no {comparable benchmark} can match."}

## The bar

{What separates this from the obvious comparison points. State the benchmark explicitly + the bar this project sets above it. Pattern: "Not {generic comparison}. The bar is {specific differentiator}. If {trigger condition}, this project covers it. The benchmark is {measurable claim}."}

## Who it serves

**Primary user (v1):** {concrete description of the first user — name + profile + situation + budget + goal}.

**Eventual users:** {description of the broader user base the architecture is built to serve. State explicitly so the v1 build doesn't accidentally narrow the foundation.}

Each user's {relevant per-user state — money / role / risk appetite / goal / time horizon / geographic flexibility / etc.} shapes every recommendation. {Per-user-state branching} is load-bearing.

## Scope

**v1 focus:** {immediate addressable scope — geographic, vertical, market segment, usage envelope}.

**Architectural scope:** {what the framework supports beyond v1 without code changes. State what scales and what doesn't.}

**Out of scope:** {what's deferred and why}.

## The capability surface

The system must collect, store, and reason over **every signal** that materially affects {whatever the project is optimising for}. The categories below are not optional features — they are the minimum surface area:

### {Category 1, e.g. "Plot + structure" / "Audio + transcript" / "Content + metadata"}
- {Bullet list of specific signals + sub-features}
- {Each item should be concrete enough that the team knows what to build}

### {Category 2}
- {Same shape}

### {Category 3}
- {Same shape}

### {Continue per project}

### {Final category — almost always: "Wedges {comparable users} don't use"}

This is the differentiating layer. The project exists to find / surface / produce what no human at scale will catch:

- {Specific wedge 1}
- {Specific wedge 2}
- {Specific wedge 3}
- _(extend per project)_

## {Per-context} awareness

Every recommendation depends on **who is asking** (or **what context applies**). The system holds:

- {Context dimension 1, e.g. "Cash on hand by source"}
- {Context dimension 2, e.g. "Risk appetite"}
- {Context dimension 3, e.g. "Goal — primary residence vs develop-and-sell"}
- {Context dimension 4, e.g. "Time horizon"}
- _(extend per project)_

These live in `lexicon/resources/{user.yml | context.yml | profile.yml}`. Recommendations branch on context: a {output} that is **strong** for {context A} is **avoid** for {context B}.

## The framing

We optimise for, in priority order:

1. **{Priority 1, e.g. "Survival" / "Correctness" / "Privacy"}** — {one-line justification}
2. **{Priority 2, e.g. "Maximum potential profit" / "Throughput" / "Recall"}** — {one-line justification}
3. **{Priority 3, e.g. "Efficiency" / "Latency" / "Cost"}** — {one-line justification}
4. **{Priority 4, e.g. "Wedge exploitation" / "Edge case coverage"}** — {one-line justification}

We **do not** optimise for {anti-priority 1} divorced from {priority above}. We do not optimise for {anti-priority 2} if it requires {capability the user does not have}. We do not optimise for {anti-priority 3} {analogous metric pattern}.

## What {project} is NOT

- {Explicit non-goal 1 — what existing tool already covers this; we don't compete on it}
- {Explicit non-goal 2 — out-of-scope user category and why}
- {Explicit non-goal 3 — out-of-scope feature and why}
- {Explicit non-goal 4 — failure mode the project explicitly refuses}
- _(extend per project)_

## The agent's cognitive frame

The system does not need to think like a {comparable human user}. It is a {super-intelligent / domain-specialised / high-throughput} {analysis tool / generator / orchestrator} with {meaningful capacity descriptor}. It can {parallel capability 1}, {parallel capability 2}, and {scale capability}. It is expected to surface {signals / combinations / edge cases} no {human / generic system} would consider — that is the **point**.

This {cognitive ambition} is paired with **operational discipline**:

- {Discipline 1, e.g. "Never invent (cite or mark unknown)"}
- {Discipline 2, e.g. "Audit-log every {boundary-crossing call type}"}
- {Discipline 3, e.g. "Lexicon-first naming (one canonical name per concept; codegen drives ORM + Zod)"}
- {Discipline 4, e.g. "{N} specialist agents with clear domain ownership; no scope creep"}
- _(extend per project — pair every discipline to a concrete artifact)_

The discipline is what enables the ambition. Without it, the project's outputs cannot be trusted by {downstream consumers — professionals / users / systems / regulators}.

## Success metric

**v1 ({primary v1 user}):** {concrete, measurable v1 success — what does "this worked" look like for the first user}.

**v2+ (broader user base):** {concrete v2+ success — same framework serving a wider set; metric}.

For the platform at scale: {long-term aspiration — how the project's ceiling rises over time}.

## Bar-raising mandate

This is not v1-and-done. Every release expands:

- {Axis 1, e.g. "More signals — more wedges, more datasets, more cross-references"}
- {Axis 2, e.g. "More current data — auto-refresh cadences shrink"}
- {Axis 3, e.g. "Better confidence calibration — missing-data arrays shrink; outputs more honest"}
- {Axis 4, e.g. "Richer per-context personalisation"}
- {Axis 5, e.g. "Wider {scope dimension} coverage"}

The agent set + the lexicon-first discipline are the engine. {Routine cadence — quarterly Drift Register audit, weekly research refresh, monthly eval suite re-run} raises the bar.

The goal is permanence: in {N+1}, {project} is sharper than {N}. {The single best | the most useful | the most current} {project category} — always.

---

## Authoring notes (delete this block before commit)

- Write each section in plain English. No marketing language; no hype.
- The "What this is NOT" section is load-bearing. Be explicit; this is where scope creep gets killed.
- Every operational discipline bullet should map to a concrete artifact in the codebase (lexicon yml, audit log directory, etc.). If a bullet doesn't map, it's policy padding — drop it.
- Pair every aspirational claim with a concrete artifact or metric. "Single best" requires "compared against this benchmark, measured this way."
- Length: aim for 150-220 lines. Above that, you're padding. Below 100, you're under-specified.
- Do not duplicate content from `CLAUDE.md` (operational identity), `PROJECT-DETAILS.md` (tech stack), or domain-research files. VISION is mission + scope + non-goals + success metric — that's it.
