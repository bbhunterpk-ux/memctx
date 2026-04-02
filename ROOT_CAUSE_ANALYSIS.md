# Root Cause Analysis - ClaudeContext Not Working

**Date**: 2026-04-02  
**Status**: ✅ RESOLVED  
**Issue**: Session context not injected at startup, summaries not generated

---

## 🔴 ROOT CAUSES IDENTIFIED & FIXED

### Issue 1: Wrong API Endpoint Configuration

### Current State (BROKEN)
```typescript
// config.ts line 17-18
apiBaseUrl: process.env.ANTHROPIC_BASE_URL || 'http://localhost:20128/v1',
apiKey: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY || 'sk_9router',
```

### Environment Variables (WRONG)
```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:1337  # ❌ WRONG - This is Jan.ai, not 9router
ANTHROPIC_AUTH_TOKEN=jan                   # ❌ WRONG - Not the 9router token
```

### Expected Configuration (from settings.json)
```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:20128/v1",  # ✅ 9router endpoint
    "ANTHROPIC_AUTH_TOKEN": "sk_9router",               # ✅ 9router token
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "AWS"
  }
}
```

---

## 🔍 Evidence

### 1. Worker Logs Show Connection Error
```
Summarization failed for session 5d34a54e-232e-4d94-ace4-63cc768f722f 
APIConnectionError: Connection error.
```

### 2. Session Has No Summary
```sql
SELECT summary_title FROM sessions WHERE id = '5d34a54e-232e-4d94-ace4-63cc768f722f';
-- Result: NULL (empty)
```

### 3. Worker Process Running
```bash
PID: 343498
Port: 8000 ✅
Health: OK ✅
```

### 4. Environment Mismatch
Worker inherits shell environment variables which point to Jan.ai (127.0.0.1:1337) instead of 9router (localhost:20128).

---

## 🎯 Why Context Injection Failed

### Flow Breakdown

1. **SessionStart hook fires** ✅
   - Hook script: `~/.claudectx/hooks/session-start.js`
   - Calls: `POST /api/context`

2. **Context API queries database** ✅
   - Looks for last 3 completed sessions with summaries
   - Query: `getLastNCompletedSessions(project_id, 3)`

3. **No summaries found** ❌
   - Session `5d34a54e-232e-4d94-ace4-63cc768f722f` has `summary_title = NULL`
   - Returns empty markdown: `""`

4. **Empty context injected** ❌
   - Claude receives no context about previous sessions
   - Falls back to checking git history

### Why No Summaries?

**SessionEnd hook DID fire** but summarization failed:

```javascript
// session-end.js
await postToWorker('/api/hook', {
  event: 'SessionEnd',
  session_id: input.session_id,
  transcript_path: input.transcript_path,
  cwd: input.cwd
});
```

**Worker received SessionEnd** and queued summarization:

```typescript
// hook.ts line 48-50
if (data.transcript_path) {
  enqueue(() => summarizeSession(session_id, data.transcript_path, project_id))
}
```

**Summarization failed** due to wrong API endpoint:

```typescript
// summarizer.ts line 48-49
const client = getClient()  // Uses ANTHROPIC_BASE_URL from env
const response = await client.messages.create({...})  // ❌ Connects to Jan.ai, not 9router
```

---

## 🛠️ THE FIX

### Option 1: Restart Worker with Correct Environment (RECOMMENDED)

```bash
# Stop current worker
kill 343498

# Set correct environment variables
export ANTHROPIC_BASE_URL="http://localhost:20128/v1"
export ANTHROPIC_AUTH_TOKEN="sk_9router"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="AWS"

# Restart worker
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
./start.sh
```

### Option 2: Create .env File

```bash
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context/artifacts/claudectx-backup

cat > .env << 'EOF'
ANTHROPIC_BASE_URL=http://localhost:20128/v1
ANTHROPIC_AUTH_TOKEN=sk_9router
ANTHROPIC_DEFAULT_HAIKU_MODEL=AWS
PORT=8000
EOF

# Restart worker
kill 343498
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context
./start.sh
```

