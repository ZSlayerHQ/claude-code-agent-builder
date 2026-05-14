# Research

This directory holds structured research the project relies on — territory deep-dives, competitor sweeps, library evaluations, domain notes — written by researcher agents (or operator-dispatched subagent waves) and synthesised before code work begins.

Each file is permanent. Once written, it becomes part of the project's institutional memory. Update existing files; don't rewrite them.

## File-naming convention

```
docs/research/NN-{short-topic}.md
```

- `00-recommendations.md` — master synthesis. Whatever the topic, this is the rollup the rest of the project reads first.
- `01-…` through `99-…` — individual territory files, numbered in the order they were written.

The `NN-` prefix gives reading order; the rest is descriptive.

## Wave-based table

When research is dispatched as a wave (multiple parallel subagents covering orthogonal territories), record the dispatch here so the next session can see what was covered.

| Wave | # | File | Status | Topic | Subagent owner | Date |
|------|---|------|--------|-------|----------------|------|
| 0 | 00 | `00-recommendations.md` | (placeholder) | Master synthesis — TL;DR stack + per-agent integration | (synthesiser) | YYYY-MM-DD |
| 1 | 01 | `01-{topic}.md` | (placeholder) | {Territory the subagent investigated} | {subagent-name} | YYYY-MM-DD |
| 1 | 02 | `02-{topic}.md` | (placeholder) | {Territory the subagent investigated} | {subagent-name} | YYYY-MM-DD |

Status values: `pending` / `in-progress` / `complete` / `superseded`. Mark a file `superseded` (don't delete) when replaced by a newer wave on the same territory; the file becomes historical context.

## Adding a wave

1. Plan the territories — what 3-10 orthogonal slices of the research surface need parallel coverage. Each slice becomes one subagent.
2. Number the files — continue from the highest existing `NN-` prefix (e.g. if last file is `08-…`, the next wave starts at `09-…`).
3. Dispatch the subagents in parallel — one task per territory, all kicked off in the same message so they run concurrently.
4. Add a row to the table above for each file (status `pending` → `in-progress` → `complete`).
5. After the wave returns, write or update `00-recommendations.md` to fold the new findings into the master synthesis.

## Reading order

If you're new to this project's research:

1. `00-recommendations.md` first — master synthesis, all decisions surfaced
2. Then any wave-1 / wave-2 files relevant to the area you're working on
3. Then deeper waves on demand

Do not skip `00-recommendations.md`. It's the index of the index.
