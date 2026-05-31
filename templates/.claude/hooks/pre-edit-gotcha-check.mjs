#!/usr/bin/env node
// PreToolUse hook — before Edit/Write fires, scan session-docs/GOTCHAS.md
// for G-NNN entries mentioning the file path being edited, and inject
// the top matches inline as additionalContext.
//
// Follows structural-fix gotcha-hook discipline. Adapted to drop
// the MCP dependency — pure Node.js, no per-project MCP server needed.
//
// Behaviour:
//   - On no GOTCHAS.md or no matches: silent exit (no output, no overhead)
//   - On matches: inject top N matched G-NNN entries inline
//   - Per-turn dedup via TEMP_DIR/<project-slug>-gotcha-checked.json,
//     cleared by user-prompt-gotcha-dedup-reset.mjs on each new prompt
//   - Never blocks — purely informational
//
// AUTHOR NOTE (operator-tunable):
//   - GENERIC_BASENAMES — basenames so common they over-match (lib.rs,
//     index.ts, etc). Adjust per stack if false-negatives appear.
//   - MAX_MATCHES = 5 — bump if you want denser per-edit reminders.
//   - BODY_EXCERPT_LEN = 300 — chars per matched entry shown to the model.
//   - HEADING_REGEX matches `## G-NNN` and `### G-NNN` — extend if your
//     GOTCHAS file uses a different ID scheme.
//
// Wire-up in .claude/settings.json:
//   "hooks": {
//     "PreToolUse": [{
//       "matcher": "Edit|Write",
//       "hooks": [{
//         "type": "command",
//         "command": "node $CLAUDE_PROJECT_DIR/.claude/hooks/pre-edit-gotcha-check.mjs"
//       }]
//     }]
//   }
//
// Pair with user-prompt-gotcha-dedup-reset.mjs (UserPromptSubmit) for the
// full flow — without the reset, reminders never re-fire after the first
// edit to a file in a session.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { tmpdir } from 'node:os';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const gotchasFile = join(projectDir, 'session-docs', 'GOTCHAS.md');
const projectSlug = projectDir.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 80);
const dedupFile = join(tmpdir(), `${projectSlug}-gotcha-checked.json`);

const MAX_MATCHES = 5;
const BODY_EXCERPT_LEN = 300;
const HEADING_REGEX = /^#{2,3}\s+(G-\d+).*$/gm;
const GENERIC_BASENAMES = new Set([
  'lib.rs', 'mod.rs', 'main.rs', 'build.rs',
  'index.ts', 'index.tsx', 'index.js', 'index.jsx',
  '__init__.py', 'main.py', 'setup.py',
  'Cargo.toml', 'package.json', 'pyproject.toml', 'tsconfig.json',
  'README.md', 'CHANGELOG.md', 'LICENSE',
]);

function readStdin() {
  try { return readFileSync(0, 'utf-8'); } catch { return ''; }
}

function readDedup() {
  if (!existsSync(dedupFile)) return {};
  try { return JSON.parse(readFileSync(dedupFile, 'utf-8')); } catch { return {}; }
}

function writeDedup(d) {
  try { writeFileSync(dedupFile, JSON.stringify(d)); } catch { /* fine */ }
}

function toRelative(filePath) {
  try {
    const rel = relative(projectDir, filePath);
    return rel.split(sep).join(posix.sep);
  } catch {
    return filePath;
  }
}

