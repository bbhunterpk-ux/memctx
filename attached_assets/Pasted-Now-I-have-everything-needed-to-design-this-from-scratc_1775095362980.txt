Now I have everything needed to design this from scratch. Let me architect the full system.Now let me show you the actual code structure to build this:Here's the complete picture of what you'd be building and how it all fits together.

**What makes this system different from everything existing:**

The key insight is that hooks must be fast (under 1 second) while AI compression takes 5–30 seconds per observation — so the hook layer only enqueues events, and the worker processes them asynchronously. This means Claude Code never feels slow, but everything gets captured.

The `SessionStart` hook can inject `additionalContext` silently — so Claude reads the last 3 session summaries automatically without the user typing anything or seeing any noise in the terminal. That's the core magic that solves your problem.

**The 6-layer architecture in plain terms:**

1. **Hook layer** — 6 tiny scripts (~10 lines each) that fire on every Claude Code lifecycle event and POST data to the worker in under 10ms
2. **Worker service** — a Node.js daemon always running at `localhost:9999` that handles all the heavy work asynchronously
3. **SQLite database** — 3 tables: `projects` (workspaces), `sessions` (one per Claude session), `observations` (every tool call, decision, file edit)
4. **AI summarizer** — reads the raw `.jsonl` transcript at session end, calls Haiku to extract a structured JSON summary (title, what we did, files, decisions, next steps, gotchas)
5. **Context injector** — at every new session start, fetches last N summaries and injects them as background context so Claude already knows what happened before
6. **React dashboard at `:9999`** — live feed of current session, all past sessions per project, full text search, timeline view

**Build order (recommended):**

Start with the DB schema + worker skeleton → add the 6 hook scripts → wire up `SessionEnd` + AI summarizer → add `SessionStart` context injection → build the dashboard last. You'll have a working system after step 3 even before the dashboard exists.

**Optional cloud sync** — the Supabase layer can be added later by just pointing `db/client.ts` to also replicate to Postgres via `pg`. The rest of the system doesn't change.

Want me to generate the actual full codebase for this as files you can download and run?