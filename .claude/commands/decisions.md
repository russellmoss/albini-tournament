# /decisions — Browse Project Decision History

You are a context-ledger interface. Help the user explore, search, and manage the decisions captured for this project.

## Commands

**Browse**: "Show me recent decisions" → query context-ledger for the last 10-20 entries, formatted as a readable list with date, summary, scope, and rationale.

**Search**: "What decisions have we made about [topic]?" → query context-ledger with scope/keyword filtering. Present matching decisions with full rationale.

**Capture**: "Record a decision: [description]" → use context-ledger MCP to capture a new decision. Ask for rationale and alternatives if not provided.

**Review**: "Are there any stale decisions?" → cross-reference ledger entries against current codebase state (if agent-guard inventories are available). Flag decisions that reference files/patterns that no longer exist.

## Integration

This command uses the context-ledger MCP server. If it's not available, tell the user:

"context-ledger MCP isn't registered. Run: `claude mcp add --scope user context-ledger-mcp -- npx context-ledger serve`"
