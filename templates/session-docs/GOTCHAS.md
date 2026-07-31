# Gotchas

Failure modes hit while working in this project — bugs, quirks, environment traps, and their fixes. Each entry is a thing that actually went wrong, recorded so a future session recognises it before repeating it.

> **The `## G-NNN` heading format is load-bearing, not cosmetic.** The `pre-edit-gotcha-check.mjs` hook parses `## G-NNN` (and `### G-NNN`) headings and injects any entry whose body mentions the file you're about to edit, inline, before the Edit/Write fires. Entries written in any other shape — a table, a plain bullet list — are invisible to the hook and will never surface. Always add gotchas as `## G-NNN` headings, and name the concrete file path(s) the entry concerns in its body (that's what the hook matches on).

Format per entry: `## G-NNN — short title`, a one-line summary, then *Mistake mode* / *Warning signs* / *Fix* / *Incident (date + what happened)*. Number sequentially (G-001, G-002, …). Append-only — never delete a resolved gotcha; annotate it "Resolved" / "Superseded" instead so the history stays legible.

No gotchas recorded yet. Add the first as `## G-001` below the line when a failure mode surfaces — the `session-end-update` skill will prompt you at session wrap-up.

---

<!-- Skeleton — copy the block below for the first entry, renumber, and delete this comment.

## G-NNN — short title

**Mistake mode:** the wrong action or assumption that caused the failure.

**Warning signs:**
- an observable signal you're about to hit it
- another signal

**Fix:** the concrete corrective action (name the file/command, not "handle it properly").

**Incident:** YYYY-MM-DD. What actually happened, in one or two sentences.

-->
