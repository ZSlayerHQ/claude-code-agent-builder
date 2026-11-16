@echo off
cd /d "%~dp0"
claude --dangerously-skip-permissions -n "<project-name>"
