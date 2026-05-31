#!/usr/bin/env node
// UserPromptSubmit hook — clears the gotcha-check per-turn dedup file on
// each new operator prompt. Without this, dedup would persist across turns
// and reminders would never re-fire for files edited in previous turns.
//
// Pair with pre-edit-gotcha-check.mjs (PreToolUse) for the full flow.
//
// Wire-up in .claude/settings.json:
//   "hooks": {
//     "UserPromptSubmit": [{
//       "hooks": [{
//         "type": "command",
//         "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-gotcha-dedup-reset.mjs"
//       }]
//     }]
//   }

import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const projectSlug = projectDir.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 80);
const dedupFile = join(tmpdir(), `${projectSlug}-gotcha-checked.json`);

if (existsSync(dedupFile)) {
  try { unlinkSync(dedupFile); } catch { /* next pre-edit run will overwrite */ }
}

process.exit(0);