function pathSignals(relPath) {
  // Generate weighted match signals from a relative path. Higher weight = more
  // specific = stronger signal that a GOTCHA entry is relevant.
  const signals = [];
  const parts = relPath.split(posix.sep).filter(Boolean);
  const base = parts[parts.length - 1] || '';

  // Full relative path — highest specificity
  signals.push({ token: relPath, weight: 10 });

  // Each parent-path prefix. Depth scales weight — longer prefixes are more
  // specific. For "vendor/zslayer/audio/src/lib.rs" emits "vendor" (3),
  // "vendor/zslayer" (5), "vendor/zslayer/audio" (6), "vendor/zslayer/audio/src" (7).
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join(posix.sep);
    const weight = Math.min(2 + i, 8);
    signals.push({ token: prefix, weight });
  }

  // Parent-dir + basename (e.g. "audio/capture.rs") — catches "the capture
  // file in audio" style references without needing the full path
  if (parts.length >= 2) {
    signals.push({ token: parts.slice(-2).join(posix.sep), weight: 5 });
  }

  // Bare basename — skip generic ones (lib.rs, index.ts, etc) to avoid noise
  if (base && !GENERIC_BASENAMES.has(base)) {
    signals.push({ token: base, weight: 3 });
  }

  return signals;
}

function parseGotchaEntries(gotchas) {
  const entries = [];
  const headings = [...gotchas.matchAll(HEADING_REGEX)];
  for (let i = 0; i < headings.length; i++) {
    const match = headings[i];
    const start = match.index;
    const end = i + 1 < headings.length ? headings[i + 1].index : gotchas.length;
    const titleEnd = gotchas.indexOf('\n', start);
    const title = gotchas.slice(start, titleEnd === -1 ? gotchas.length : titleEnd).trim();
    const body = gotchas.slice(start, end).trim();
    entries.push({ id: match[1], title, body });
  }
  return entries;
}

function scoreEntries(entries, signals) {
  return entries
    .map((entry) => {
      let score = 0;
      const lower = entry.body.toLowerCase();
      for (const sig of signals) {
        if (lower.includes(sig.token.toLowerCase())) score += sig.weight;
      }
      return { ...entry, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES);
}

function formatOutput(matches, absPath) {
  const lines = [
    `[gotcha-check] About to Edit/Write \`${absPath}\` — relevant entries from session-docs/GOTCHAS.md:`,
    '',
  ];
  for (const m of matches) {
    const excerpt = m.body
      .replace(/^#{2,3}\s+G-\d+.*\n/, '')
      .trim()
      .slice(0, BODY_EXCERPT_LEN);
    const truncated = m.body.length > BODY_EXCERPT_LEN + 50;
    lines.push(m.title);
    lines.push(excerpt + (truncated ? '... [truncated — open GOTCHAS.md for full entry]' : ''));
    lines.push('');
  }
  lines.push('Review these before the edit. If any apply, mitigate first.');
  return lines.join('\n');
}

// Main flow. Set GOTCHA_HOOK_DEBUG=1 in the env to trace decision points on stderr.
const DEBUG = !!process.env.GOTCHA_HOOK_DEBUG;
const dbg = (...a) => DEBUG && console.error('[gotcha-hook]', ...a);

const stdin = readStdin();
if (!stdin.trim()) process.exit(0);

let payload;
try { payload = JSON.parse(stdin); } catch (e) { dbg('JSON parse error:', e.message); process.exit(0); }

const toolName = payload.tool_name;
if (toolName !== 'Edit' && toolName !== 'Write') process.exit(0);

const filePath = payload.tool_input?.file_path;
if (!filePath) process.exit(0);

if (!existsSync(gotchasFile)) process.exit(0);

const relPath = toRelative(filePath);

const dedup = readDedup();
if (dedup[relPath]) process.exit(0);

let gotchas;
try { gotchas = readFileSync(gotchasFile, 'utf-8'); } catch (e) { dbg('GOTCHAS read error:', e.message); process.exit(0); }

const signals = pathSignals(relPath);
const entries = parseGotchaEntries(gotchas);
const matches = scoreEntries(entries, signals);
dbg('relPath:', relPath, '| signals:', signals.length, '| entries:', entries.length, '| matches:', matches.length);

// Mark as checked even on no-match (avoid re-reading file on subsequent edits to same path this turn)
dedup[relPath] = new Date().toISOString();
writeDedup(dedup);

if (matches.length === 0) process.exit(0);

const output = {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse',
    additionalContext: formatOutput(matches, filePath),
  },
};
process.stdout.write(JSON.stringify(output));
