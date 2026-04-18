# /quick-update — Lightweight Change Path

> For 1-5 file changes. Scope-checks and escalates to `/auto-feature` when needed.

**Update request**: $ARGUMENTS

---

## RULES

1. **Schema first.** Before touching data layer code, verify field names and types from schema docs or MCP tools.
2. **Focused investigation.** Read only the files affected by this change — not the whole codebase.
3. **No sub-agents.** This is a lightweight path. You investigate directly.
4. **Scoped plan.** Present the change plan inline, not as a separate file.
5. **Confirm before execute.** The user approves the plan before you make changes.

---

## STEP 1: SCHEMA CONTEXT



If schema-context MCP tools are available, use them to verify field existence and types.

---

## STEP 2: SCOPE THE CHANGE

Analyze the request and answer:
1. Which files need to change?
2. Are there type definitions that need updating?
3. Are there consumers that need updating?
4. Does this touch any blocked areas?
5. Is this actually a 1-5 file change?

**SCOPE CHECK — Escalate to `/auto-feature` if ANY of these are true:**
- More than 5 files need changes
- New type/model/schema definition needed
- Changes span multiple unrelated modules
- Blocked areas are affected
- You're unsure about the blast radius

If escalating, tell the user: "This change is larger than a quick-update. Recommend running `/auto-feature $ARGUMENTS` instead for full exploration and council review."

---

## STEP 3: INVESTIGATE

Read only the affected files. For each file:
- Note the current state
- Identify what changes
- Check for pattern consistency with surrounding code

---

## STEP 4: PRODUCE CHANGE PLAN

Present the plan inline (not a separate file):

```
Files to change:
1. [file path] — [what changes]
2. [file path] — [what changes]

Validation:
- npm run build
- npx tsc --noEmit
```

---

## STEP 5: CONFIRM AND EXECUTE

Ask the user: "Ready to apply these changes? (yes / let me review first / abort)"

- **yes**: Apply all changes, then run validation
- **let me review first**: Wait for the user to review, then proceed on their signal
- **abort**: Stop without changes

---

## STEP 6: POST-UPDATE

After applying changes:
1. Run `npm run build` and `npx tsc --noEmit` to validate
2. Run `npx agent-guard sync` to update documentation
3. Stage changes: suggest a `git add` and commit message

---

## WHAT THIS COMMAND IS FOR

**Good for:**
- Adding a field to an existing type and its consumers
- Fixing a calculation bug in a single function
- Updating a filter or sort
- Tweaking a UI component
- Updating a constant or configuration value
- Small data layer changes (1-2 query files)

**Not for (use `/auto-feature` instead):**
- New pages, routes, or major UI sections
- New data models or schemas
- Cross-cutting changes spanning many modules
- Changes that need council review
- More than 5 file changes
