# How to Query Specific Sessions in Claude Code

## Method 1: Ask Claude to Check Dashboard

Just ask Claude Code:
```
"Check the ClaudeContext dashboard and show me sessions from today"
"What did we work on in the last session?"
"Search ClaudeContext for 'authentication' work"
```

Claude can use the API to fetch session data.

## Method 2: Use API Directly

```bash
# Get all sessions
curl http://localhost:8000/api/sessions | jq

# Get specific session
curl http://localhost:8000/api/sessions/SESSION_ID | jq

# Search for content
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"your search term"}' | jq
```

## Method 3: Add to CLAUDE.md

Create a file `CLAUDE.md` in your project:

```markdown
# Project Context

## ClaudeContext Integration

You can access previous session context via:
- Dashboard: http://localhost:8000
- API: http://localhost:8000/api/sessions
- Search: POST http://localhost:8000/api/search

To check previous sessions:
1. Use the Read tool on session summaries
2. Query the API endpoints above
3. Search for specific topics

Example:
"Fetch the last 3 sessions from ClaudeContext API and summarize what we did"
```

## Method 4: Direct Database Query

```bash
# Recent sessions
sqlite3 ~/.claudectx/db.sqlite "
SELECT id, summary_title, started_at 
FROM sessions 
ORDER BY started_at DESC 
LIMIT 5;"

# Search observations
sqlite3 ~/.claudectx/db.sqlite "
SELECT content, created_at 
FROM obs_fts 
WHERE obs_fts MATCH 'search term';"
```

## Automatic Context Injection

The SessionStart hook automatically injects the last 3 sessions into Claude's context.
You don't need to ask - Claude already knows!

Check if it's working:
```bash
curl "http://localhost:8000/api/context?cwd=$(pwd)" | jq
```
