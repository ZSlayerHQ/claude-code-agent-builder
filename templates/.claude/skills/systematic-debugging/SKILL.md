---
name: systematic-debugging
description: Use the moment you hit a bug, test failure, crash, or any unexpected behavior — BEFORE proposing or trying a fix. Enforces root-cause-first: reproduce, trace to source, one hypothesis, one minimal fix, verify. Especially under time pressure, when a "quick fix" looks obvious, or when a previous fix didn't hold. Invoke this instead of guessing.
---

# Systematic Debugging

Random fixes waste time and breed new bugs. A symptom fix that "works" hides the real fault until it resurfaces, worse.

## The one rule

**No fix without a root cause first.** If you can't name *why* the bug happens — the specific line, value, or state that causes it — you are guessing, and a guess is not a fix. Seeing the symptom is not understanding the cause.

## When to use

- Any bug, test failure, crash, wrong output, perf problem, or build/integration failure — before you touch a fix.
- **Especially** under time pressure, when "just one quick change" tempts you, or when a prior fix didn't work (that's the tell you're patching symptoms).
- Simple-looking bugs too — they have root causes, and the process is fast for them.

## Procedure

1. **Read the actual error.** Full message, full stack trace, line numbers, codes. The answer is often already there — don't skim past it.
2. **Reproduce it reliably.** Exact steps; does it happen every time? If you can't reproduce it, gather more data — never guess from a single occurrence.
3. **Check what changed.** `git diff` / recent commits / new deps / config / env. Most bugs live in the last thing that moved.
4. **Trace to the source, not the symptom.** Where does the bad value originate? What passed it in? Keep going up until you reach where it's *first* wrong. In multi-component systems, log data in/out at each boundary once to find WHICH layer breaks before diving into one.
5. **One hypothesis, one minimal test.** State it: "X is the cause because Y." Change the smallest thing that tests it — one variable. If it's wrong, form a NEW hypothesis; don't stack more changes on top.
6. **Fix the root cause, then verify.** Write a failing test first if you can (see `test-driven-development`). One change, no "while I'm here" extras. Confirm the bug is gone AND nothing else broke.

## The 3-fix rule

If three fixes have failed, STOP — you have an architecture problem, not a bug. Fixes that each reveal a new problem elsewhere, or that need "massive refactoring," mean the pattern itself is wrong. Raise it with your human partner; do not fire off fix #4.

## Anti-patterns

- **"Quick fix now, investigate later"** — _"I'll just change this and see if it works."_ The first fix sets your direction; a guessed one sends you down a wrong path that costs more than the investigation would have. Find the cause first.
- **"It's probably X, let me fix that"** — _"I can see the problem."_ You see a symptom. "Probably" is an untested hypothesis — test it minimally before you commit a fix.
- **"Emergency, no time for process"** — _"Systematic is too slow right now."_ Guess-and-check thrashing is the slow path (hours); root-cause-first is minutes. Pressure is the reason to be systematic, not the excuse to skip it.
- **"One more fix attempt"** — _"The next one will do it."_ After two failures you're guessing; after three it's the architecture. Stop and question the design instead of firing fix #4.
- **"I'll write the test after I confirm the fix"** — _"Let me just check it works first."_ Untested fixes don't stick, and you can't prove the cause without one. The failing test IS the proof.
