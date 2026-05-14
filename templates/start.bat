@echo off
cd /d "%~dp0"
set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70
claude --dangerously-skip-permissions -n "<project-name>"
