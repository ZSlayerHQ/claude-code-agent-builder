# Research Wave Dispatch Pattern

Reference for the agent builder on how to design + run research-heavy phases in generated projects. Pattern validated on a real 5-wave dispatch that produced 26 territory files + 1 master synthesis (27 total markdown files in `docs/research/`).

## The pattern

When a project needs deep research across multiple orthogonal territories before code work can begin, dispatch the work as **a wave of parallel subagents**, each owning one territory, each writing to a numbered file in `docs/research/`. After the wave returns, synthesise across the wave into `docs/research/00-recommendations.md`.

```
┌──────────────────────────┐
│  Wave dispatch (parallel) │
└──────────────────────────┘
            │
   ┌────────┼────────┐────────┬────────┐
   ▼        ▼        ▼        ▼        ▼
 subagent  subagent  subagent  subagent  subagent
   1        2        3        4        5
   │        │        │        │        │
   ▼        ▼        ▼        ▼        ▼
 01-X.md  02-X.md  03-X.md  04-X.md  05-X.md
   │        │        │        │        │
   └────────┴────────┴────────┴────────┘
                     │
                     ▼
          Synthesise -> 00-recommendations.md
```

## When to use the pattern

Use a wave when:

- The research surface is **≥ 5 orthogonal territories** (no shared state between them, no cross-dependency in conclusions)
- Each territory needs ≥ 30 minutes of focused work — short enough that overhead matters, long enough that parallelism pays
- The output of each subagent is a **structured markdown file**, not a database write or code edit
- The synthesis stage will fold findings into a single recommendation set the rest of the project depends on

Do NOT use a wave when:

- The territories depend on each other (Wave 1's output changes Wave 2's question — these must be sequential)
- A single researcher can hold the whole surface in head (< 4 territories)
- The work is implementation, not research — wave-dispatch is a research pattern; for implementation use specialist agents + Plan mode

## Planning the wave

Before dispatch, write the wave plan as 3-6 bullet points:

1. **Why** — what decision is this wave informing
2. **Territories** — 3-10 orthogonal slices of the surface. Each gets one subagent.
3. **Output shape** — what each subagent must write (sections, length target, citation style)
4. **Synthesis hook** — how the master synthesis (`00-recommendations.md`) will fold these findings together
5. **Next-wave triggers** — what findings from this wave would justify a Wave 2

Each subagent prompt should:

- State the territory in one sentence ("Cover the third-party data sources for {domain}: {API 1}, {API 2}, {API 3}, etc.")
- Pin the output file (`docs/research/NN-{topic}.md`)
- Pin the output sections (e.g. "Question / Sources / Findings / Comparison / Recommendation / Trade-offs")
- Cap the length ("aim for 400-800 lines; cite every claim")
- Forbid scope creep ("if you find a territory outside your slice, note it for follow-up, do not investigate")

## File numbering across waves

`NN-{topic}.md` where `NN` is a 2-digit zero-padded integer, starting at 00 for the master synthesis.

- Wave 1: 01-…, 02-…, 03-…, 04-…, 05-…
- Wave 2: 06-…, 07-…, 08-…, 09-…, 10-…
- Wave 3: 11-…, 12-…, 13-…, 14-…
- Etc.

The wave is metadata in the README table; the file numbers are sequential across all waves. This way reading order is deterministic; the table tells you which wave each file came from.

## After the wave returns

Three steps before declaring the wave complete:

1. **Update `docs/research/README.md`** — add a row per file, status `complete`, with the subagent owner + date
2. **Update or create `00-recommendations.md`** — fold the wave's findings into the master synthesis. State which decisions were made vs which remain open
3. **Commit the wave as one unit** — `feat(research): wave N — {short summary}`. Single commit with all the files from the wave keeps history clean

## Iterating across multiple waves

A real project that used this pattern shipped 5 waves over a single deep session. The territories below are abstracted to show the *shape* of a multi-wave dispatch — your project's specific territories will differ by domain.

