#!/usr/bin/env bash
# Template-drift guard.
#
# Fails if templates/ contains paths that resolve inside the agent-builder
# repo but not inside generated projects. Run before committing template
# changes.
#
# Background: the agent builder copies templates/ contents into every
# generated project's directory. Anything inside templates/ that cites
# an agent-builder-internal path (references/..., output/..., archive/,
# ../manifest.md) becomes a dangling reference once shipped.
#
# Usage: scripts/check-template-paths.sh
#   exit 0  → clean, safe to commit
#   exit 1  → leaks found, fix before committing
#   exit 2  → ran from wrong directory

set -uo pipefail

cd "$(dirname "$0")/.."

if [ ! -d templates ]; then
  echo "error: must be run from the agent-builder repo root (no templates/ dir found)"
  exit 2
fi

FAIL=0

check_pattern() {
  local label="$1"
  local pattern="$2"
  local hits
  hits=$(grep -nIrE "$pattern" templates/ 2>/dev/null || true)
  if [ -n "$hits" ]; then
    echo "FAIL: $label"
    echo "$hits" | sed 's/^/  /'
    echo ""
    FAIL=1
  fi
}

# 1. The agent-builder's references/ — internal knowledge base, does not ship.
check_pattern "references/<file>.md (agent-builder internal knowledge base)" \
  '(^|[^a-zA-Z0-9_/])references/[a-zA-Z0-9_./-]+\.md'

# 2. Staging area for upgrade kits — never appears in generated projects.
check_pattern "output/_*-upgrades/ (agent-builder staging)" \
  'output/_[a-zA-Z0-9_-]*upgrades/'

# 3. Manifest of generated projects — generated projects don't have one.
check_pattern "../manifest.md or repo-relative manifest" \
  '(\.\./|^|[^a-zA-Z0-9_/])manifest\.md'

# 4. The agent-builder's archive of past generations — only exists here.
check_pattern "../archive/ (agent-builder project archive)" \
  '(\.\./|^|[^a-zA-Z0-9_/])archive/'

if [ $FAIL -eq 0 ]; then
  echo "template-drift check: PASS — no agent-builder-internal paths in templates/"
  exit 0
else
  echo "template-drift check: FAIL"
  echo ""
  echo "The flagged paths exist inside the agent-builder repo but NOT inside"
  echo "generated projects. Fix by dropping the citation or rephrasing to be"
  echo "self-contained."
  exit 1
fi
