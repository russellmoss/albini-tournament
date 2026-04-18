# albini-tournament — Standing Instructions

## Project Overview

albini-tournament is a  project.

Data layer: None detected.


## Build & Validation Commands

```bash
# Build
npm run build

# Lint
npm run lint

# Test
echo "no tests yet"

# Type check
npx tsc --noEmit
```

Always run build and type-check after making changes. Fix errors before moving on.

## Conventions

no problem just do tihs



## Blocked Areas

These areas must NOT be modified without explicit human approval:
everything can be modified


## Infrastructure

This project uses rstack for agentic development:
- **context-ledger**: Decision history. Query with `/decisions`. Captures precedent from every pipeline run.
- **agent-guard**: Documentation drift detection. Run `npx agent-guard sync` after code changes.
- **council review**: Cross-LLM adversarial review. Run `/council` after building implementation guides.



## Key Commands

- `/auto-feature [description]` — Full feature pipeline with exploration, guide, and council review
- `/quick-update [description]` — Lightweight path for 1-5 file changes
- `/auto-refactor [target]` — Structural refactoring with safety analysis
- `/council` — Send implementation guide for cross-LLM review
- `/refine` — Apply council feedback
- `/help` — Find the right command for what you're trying to do


## Documentation Maintenance — Standing Instructions

### Rule: Update Docs When You Change Code

When you add, rename, remove, or significantly modify any of the following, you MUST update the relevant documentation **in the same session** — do not defer to a later task:

| If You Changed… | Update This | And Run… |
|---|---|---|
| `.env` | Environment Variables section in `docs\ARCHITECTURE.md` | Run `npm run gen:env` |
| `src/*` | Architecture section in `docs\ARCHITECTURE.md` | — |

### Generated Inventories

Auto-generated inventory files exist at `docs\_generated\`:
- `npm run gen:env`
- Run all: `npm run gen:all`

These are committed to the repo. Always regenerate after changing routes, models, or env vars.

### Pre-Commit Hook Behavior
- If the pre-commit hook is in **blocking mode** (`autoFix.hook.mode: "blocking"`), you MUST update documentation BEFORE committing. The hook will exit 1 and reject the commit if docs are stale. Run generators and update narrative docs first, then commit.
- When you (an AI agent) trigger a commit, the hook detects this and skips all AI engines to prevent self-invocation. If docs are stale, the commit will be rejected with exit 1. Read the changed source files, update the relevant sections in docs/ARCHITECTURE.md (and any other doc targets) yourself, stage with git add, then retry the commit. Do NOT run npx agent-guard sync — update the files yourself directly.

### What NOT to Do
- Do NOT edit files in `docs\_generated\` manually — they are overwritten by scripts
- Do NOT skip documentation updates because "it's a small change" — small changes accumulate into drift
- Do NOT update `docs\ARCHITECTURE.md` without reading the existing section first — match the format

### Session Start
- At the start of every session, if `.agent-guard/session-context.md` exists, read it before making any code changes. It contains a summary of recent commits, what documentation was updated, and patterns to be aware of.
- Do NOT edit `.agent-guard/session-context.md` — it is auto-generated on every commit.