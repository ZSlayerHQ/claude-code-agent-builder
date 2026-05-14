## Summary

One or two sentences: what does this PR change, and why?

## Type of change

- [ ] Bug fix
- [ ] New template / archetype
- [ ] New reference doc
- [ ] Refinement to existing pattern
- [ ] Documentation
- [ ] Refactor / cleanup
- [ ] Other: <describe>

## Files changed

Briefly list the files touched + the nature of each change. The diff will show *what* — this section should explain *why* each file needed to change.

## Test plan

- [ ] `bash scripts/check-template-paths.sh` — exit 0
- [ ] Tried a real Full-Suite generation against the changes (if templates / generation logic touched)
- [ ] Read the diff twice
- [ ] All cross-references resolve (no broken `references/...` paths)
- [ ] No personal-context citations introduced (names, organisations, project names, local paths)

## Scope check

- [ ] Within scope per `CONTRIBUTING.md` § "Scope"?
- [ ] Generic enough to benefit most users (not narrowly tailored to one domain)?
- [ ] AUP-redundant prose avoided (no restating Anthropic-baked behaviours)?
- [ ] Deny rules reference real tools (if `permissions.deny` was touched)?

## Breaking changes

- [ ] No breaking changes
- [ ] Breaking — describe migration path below:

<!-- If breaking, describe what existing generated projects need to do to keep working. -->

## Related

Closes #<issue> / Refs #<issue> / Links to related discussions, PRs, or external docs.
