# Incident Report: SPA Routing 500 Internal Server Error

**Date:** April 14, 2026  
**Issue:** Users experiencing `500 Internal Server Error` when refreshing or directly navigating to sub-routes (like `/project/46e38bd81b47f22e`) or accessing `/favicon.ico`.  

---

## 1. The Issue
When MemCTX is installed globally via npm, the UI dashboard works fine on the initial load (`/`). However, whenever a user hits a direct application link (e.g. `http://localhost:9999/project/...`) or reloads the page, they are met with a generic `Failed to load application` or `500 Internal Server Error` response. Static assets (like CSS and JS files) were paradoxically loading fine.

## 2. How The Root Cause Was Discovered

### Step 1: Tracing the Request Flow
I started by analyzing the catch-all routing logic in `src/index.ts`:
```typescript
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(indexPath, (err) => {
      if (err) {
        // This is where it was failing and sending 500
        if (!res.headersSent) res.status(500).send('Failed to load application')
      }
    })
  }
})
```

### Step 2: Unmasking the Silent Error
The original code swallowed the true error. I modified it to output the full error stack to the screen:
```typescript
res.status(500).json({ error: String(err), message: err.message, stack: err.stack, path: indexPath })
```
Upon testing the route again, I received:
`"error": "NotFoundError: Not Found"` triggered by the `send` package (which powers Express's `sendFile` function).

### Step 3: Verifying File Existence
I manually checked if the file actually existed at the absolute path:
`/home/max/.npm-global/lib/node_modules/memctx/dashboard/dist/index.html`
The file **was definitely there**, so why did Express report `Not Found`?

### Step 4: Digging into the `send` Library
I inspected the source code of the underlying `send` library inside `node_modules` (specifically lines 460-470 of `send/index.js`). 

I discovered a built-in security mechanism: **by default, `send` ignores any file transfers where the path contains a "dotfile" or hidden directory.** 
Because `npm install -g` resolves paths into the hidden `~/.npm-global` directory, the absolute path explicitly contained a dot-folder. As a result, Express's `send` module intentionally blinded itself to the file and threw a silent 404 security error.

*(Note: CSS and JS assets were not affected because they were served by `express.static`, which calculates paths relative to the pre-set static folder and avoids the dotfile check on the root origin).*

## 3. The Fix

The fix was incredibly simple once the mechanism was understood. We simply needed to instruct Express's `sendFile` method that dotfiles within this specific absolute path are safe and allowed.

I modified `artifacts/claudectx-backup/src/index.ts` to include the `{ dotfiles: 'allow' }` option:

**Before:**
```typescript
res.sendFile(indexPath, (err) => { ... })
```

**After:**
```typescript
res.sendFile(indexPath, { dotfiles: 'allow' }, (err) => { ... })
```

### Verification
I rebuilt the dashboard and worker (`pnpm run build`), updated the version number locally to `1.2.3`, reinstalled the package globally using `npm install -g .`, and restarted the daemon (`memctx restart`).
Refreshing the page on exact sub-routes directly served the HTML file with a fast `200 OK`!