| Wave | Territories covered |
|------|---------------------|
| 1 | Tooling — domain data sources, geospatial / specialised infra, web fetch, AI orchestration, database stack, document / PDF parsing, knowledge management, Claude Code dev tooling (8 files) |
| 2 | Domain + regulatory — applicable tax / regulatory rules, market dynamics, cost models, eligibility logic, permissioning workflows, case law, standards / specs, third-party API schemas, canonical identifiers, distribution + go-to-market (10 files) |
| 3 | Competitor sweep — direct SaaS incumbents, consumer + AI-enabled offerings, vertical specialists, international parallels (4 files) |
| 4 | OSS landscape — relevant analytics repos, scoring engines + data ingestion frameworks, UI / frontend kits (2 files) |
| 5 | Embedding / retrieval pre-spec — vector store + indexing strategy + hybrid retrieval + reranking + embedding model landscape (2 files) |

Total: 26 territory files + 1 master synthesis (`00-recommendations.md`) = 27 in `docs/research/`. Each wave informed the next (Wave 1's tooling picks shaped Wave 2's domain questions; Wave 3's competitor findings shaped Wave 4's OSS search; Wave 4's findings exposed an embedding decision that triggered Wave 5).

## Anti-patterns

- **Single-shot mega-research** — one subagent assigned 10 territories, each gets 5 minutes. Quality collapses; you get bullet lists, not analysis. Split into a wave.
- **Reactive waves** — operator dispatches "research everything you can find" without a wave plan. Subagents drift into adjacent territories, output overlaps, no clear synthesis path. Plan the wave first.
- **No synthesis** — wave returns, files land, nobody updates `00-recommendations.md`. The work is invisible to the next session. Synthesis is non-optional.
- **Wave for implementation work** — using parallel subagents to write code. This is a research pattern; for code use specialist builder agents + Plan mode. Code requires sequential decision-making that parallel dispatch breaks.
- **Reusing file numbers** — a Wave 2 file overwrites a Wave 1 file at the same NN. The history is lost. Always continue numbering from the highest existing prefix.

## Reference implementation

A project that adopts this pattern ends up with `docs/research/` containing one `00-recommendations.md` (master synthesis) + N territory files numbered sequentially. The wave-based table format documented in `templates/docs/research/README.md` is the canonical index shape. Each wave is dispatched as a single parallel-subagent burst from the main session.

## Proposing a wave at project intake

When the agent builder runs Full-Suite Mode for a new project, Output Rule #14 mandates a research-scoping proposal at flow step 5 — before the roster is proposed. The job at that step:

1. **Inspect the project brief + domain constraints + tech stack** from intake steps 1-3.
2. **Identify orthogonal research territories** that would materially inform agent design — domain rule sets, third-party API choices, competitor analyses, regulatory boundaries, library evaluations, infrastructure picks, etc.
3. **Count territories** and recommend accordingly:
   - **5+** → full wave dispatch — this doc's main pattern applies as-is.
   - **3-4** → recommend either a small wave OR sequential single-subagent research; operator picks based on time pressure.
   - **<3** → state plainly "this scope doesn't justify a research wave — proceeding to roster". Don't manufacture territories to hit a quota.
4. **Present the proposal** — territory list with one-line rationale each, subagent count, time estimate (~8-15 min typical for parallel wave), and output paths (`output/{project-name}/docs/research/NN-{topic}.md` + `00-recommendations.md`).
5. **Wait for approval.** Operator may approve / edit (add or drop territories) / decline.
6. **On decline**, record the decision in `output/{project-name}/session-docs/DECISIONS.md` so the omission is traceable for future sessions.
7. **On approval**, dispatch as documented in the rest of this file. Findings then feed the decomposition (step 6) + the roster proposal (step 7).

### Threshold rationale

- Anthropic's general subagent heuristic (`references/anthropic-guidelines-full.md` §2): *"if a task involves 3+ independent pieces of work, subagents are worth the overhead."*
- This doc's stricter 5+ threshold (under "When to use the pattern"): waves carry coordination + synthesis overhead that pays off above ~5 territories. Below 5, a single researcher can usually hold the whole surface in head.
- 3-4 is the grey zone — operator should pick based on whether the territories are deep (favour a small wave for depth) or shallow (favour sequential single-subagent research for synthesis cohesion).

This intake-time proposal is the positive-delegation trigger Anthropic guidelines §6 calls for under the Opus 4.7 under-spawn reversal — without it, the main session under-uses parallel subagents on greenfield projects, exactly the failure mode the guidelines warn about.
