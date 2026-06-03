# Project Skills

This directory holds **project-local Claude Code skills** — focused, reusable prompts the AI can invoke via `/<skill-name>` or load automatically based on conversational context.

Skills complement the agent roster (`.claude/agents/`). The dividing line:

| Use a **skill** when... | Use an **agent** when... |
|---|---|
| The work is a recipe / procedure with a fixed shape | The work needs its own context window + tool scoping |
| Multiple agents (or the main thread) all need it | One domain owns the work end-to-end |
| It's a small reusable workflow (≤200 lines of instructions) | It's a full role with handoffs + verification |
| Activation is contextual or by slash command | Activation is by delegation from the orchestrator |

Examples of good skills:
- A **commit message** skill that enforces the project's commit conventions
- A **bug-report triage** skill that runs the same diagnostic ladder every time
- A **PR review** skill that loads the project's review rubric
- A **migration checklist** skill that's used before any DB schema change

## Authoring a new skill

The fastest path is the `skill-creator` plugin (pre-enabled in `.claude/settings.json`). Ask the AI: "Create a skill that does X" — it'll walk through naming, description (the activation hook), and body structure.

Manual path: copy `_example/SKILL.md` into a new subdirectory (`<skill-name>/SKILL.md`), then edit the frontmatter + body.

## File layout

```
.claude/skills/
  README.md                  ← you are here
  _example/
    SKILL.md                 ← starter template; delete or rename
  stale-docs-audit/
    SKILL.md                 ← ships by default — 6-check documentation rot scan
  post-compact-reload/
    SKILL.md                 ← ships by default — re-reads core docs after /compact
  session-end-update/
    SKILL.md                 ← ships by default — persists session-docs at session end
  security/
    SKILL.md                 ← ships by default — comprehensive security discipline
  search-optimization/
    SKILL.md                 ← ships by default — classical + AI-engine search optimization
  commit-and-push/
    SKILL.md                 ← ships by default — safe survey/sweep/stage/commit/push
  consent-cmp/
    SKILL.md                 ← ships by default — cookie-consent / CMP scaffolder
  <your-skill-name>/
    SKILL.md                 ← canonical filename (required)
    references/              ← optional supporting docs the skill can read
```

The `SKILL.md` filename is mandatory — Claude Code looks for that exact name inside each skill directory.

## Skills that ship by default

| Skill | Activation | Purpose |
|---|---|---|
| `stale-docs-audit` | "audit the docs" / "are the docs current?" / `/stale-docs-audit` | 6-check scan: dead file-path citations, version mismatch, dead SHAs, last-modified gap, TODO/FIXME markers, renamed-file ghosts. Produces a structured RED/AMBER/GREEN report. |
| `post-compact-reload` | "/post-compact-reload" / "re-read the rules" / proactively after `/compact` | Re-reads core documents (`CLAUDE.md`, `~/.claude/CLAUDE.md`, `session-docs/STATE.md`, `GOTCHAS.md`, `PROJECT-DETAILS.md`, every `.claude/rules/*.md`) after `/compact` runs. Without it, long sessions drift away from current rule files because auto-load only fires at session start. Customise the project-specific section in the SKILL.md body. |
| `session-end-update` | "/session-end-update" / "we're done" / "calling it" / "wrap the session" / "end of day" | Persist-side analog to `post-compact-reload`. Captures what changed at session end + updates STATE.md narrative + appends SESSION-LOG entry + adds new DECISIONS / GOTCHAS entries if applicable + offers a `chore(session): wrap session YYYY-MM-DD` commit. Scoped strictly to `session-docs/`. |
| `codex-dispatch` *(optional)* | "run codex" / "verify with codex" | Independent static-analysis verifier via OpenAI Codex CLI for medium-to-large changes. Only ships if the operator confirmed Codex CLI is installed at project generation time. |
| `security` | code touching untrusted input/auth/secrets/IaC, or "security review" / "is this secure?" | Comprehensive security discipline — trust boundaries, source→sink injection matching, auth/authz/ownership, secrets-are-leaked, fail-closed; 10-point threat-model checklist + CWE-mapped audit categories + severity calibration. |
| `search-optimization` | SEO/AEO/GEO work, "rank", "AI citations", meta/structured data, pre-launch SEO audit | Optimize pages for classical search AND AI answer engines — titles/meta/headings/semantic HTML, Core Web Vitals, structured data, AEO citation patterns. Volatile thresholds date-stamped (verify current). |
| `commit-and-push` | "commit and push", "ship this", finishing a unit of work | Safe ship: survey → secret-sweep → explicit staging → Conventional-Commit → safe push → verify clean. Obeys project-specific push governance over its own defaults. |
| `consent-cmp` | "cookie consent", "GDPR/CCPA banner", "CMP", pre-launch of any site setting cookies/loading analytics | Scaffolds a compliant consent layer — banner + consent store + the GATE that withholds non-essential cookies/scripts until opt-in; cookie inventory + policy wiring. References `security` for headers. |

## Activation

Two activation modes:

1. **Manual** — operator types `/skill-name` to invoke directly
2. **Automatic** — Claude reads each skill's `description` frontmatter and decides on its own whether to load + apply

The `description` field is therefore load-bearing. Write it as "Use this skill when..." — the more specific the trigger, the better the activation precision. See `_example/SKILL.md` for the format.

## Shell execution inside skills

Skills can include inline shell execution via `` !`<command>` `` blocks. Useful for "gather context before answering" patterns (e.g. `` !`git log --oneline -10` ``). To disable shell execution globally, set `disableSkillShellExecution: true` in `.claude/settings.json` — recommended for environments where the operator shouldn't be able to bypass the deny list via skill execution.
