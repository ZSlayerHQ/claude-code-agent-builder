# Operator Technicality Profiles

> **When to consult this:** at Full-Suite step 1.5, the operator declares their coding background. This doc maps that declaration to concrete prose-tuning rules for the generated CLAUDE.md + agent files + operational principles. Without tuning, generated outputs assume an experienced developer — which is wrong for an estimated 30-50% of likely users (marketers automating workflows, founders without coding background, researchers, designers, ops teams).

The Anthropic-side anchor is `anthropic-guidelines-full.md` §3 (Prompting Best Practices) — "Think of Claude as a brilliant but new employee who lacks context on your norms." This guide is the analogous calibration in the *opposite* direction: helping Claude calibrate to the *operator's* norms.

---

## The three profiles

| Profile | Marker | Typical operator |
|---|---|---|
| **Beginner** | "None / new to coding" | Marketer building an automation; founder spinning up a prototype; researcher / academic; designer scripting their workflow; ops team automating a process |
| **Intermediate** | "Some experience" | Developer outside their main stack (e.g. backend dev doing frontend); CS student; bootcamp graduate; technical PM; QA engineer; self-taught indie maker |
| **Advanced** | "Experienced developer" | Senior engineer; staff / principal engineer; founding engineer; tech lead; long-time professional dev |

### Self-rating, not skill-tested

Honour the operator's self-declared level. Don't try to second-guess based on the project they're building — a marketer building a CRM integration is still a beginner-profile user even though the project is technically complex. The profile is about how to *talk to them*, not what they can *do*.

### Profiles can move

If the operator says they're a beginner, generate beginner-tuned. They can ask the AI to "tighten this CLAUDE.md" 3 months later when they've grown comfortable. The slimming guide already documents the slim-down recipe; the technicality profile is the **starting** calibration, not a permanent assignment.

---

## How each profile shapes generated output

### Beginner

**CLAUDE.md tone:**
- Each operational principle paired with a one-line example or "why this matters" sidebar
- Domain terms defined inline on first use ("REST — the convention this app uses to talk to other services over HTTP")
- "First-session walkthrough" section near the top: what to type, what you'll see, what to do if it doesn't work
- Identity section frames the AI as "your coding partner who explains as we go"
- Operational principles include a "before you ask the AI" preflight (e.g. "save your work in git before running migrations — that way if anything goes wrong you can roll back with one command")

**Agent prose:**
- Each agent file gains a "What does this agent do?" plain-English summary at the top, before the technical Role section
- `When to Invoke` bullets phrased as user actions: "When you've added a new feature and want to check it works" — not "After feature implementation, before commit"
- Anti-patterns include the rationalisation in plain language: _"I'll just deploy and see what happens"_ — not _"premature deployment"_

**Operational principles to add:**
- "Save before risky operations" — explicit reminder to commit before migrations / deploys / refactors
- "If you don't understand the AI's output, ask it to explain" — gives them permission to slow down
- "There's no such thing as a stupid question for the AI" — anti-imposter-syndrome framing

**Output verbosity:**
- AI defaults to narrating: "Reading X, then I'll edit Y, then run the tests."
- Code edits explained in chat: "I'm changing this function because…"
- Test runs include "what passing means" + "what failing means" context

**What NOT to do:**
- Don't bury the operator in 12 plugins and 4 MCPs on day 1. Let the defaults stand but call out only the 2-3 most important in the operational principles.
- Don't include `references/anthropic-guidelines-full.md` in the always-available list with no commentary — the operator will read it and get overwhelmed. Either skip the citation or label it as "advanced reading."

---

### Intermediate

**CLAUDE.md tone:**
- Operational principles stated directly, brief rationale where non-obvious
- Domain terms defined inline only for *domain* terms (not general programming concepts)
- Identity section frames the AI as "an experienced collaborator who works at your pace"
- No first-session walkthrough — the `start.bat` + README explain enough

**Agent prose:**
- Standard archetype shape per `02-output-format.md` Section Order
- `When to Invoke` bullets phrased as workflow triggers: "After feature implementation, before commit"
- Anti-patterns concise: rationalisation + one-line slap

**Operational principles to add:**
- Standard set from the template, no extras

**Output verbosity:**
- AI defaults to brief milestone updates: "Read X. Editing Y now. Will run tests after."
- Code edits explained when non-obvious; routine edits silent
- Test runs report pass/fail count + first failure detail

**Default profile** — this is what the existing CLAUDE.md template assumes. No special tuning needed.

---

### Advanced

**CLAUDE.md tone:**
- Reference-density: principle → one sentence, no rationale unless the rule contradicts a common pattern
- No domain-term definitions (operator can google it)
- Identity section terse: "You are an expert {domain} developer." Drop the personality framing.
- Operational principles compressed: 5-8 bullets, no examples