### Option 3: Update start.sh to Export Variables

```bash
# Edit start.sh to export environment before starting worker
# Add before line 82:
export ANTHROPIC_BASE_URL="http://localhost:20128/v1"
export ANTHROPIC_AUTH_TOKEN="sk_9router"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="AWS"
```

---

## ✅ Verification Steps

After applying fix:

1. **Manually trigger summarization for old session**:
```bash
curl -X POST http://localhost:8000/api/hook \
  -H "Content-Type: application/json" \
  -d '{
    "event":"SessionEnd",
    "session_id":"5d34a54e-232e-4d94-ace4-63cc768f722f",
    "cwd":"'$(pwd)'",
    "transcript_path":"/home/max/.claude/projects/-home-max-All-Projects-Files-April-2026-Projects-Claude-Context/5d34a54e-232e-4d94-ace4-63cc768f722f.jsonl"
  }'
```

2. **Check logs for success**:
```bash
tail -f /tmp/claudectx.log | grep -E "Summary saved|Summarization failed"
```

3. **Verify summary in database**:
```bash
sqlite3 ~/.claudectx/db.sqlite "SELECT summary_title FROM sessions WHERE id = '5d34a54e-232e-4d94-ace4-63cc768f722f';"
```

4. **Test context injection**:
```bash
curl -X POST http://localhost:8000/api/context \
  -H "Content-Type: application/json" \
  -d '{"cwd":"'$(pwd)'","session_id":"test"}' | jq -r '.markdown'
```

Should return:
```
=== ClaudeContext: Last 1 session(s) for [Claude-Context] ===

[Apr 2, 03:43] <summary_title> — COMPLETED
  Done: <what_we_did items>
  Files: <files_changed>
  Next: <next_steps>

=== End of ClaudeContext ===
```

5. **Start new Claude Code session** and ask "what did we do last session?" - should get context automatically!

---

## 📊 Current Database State

```bash
Sessions: 5 total
- 1 completed (5d34a54e-232e-4d94-ace4-63cc768f722f)
- 4 active (never ended properly)

Observations: 29 for session 5d34a54e
- 3 user_message
- 24 tool_call
- 2 assistant_message

Summaries: 0 (all NULL due to API connection error)
```

---

## 🎯 Expected Behavior After Fix

1. **Session ends** → SessionEnd hook fires
2. **Worker receives event** → Queues summarization
3. **Summarizer runs** → Connects to 9router (localhost:20128)
4. **9router forwards** → To AWS Claude Haiku
5. **Summary generated** → Saved to database
6. **Next session starts** → SessionStart hook fires
7. **Context API queries** → Finds summary
8. **Context injected** → Claude knows what you did before!

---

---

## ✅ RESOLUTION SUMMARY

### What Was Fixed

1. **Environment Variables** - Updated `start.sh` to export correct 9router credentials
2. **API Response Format** - Added OpenAI format parser (9router returns OpenAI-style responses)
3. **Stream Handling** - Added `stream: false` to API calls

### Files Modified

- `/home/max/All_Projects_Files/April 2026 Projects/Claude-Context/start.sh` - Added environment exports
- `artifacts/claudectx-backup/src/services/summarizer.ts` - Added OpenAI format support and stream: false

### Verification

```bash
# Summary successfully created
sqlite3 ~/.claudectx/db.sqlite "SELECT summary_title FROM sessions WHERE id = '5d34a54e-232e-4d94-ace4-63cc768f722f';"
# Result: "Debugged Missing Session Summaries in Context System"

# Context API now returns summaries
curl -X POST http://localhost:8000/api/context -d '{"cwd":"'$(pwd)'","session_id":"test"}' | jq -r '.markdown'
# Result: Shows last session summary with title, what_we_did, next_steps, gotchas
```

---

## 🎯 System Now Fully Operational

**When you start a new Claude Code session**, the SessionStart hook will automatically inject context from previous sessions, so Claude will know what you worked on before without needing to check git history.

**Test it**: Start a new session and ask "what did we do last session?" - Claude should respond with the summary from session 5d34a54e! ✅
