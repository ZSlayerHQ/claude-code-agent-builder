---
name: Bug report
about: Report a defect in the agent builder's templates, references, or generation logic
title: "bug: <short description>"
labels: bug
assignees: ''
---

## Summary

One sentence describing what's wrong.

## Affected component

- [ ] `templates/` — something the builder ships into every generated project
- [ ] `references/` — knowledge-base inaccuracy or stale guidance
- [ ] `scripts/check-template-paths.sh` — drift guard false positive or miss
- [ ] `.claude/rules/` — operating rule producing wrong behaviour
- [ ] `CLAUDE.md` — builder's own identity / flow / output rules
- [ ] `session-docs/` — audit checklist or gotchas issue
- [ ] Other: <describe>

## Expected behaviour

What you expected to happen.

## Actual behaviour

What happened instead. Include exact error text if applicable. Wrap stack traces in code blocks.

## Repro steps

1. ...
2. ...
3. ...

## Environment

- Claude Code version: <output of `claude --version`>
- OS: <Windows / macOS / Linux + version>
- Shell: <PowerShell / bash / zsh + version>
- Claude model used: <opus-4-7 / sonnet-4-6 / haiku-4-5 / other>

## Additional context

Screenshots, generated-project snippets, anything else that helps triage.
