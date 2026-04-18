# /auto-feature — Full Feature Pipeline

> **Directive**: You are a senior staff engineer implementing a feature for albini-tournament. You plan meticulously, explore thoroughly, get adversarial review, and only then execute.

**Feature request**: $ARGUMENTS

---

## RULES

1. **Never guess at file structure.** Use exploration agents to map the codebase first. Wrong paths cascade through the entire guide.
2. **Schema first.** Before writing any data layer code, verify field names, types, and population rates from schema documentation or MCP tools.
3. **Council review is not optional when API keys are present.** Two independent models catch what you miss.
4. **Every phase in the build guide must have a validation gate.** If validation fails, the phase is not done.
5. **Front-load all human questions.** Gather everything you need to ask, ask it once, then build autonomously.

---

## PHASE 1: PARALLEL EXPLORATION

Launch three exploration agents simultaneously. Each writes its own findings file.

### Agent 1: code-inspector
Run `/code-inspector` to trace the full code path for this feature. Output: `code-inspector-findings.md`

### Agent 2: data-verifier
Run `/data-verifier` to verify all data layer assumptions. Output: `data-verifier-findings.md`

### Agent 3: pattern-finder
Run `/pattern-finder` to identify established patterns relevant to this feature. Output: `pattern-finder-findings.md`

**After all three complete**, synthesize findings into `exploration-results.md`:
- Confirmed construction sites (with file paths and line numbers)
- Verified schema fields and types
- Established patterns to follow
- Risks and unknowns
- Recommended implementation order

---

## PHASE 2: BUILD IMPLEMENTATION GUIDE

Using exploration results, create `agentic_implementation_guide.md` with these sections:

### Structure

1. **Reference Context** — What this feature does, who it's for, why it matters
2. **Construction Sites** — Every file that needs changes, with line numbers and what changes
3. **Phase-by-phase plan**:
   - Phase 1: Blocking prerequisites (dependencies, configuration, migrations)
   - Phase 2: Utility functions / shared helpers
   - Phase 3: Type definitions / models / schemas
   - Phase 4: Primary data layer (queries, API endpoints, data access)
   - Phase 5: Integration layer (connecting data to presentation)
   - Phase 6: Presentation layer (UI components, views, output)
   - Phase 7: All remaining construction sites and integration points
   - Phase 7.5: Documentation sync (`npx agent-guard sync`)
   - Phase 8: Validation and testing (user-verified)
4. **Validation gates** — What to check after each phase

### Rules for the guide
- Every file reference must include the full path from project root
- Every phase must end with a validation gate (build, lint, type-check, or test command)
- Phase ordering must respect dependencies — no forward references
- Validation commands:
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Test: `echo "no tests yet"`
  - Type check: `npx tsc --noEmit`

---

## PHASE 3: ADVERSARIAL COUNCIL REVIEW

**Skip this phase if council-mcp is not available.** Print: "Council review skipped — no API keys found. Add OPENAI_API_KEY and GEMINI_API_KEY to your .env, then run `/council` to get the review."

If council-mcp is available, run `/council` to send the implementation guide for cross-LLM adversarial review.

---

## PHASE 4: SELF-TRIAGE & REFINEMENT

If council feedback exists, run `/refine` to triage and apply feedback.

Three buckets:
1. **Apply immediately** — Construction site fixes, field name corrections, pattern inconsistencies, missing error handling, phase ordering issues, validation gate updates.
2. **Ask the user** — Business logic interpretation, design questions, scope decisions, calculation changes.
3. **Note but don't apply** — Scope expansion, alternative architectures, performance optimizations not requested.

**HUMAN INPUT GATE**: If there are Bucket 2 items, STOP and present them to the user. Wait for answers before proceeding.

---

## OUTPUT FILES

| File | Description |
|------|-------------|
| `code-inspector-findings.md` | Code path trace for this feature |
| `data-verifier-findings.md` | Schema and data verification results |
| `pattern-finder-findings.md` | Established patterns relevant to this feature |
| `exploration-results.md` | Synthesized exploration findings |
| `agentic_implementation_guide.md` | Phase-by-phase build plan with validation gates |
| `council-feedback.md` | Cross-LLM review feedback (if council available) |
| `triage-results.md` | Self-triage of council feedback (if council ran) |

---

## FAILURE MODES

- **Exploration finds nothing**: The feature may not touch existing code. Ask the user where to start.
- **Schema verification fails**: Field doesn't exist or has unexpected type. STOP and ask the user.
- **Council unavailable**: Continue without review. Recommend running `/council` later.
- **Bucket 2 items exist**: STOP at the human input gate. Do not auto-resolve business decisions.

---

## PROJECT CONTEXT

- **Project**: albini-tournament
- **Tech stack**: 
- **Data layer**: None detected

- **Risk areas**: it just needs to work and track a tournament 
- **Users**: friends. nothing happens. who cares
- **Conventions**: no problem just do tihs

- **Blocked areas** (never modify): everything can be modified
