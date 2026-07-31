---
name: test-driven-development
description: Use before writing implementation code for any feature or bugfix — write the test first, watch it fail, then write the minimal code to pass. Especially when the code "looks too simple to test", you're tempted to test after, or you've already written code without a test (delete it and start over). Invoke this instead of coding first.
---

# Test-Driven Development

Write the test first. Watch it fail. Write the minimal code to pass. If you didn't watch the test fail, you don't know it tests the right thing — a test written after the code passes immediately and proves nothing.

## The one rule

**No production code without a failing test first.** Wrote code before the test? Delete it and start fresh from the test — don't keep it "as reference," don't adapt it while writing the test (that's testing-after in disguise). Delete means delete.

## When to use

- Before implementing any feature, bugfix, refactor, or behavior change.
- **Especially** when it "looks too simple to test" (simple code breaks too, and the test takes 30 seconds), when you're tempted to "test after," or when a test is hard to write (that's the design telling you the code is hard to use).
- Exceptions worth asking about: throwaway prototypes, generated code, config files. Everything else: test first.

## The cycle — Red, Green, Refactor

1. **RED — write one failing test.** One behavior, a name that describes it, exercising real code (mocks only if unavoidable — a test of a mock tests nothing).
2. **Watch it fail, for the right reason.** Run it. It must FAIL (not error on a typo), and fail because the feature is missing. If it passes, you're testing existing behavior — fix the test.
3. **GREEN — minimal code to pass.** The simplest thing that goes green. No extra options, no "while I'm here" features (YAGNI).
4. **Watch it pass — and keep the suite green.** Run it. This test passes, nothing else broke, output clean. If it fails, fix the code, not the test.
5. **REFACTOR — only once green.** Remove duplication, improve names, extract helpers. Add no behavior; stay green.
6. **Repeat** for the next behavior.

## For bugfixes

Reproduce the bug as a failing test FIRST, then fix. The test proves the fix works and prevents the regression. Never fix a bug without a test that would have caught it.

## Anti-patterns

- **"I'll write the tests after to verify it works"** — _"Same coverage either way."_ Tests written after pass immediately and prove nothing — they test what you built, not what was required, and you never saw them catch anything. Test-first forces you to see it fail.
- **"Too simple to need a test"** — _"This one's trivial."_ Simple code breaks too, and the test costs 30 seconds. If it's that simple, the test is that easy.
- **"Deleting hours of work is wasteful"** — _"I'll keep it and add tests around it."_ Sunk cost — the time is already gone; keeping code you can't trust is the real waste. Delete and rewrite from tests.
- **"I already manually tested it"** — _"I checked all the cases."_ Ad-hoc, no record, can't re-run, and you'll re-test by hand on every change. Automated tests run the same way every time.
- **"Hard to test, but the code's fine"** — _"The setup is just awkward."_ Hard to test = hard to use. Listen to the test: fix the design (dependency injection, smaller interface); don't force the test around bad structure.
