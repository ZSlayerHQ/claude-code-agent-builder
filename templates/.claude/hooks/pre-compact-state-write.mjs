#!/usr/bin/env node
// PreCompact hook — capture objective state into session-docs/STATE.md
// before context compaction, then inject a reminder for the AI to update
// the narrative sections.
//
// Wire-up in .claude/settings.json:
//   "hooks": {
//     "PreCompact": [{
//       "matcher": "manual",
//       "hooks": [{
//         "type": "command",
//         "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact-state-write.mjs"
//       }]
//     }, {
//       "matcher": "auto",
//       "hooks": [{
//         "type": "command",
//         "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/pre-compact-state-write.mjs"
//       }]
//     }]
//   }

import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const stateFile = join(projectDir, 'session-docs', 'STATE.md');

function safeExec(cmd) {
  try {
    return execSync(cmd, {
      cwd: projectDir,
      stdio: ['pipe', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
  } catch {
    return null;
  }
}

// Capture objective state from git + filesystem
const branch = safeExec('git branch --show-current') || '(not a git repo)';
const lastCommit = safeExec('git log -1 --oneline') || '(no commits)';
const dirtyLines = safeExec('git status --porcelain');
const dirty = dirtyLines ? dirtyLines.split('\n').filter((l) => l.trim()).length : 0;
const recentRaw = safeExec('git log --name-only --pretty=format: -5') || '';
const recentFiles = [...new Set(recentRaw.split('\n').filter((l) => l.trim()))].slice(0, 5);
const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// Preserve narrative sections from existing STATE.md (if any). A non-empty STATE.md with no "## Invariants"
// heading was written in its own format (a project that adopted these hooks later): it is never rewritten,
// because keeping only the text from "## Invariants" onwards would replace the whole file with the fallback.
let narrative = '';
let customFormat = false;
if (existsSync(stateFile)) {
  const existing = readFileSync(stateFile, 'utf-8');
  const narrativeStart = existing.indexOf('## Invariants');
  if (narrativeStart !== -1) {
    narrative = existing.slice(narrativeStart);
  } else if (existing.trim()) {
    customFormat = true;
  }
}

const fallbackNarrative = `## Invariants

_(Facts the AI must not contradict — operator + AI maintain.)_

## Active work

- **Task:** _(in-flight task)_
- **Files in scope:** _(path:line)_
- **Next step:** _(concrete next action)_
- **Acceptance criterion:** _(done criteria)_

## Last verified state

- [ ] Build green — _(date/sha)_
- [ ] Tests passing — _(date/sha)_
- [ ] Linter clean — _(date/sha)_
- [ ] Type checker clean — _(date/sha)_

## Open assumptions

_(Believed true but not re-verified this session.)_

## Active hazards

_(Flaky tests, pending migrations, third-party API outages.)_

---

## How to update this file

This file has TWO update mechanisms:

1. **Automatic (hook-driven):** the \`pre-compact-state-write\` PreCompact hook captures objective state into the header before every context compaction.
2. **Narrative (AI-driven):** after the hook runs (or at session end), the AI updates the narrative sections to reflect what was learnt this session.
`;

const header = `# STATE.md — Current Session State

> Auto-updated by the \`pre-compact-state-write\` PreCompact hook before every context compaction.
> Read FIRST at every Session Start to re-anchor.
> Overwritten (not appended) — historical state lives in \`SESSION-LOG.md\`.

**Last updated:** ${timestamp}
**Last commit:** ${lastCommit}
**Branch:** ${branch}
**Uncommitted changes:** ${dirty} files
**Recent changes:** ${recentFiles.length ? recentFiles.join(', ') : '(none)'}

---

`;

const gitState = `branch ${branch}, last commit ${lastCommit}, ${dirty} dirty files`;

if (!customFormat) {
  // Ensure session-docs/ directory exists
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, header + (narrative || fallbackNarrative));
}

// Inject context for the AI to update narrative sections
const output = {
  hookSpecificOutput: {
    hookEventName: 'PreCompact',
    additionalContext: customFormat
      ? `Context is being compacted. session-docs/STATE.md uses its own format (no "## Invariants" section), so this hook left it untouched. Current git state: ${gitState}. Before any further work, update STATE.md by hand to reflect the current state and what was learnt in this session.`
      : `Context is being compacted. session-docs/STATE.md has been auto-updated with current git state (${gitState}). Before any further work, update the narrative sections (Invariants, Active work, Last verified state, Open assumptions, Active hazards) of STATE.md to reflect what was learnt in this session. Overwrite the narrative sections — do not append. Old narrative state lives in SESSION-LOG.md if needed historically.`,
  },
};
process.stdout.write(JSON.stringify(output));
