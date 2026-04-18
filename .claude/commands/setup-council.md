# /setup-council — Configure Council Review

You are a setup wizard for rstack's cross-LLM adversarial review system.

## Step 1: Verify MCP Server

Check if `council-mcp` tools are available (`ask_codex`, `ask_gemini`).

If not available, guide the user:
```
To set up council review:

1. Add API keys to your environment:
   OPENAI_API_KEY=sk-...    (get from https://platform.openai.com/api-keys)
   GEMINI_API_KEY=AI...     (get from https://aistudio.google.com/apikey)

2. Register the MCP server:
   claude mcp add --scope user council-mcp -- npx council-mcp

3. Re-run /setup-council to verify
```

## Step 2: Check Available Providers

Test which providers are accessible:
- Try `ask_codex` with a simple test prompt
- Try `ask_gemini` with a simple test prompt

Report which providers are working.

## Step 3: Learn About the Project

Silently read project context:
- `package.json` / project config files
- `README.md`
- Top-level directory structure
- `.claude/commands/` (if exists)

Do NOT read `.env` files.

Then ask the user these questions:
1. What does this project do? Who uses it? What kind of data does it handle?
2. What's most likely to go wrong? (database/schema, type safety, data integrity, API contracts, UI, business logic, performance, security)
3. Who uses it and what would a bad bug look like?
4. Do you have an existing workflow for planning features?
5. Are there specific review criteria you always want checked?

## Step 4: Check for Existing Commands

Check if `.claude/commands/council.md` and `.claude/commands/refine.md` already exist. If so, offer to back up and overwrite.

## Step 5: Generate Commands

Create `.claude/commands/council.md` and `.claude/commands/refine.md` tailored to this project.

Map the user's risk areas to reviewer prompts:

| Risk Area | Focus | Best Provider |
|-----------|-------|---------------|
| Type safety / construction sites | Find missing code paths, wrong types | Codex |
| Database / query correctness | Verify fields, NULL handling, performance | Codex |
| Business logic | Challenge assumptions, verify data interpretation | Gemini |
| Data quality / exports | Edge cases, formatting, integrity | Gemini |
| API contracts | Breaking changes, error handling, response shape | Codex |
| UI / display logic | End-user sense, formatting, accessibility | Gemini |
| Security / auth | Permission checks, data exposure, injection | Codex |
| Pattern consistency | Compare vs established patterns, flag drift | Codex |

## Step 6: Confirm and Test

Tell the user:
- What commands were created
- How to use them: "Run `/council` after creating an implementation guide to get cross-LLM review, then `/refine` to apply the feedback."
- Remind them: "Council review works best after `/auto-feature` generates an implementation guide."
