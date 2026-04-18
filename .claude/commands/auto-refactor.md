# /auto-refactor — Structural Refactoring Pipeline

> **Directive**: You are a refactoring orchestrator for albini-tournament. You classify risk, plan safe transformations, and verify nothing breaks.

**Refactor target**: $ARGUMENTS

---

## RULES

1. **Never refactor what you haven't mapped.** Trace all consumers before moving code.
2. **Blast radius determines the track.** Small moves get lightweight treatment. Large moves get full council review.
3. **Every refactor must pass the same validation gates as a feature.** If the build breaks, the refactor failed.
4. **Blocked areas are non-negotiable.** Report-only, never modify.
5. **Preserve all public interfaces unless explicitly asked to change them.**

---

## MODE DETECTION

Check if $ARGUMENTS refers to an audit finding or a specific refactoring target:

- **Audit remediation mode**: If the input mentions audit findings, vulnerability reports, TODO cleanup, or dead code removal → enter Audit Remediation Mode.
- **Single-target mode**: If the input specifies a file, module, or structural change → enter Single-Target Mode.

---

## AUDIT REMEDIATION MODE

Run audits in priority order:

1. **Dependency vulnerabilities**: Run the appropriate audit command for the detected stack
2. **TODO/HACK/FIXME comments**: `grep -rn "TODO\|HACK\|FIXME" src/ --include="*.*" | head -50`
3. **Large files** (over 500 lines): `find src/ -name "*.*" -exec wc -l {} + | sort -rn | head -20`
4. **Dead exports/unused code**: Use the appropriate dead-code detection tool for the stack

For each finding, classify into lanes (see below) and handle accordingly.

---

## SINGLE-TARGET MODE

### PHASE 0: TRIAGE — Lane Classification

Classify the refactoring target into one of five lanes:

| Lane | Risk | Description | Track |
|------|------|-------------|-------|
| **Lane 1: Mechanical** | Minimal | Lockfile updates, dependency bumps, inventory regeneration | Direct apply |
| **Lane 2: Structural-safe** | Low | Code extraction where boundary is clean, ≤3 consumers | Standard track |
| **Lane 2a: Lightweight** | Low | UI component extraction, 1-3 consumers, small blast radius | Lightweight track (below) |
| **Lane 3: Structural-risky** | High | Decomposing shared modules, moving types, splitting data layers | Full track + council |
| **Lane 4: Blocked** | N/A | Explicitly protected areas | Report only — do not modify |


**Lane 4 — Blocked areas for albini-tournament**:
everything can be modified



**Safety rules**:
no problem just do tihs



### LIGHTWEIGHT LANE 2a TRACK

For small, well-bounded refactors:

1. **Scope check**: Verify ≤3 direct consumers, no barrel file involvement, no blocked areas touched
2. **Read all affected files** (not just the target)
3. **Extract/move** with stable public interface
4. **Validate**: Run `npm run build` and `npx tsc --noEmit`
5. **If validation fails**, escalate to full standard track

**Escalation criteria**: >3 consumers, barrel files involved, dynamic imports affected, blocked areas touched, validation fails.

### STANDARD TRACK (Lanes 2-3)

**Phase 1**: Run `/code-inspector` and `/dependency-mapper` to map the target

**Phase 2**: Build refactoring guide with:
- Exact files to change (with line numbers)
- Import rewiring plan
- Consumer update plan
- Validation gates per step

**Phase 3**: For Lane 3 refactors, run `/council` for adversarial review

**Phase 4**: Apply council feedback via `/refine`

**Phase 5**: Ready to execute — present the refined guide to the user

---

## VALIDATION COMMANDS

- Build: `npm run build`
- Lint: `npm run lint`
- Test: `echo "no tests yet"`
- Type check: `npx tsc --noEmit`
- Doc sync: `npx agent-guard sync`

---

## OUTPUT FILES

| File | Description |
|------|-------------|
| `refactor-assessment.md` | Lane classification and risk analysis |
| `agentic_implementation_guide.md` | Refactoring plan (standard/full track only) |
| `council-feedback.md` | Cross-LLM review (Lane 3 only, if council available) |

---

## FAILURE MODES

- **Can't determine lane**: Default to Lane 3 (full track). It's safer to over-analyze than under-plan.
- **Blast radius larger than expected**: Escalate from lightweight to standard track. Tell the user why.
- **Blocked area touched**: STOP. Report the blocked area. Do not modify.
- **Circular dependency discovered**: Flag it, don't resolve it implicitly. Present to the user.
