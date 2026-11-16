#!/usr/bin/env bash
# macOS / Linux launcher — double-clickable in Finder (.command).
# POSIX sibling of start.bat. Keep the two in sync: same flags, same project name.
cd "$(dirname "$0")"
claude --dangerously-skip-permissions -n "<project-name>"