**Agent prose:**
- Tight 4-section archetype (Role / Procedure / Verification / Anti-Patterns) — drop "When to Invoke" if the orchestrator routing description in `description:` is sufficient
- Anti-patterns one-liners

**Operational principles to add:**
- Standard set, *minus* the obvious-to-pros entries ("read before modify", "save before risky operations") — operator already does these

**Output verbosity:**
- AI defaults to silent execution with terse milestone-only updates
- Code edits silent unless non-obvious
- Test runs report pass/fail count only; failure detail only if requested

**What this profile enables:**
- Generated CLAUDE.md often lands 30-40% smaller than beginner-tuned (e.g. 90 lines vs 140 lines)
- Token cost per Session Start is materially lower
- AI conversation flows faster — fewer narration interruptions

---

## Worked examples — same principle, three profiles

### Operational principle: "Verify before claiming done"

**Beginner:**
> **Verify before claiming done.** Before saying you've finished a task, actually run the test command (you'll see what command to run in `PROJECT-DETAILS.md`) and check the linter (same place). If the test output says "0 failing", you're done. If it says any number of failing tests, the task isn't finished — tell me which tests failed and I'll work with you to fix them. **Why this matters:** AIs are confident — sometimes too confident. The test is the truth, not the AI's vibe.

**Intermediate:**
> **Verify before claiming done.** Run the linter; run the tests; confirm the file actually contains what you intended. Report failing tests by name.

**Advanced:**
> **Verify before claiming done.** Evidence over assertions.

---

### Agent description: a builder agent

**Beginner:**
> **What does this agent do?** It writes the actual code for your app — new features, bug fixes, refactoring. Use it when you want something built or changed in the codebase. Before it commits, it checks its own work against the project's tests and conventions.
>
> ## Role
> Designs and implements features end-to-end…

**Intermediate:**
> ## Role
> Designs and implements features end-to-end. Owns the code that ships.

**Advanced:**
> ## Role
> Implementer. Owns shipped code.

---

### Anti-pattern entry

**Beginner:**
> **Skipping the test run** — _"The change is small enough, the tests will obviously pass."_ Even small changes can break tests in surprising ways — that's literally why we have tests. Always run the test command before saying you're done; if you're not sure how, ask me. **Why this matters:** "obvious" bugs that ship to production are the most expensive kind.

**Intermediate:**
> **Skipping the test run** — _"The change is small enough, the tests will obviously pass."_ Small changes break tests in surprising ways. Run the suite before claiming done.

**Advanced:**
> **Skipping tests** — _"Trivial change."_ Run them.

---

## Where the tuning is applied

| File | Section(s) tuned |
|---|---|
| Generated `CLAUDE.md` | Identity, Operational Principles, optional First-Session Walkthrough |
| Generated `.claude/agents/*.md` (each) | Role, optional "What does this agent do?" preamble, Anti-Patterns rationalisation phrasing |
| Generated `PROJECT-DETAILS.md` | Tech-stack section verbosity (define terms vs not) |
| Generated `session-docs/STATE.md` | Active-work narrative section style |

The technicality profile does NOT change:
- Tool scoping per archetype (Auditors never get Write; this is structural)
- Default MCPs / plugins (these are runtime capabilities, not prose)
- Hook wiring (PreCompact + PostToolUse are universal)
- The `model: claude-opus-4-7` + `effort: xhigh` defaults
- Deny-list entries
- Schema-of-schemas in the lexicon kit (if present)

These are universal capabilities; only the *prose around them* changes.

---

## Pre-flight check — is this the right calibration?

Before generating, sanity-check the profile against the project brief:

- Beginner-profile operator asking for a **payment processing app**? Surface the regulatory complexity at intake; ask if they want to proceed solo or escalate to a developer. (Don't refuse — but don't pretend the complexity is invisible.)
- Advanced-profile operator asking for a **personal blog**? Honour the profile; they're choosing density for speed-of-iteration, not because they can't handle help.
- Beginner-profile operator asking for a **research wave on UK property law**? Honour the profile but in the wave subagents' research files, lean toward executive-summary phrasing — full territorial depth is preserved, the synthesis layer becomes more accessible.

The profile is a *tone* signal, not a *competency restriction*. Operator competency is what they say it is plus what their requests demonstrate.

---

## Default if step 1.5 is skipped

If the operator skips the question or says "not sure", default to **Intermediate**. It's the safest middle ground — beginners get slightly tighter prose than they'd prefer (recoverable by asking for explanation), advanced users get slightly more explanation than they need (recoverable by asking the AI to tighten the CLAUDE.md later).

Never default to Advanced — that's an opt-in profile. Defaulting there for a real beginner produces a CLAUDE.md they can't navigate.
