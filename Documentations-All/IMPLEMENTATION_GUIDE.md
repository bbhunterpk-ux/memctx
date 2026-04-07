# ClaudeContext Feature Implementation Instructions
**Version 3.0 Development Guide**
*Created: April 5, 2026*

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
4. [Technical Guidelines](#technical-guidelines)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm installed
- ClaudeContext v2.0 running successfully
- Familiarity with React, TypeScript, and Vite
- Access to FEATURE_ROADMAP.md and PROGRESS.md

### Project Structure
```
Claude-Context/
├── artifacts/
│   └── claudectx-backup/
│       ├── dashboard/          # React frontend
│       │   ├── src/
│       │   │   ├── pages/      # Page components
│       │   │   ├── components/ # Reusable components
│       │   │   ├── api/        # API client
│       │   │   └── hooks/      # Custom hooks
│       │   └── dist/           # Built files
│       ├── worker/             # Background worker
│       └── api-server/         # API server
├── FEATURE_ROADMAP.md          # Complete feature roadmap
├── PROGRESS.md                 # Progress tracker
└── IMPLEMENTATION_GUIDE.md     # This file
```

### Initial Setup
```bash
# Navigate to project
cd /home/max/All_Projects_Files/April\ 2026\ Projects/Claude-Context

# Install dependencies
cd artifacts/claudectx-backup/dashboard
pnpm install

# Start development server
pnpm run dev

# In another terminal, build and watch
pnpm run build --watch
```

---

## 🔄 Development Workflow

### 1. Before Starting a Feature

**Step 1: Review Documentation**
- Read FEATURE_ROADMAP.md for feature details
- Check PROGRESS.md for current status
- Review any related GitHub issues/tickets

**Step 2: Update Progress**
```bash
# Open PROGRESS.md
# Mark the feature as "In Progress"
# Add your name and start date
```

**Step 3: Create Feature Branch** (if using git)
```bash
git checkout -b feature/phase-1-theme-toggle
```

### 2. During Development

**Step 1: Follow Code Style**
- Use TypeScript for type safety
- Follow existing component patterns
- Use inline styles (consistent with current codebase)
- Add comments for complex logic

**Step 2: Test Frequently**
```bash
# Run dev server
pnpm run dev

# Build to check for errors
pnpm run build

# Test in browser at http://localhost:5173
```

**Step 3: Document Decisions**
- Add notes to PROGRESS.md
- Update FEATURE_ROADMAP.md if scope changes
- Document any new APIs or patterns

### 3. After Completing a Feature

**Step 1: Build and Test**
```bash
# Build production bundle
pnpm run build

# Test the built version
# Worker should serve from dist/
```

**Step 2: Update Documentation**
- Mark feature as complete in PROGRESS.md
- Add to "Recent Changes" section
- Update completion percentages

**Step 3: Commit Changes**
```bash
git add .
git commit -m "feat: implement theme toggle (Phase 1.1)"
git push origin feature/phase-1-theme-toggle
```

---

## 📋 Phase-by-Phase Implementation

### Phase 1: Foundation & Quick Wins

#### 1.1 Dark/Light Theme Toggle

**Files to Create/Modify:**
- `src/components/ThemeToggle.tsx` (new)
- `src/hooks/useTheme.ts` (new)
- `src/index.css` (modify)
- `src/components/Layout.tsx` (modify)

**Implementation Steps:**

1. **Create theme hook:**
```typescript
// src/hooks/useTheme.ts
import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const activeTheme = theme === 'system' ? systemTheme : theme

    if (activeTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, setTheme }
}
```

2. **Add dark theme CSS variables:**
```css
/* src/index.css */
:root {
  /* Light theme (existing) */
  --bg: #0d0d0f;
  --surface: #16161a;
  /* ... existing variables ... */
}

:root.dark {
  /* Dark theme */
  --bg: #0d0d0f;
  --surface: #16161a;
  --surface2: #1e1e24;
  --border: #2a2a35;
  --text: #e8e8f0;
  --text-muted: #7a7a99;
  --accent: #7c6cfc;
  --accent-hover: #9181fd;
  --green: #22c55e;
  --yellow: #eab308;
  --red: #ef4444;
  --blue: #3b82f6;
  --orange: #f97316;
}

:root:not(.dark) {
  /* Light theme */
  --bg: #ffffff;
  --surface: #f9fafb;
  --surface2: #f3f4f6;
  --border: #e5e7eb;
  --text: #111827;
  --text-muted: #6b7280;
  --accent: #7c6cfc;
  --accent-hover: #6b5ce8;
  --green: #16a34a;
  --yellow: #ca8a04;
  --red: #dc2626;
  --blue: #2563eb;
  --orange: #ea580c;
}
```

3. **Create theme toggle component:**
```typescript
// src/components/ThemeToggle.tsx
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px', background: 'var(--surface2)', borderRadius: 8 }}>
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          style={{
            padding: '6px 8px',
            background: theme === value ? 'var(--accent)' : 'transparent',
            color: theme === value ? 'white' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
```

4. **Add to Layout:**
```typescript
// src/components/Layout.tsx
import ThemeToggle from './ThemeToggle'

// Add in the sidebar footer section:
<div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
  <ThemeToggle />
  {/* existing health info */}
</div>
```

**Testing:**
- [ ] Toggle between light/dark/system themes
- [ ] Verify theme persists on page reload
- [ ] Check all pages render correctly in both themes
- [ ] Test system theme follows OS preference

---

#### 1.2 Keyboard Shortcuts

**Files to Create/Modify:**
- `src/hooks/useKeyboardShortcuts.ts` (new)
- `src/components/KeyboardShortcutsHelp.tsx` (new)
- `src/App.tsx` (modify)

**Implementation Steps:**

1. **Create keyboard shortcuts hook:**
```typescript
// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      // Ignore if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Navigation shortcuts
      if (e.key === 'j') {
        // Next item (implement scroll logic)
      } else if (e.key === 'k') {
        // Previous item
      } else if (e.key === '/') {
        e.preventDefault()
        // Focus search input
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        searchInput?.focus()
      } else if (e.key === 'Escape') {
        // Close modals/dialogs
        document.dispatchEvent(new CustomEvent('close-modal'))
      } else if (e.key === '?') {
        // Show keyboard shortcuts help
        document.dispatchEvent(new CustomEvent('show-shortcuts'))
      }

      // Navigation with 'g' prefix
      if (e.key === 'g') {
        // Wait for next key
        const handleNext = (e2: KeyboardEvent) => {
          if (e2.key === 'h') navigate('/')
          if (e2.key === 's') navigate('/search')
          if (e2.key === 'l') navigate('/live')
          if (e2.key === 'm') navigate('/metrics')
          window.removeEventListener('keydown', handleNext)
        }
        window.addEventListener('keydown', handleNext)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [navigate])
}
```

2. **Create shortcuts help modal:**
```typescript
// src/components/KeyboardShortcutsHelp.tsx
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShow = () => setIsOpen(true)
    const handleClose = () => setIsOpen(false)
    
    document.addEventListener('show-shortcuts', handleShow)
    document.addEventListener('close-modal', handleClose)
    
    return () => {
      document.removeEventListener('show-shortcuts', handleShow)
      document.removeEventListener('close-modal', handleClose)
    }
  }, [])

  if (!isOpen) return null

  const shortcuts = [
    { keys: ['j'], description: 'Next item' },
    { keys: ['k'], description: 'Previous item' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['Esc'], description: 'Close modal' },
    { keys: ['?'], description: 'Show shortcuts' },
    { keys: ['g', 'h'], description: 'Go to home' },
    { keys: ['g', 's'], description: 'Go to search' },
    { keys: ['g', 'l'], description: 'Go to live' },
    { keys: ['g', 'm'], description: 'Go to metrics' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={() => setIsOpen(false)}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 24,
        maxWidth: 500,
        width: '90%',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Keyboard Shortcuts</h2>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {shortcuts.map((shortcut, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{shortcut.description}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {shortcut.keys.map((key, j) => (
                  <kbd key={j} style={{
                    padding: '4px 8px',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

3. **Add to App:**
```typescript
// src/App.tsx
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp'

export default function App() {
  useKeyboardShortcuts()
  
  return (
    <>
      <Layout>
        {/* existing routes */}
      </Layout>
      <ToastContainer />
      <KeyboardShortcutsHelp />
    </>
  )
}
```

**Testing:**
- [ ] Press `?` to show shortcuts help
- [ ] Press `/` to focus search
- [ ] Press `Esc` to close modals
- [ ] Press `g` then `h` to go home
- [ ] Verify shortcuts don't trigger when typing in inputs

---

#### 1.3 Session Bookmarks/Favorites

**Database Schema Changes:**
```sql
-- Add to sessions table
ALTER TABLE sessions ADD COLUMN is_bookmarked INTEGER DEFAULT 0;
CREATE INDEX idx_sessions_bookmarked ON sessions(is_bookmarked, project_id);
```

**API Endpoints to Add:**
```typescript
// worker/src/routes.ts
app.post('/api/sessions/:id/bookmark', async (req, res) => {
  const { id } = req.params
  const { bookmarked } = req.body
  
  await db.run(
    'UPDATE sessions SET is_bookmarked = ? WHERE id = ?',
    [bookmarked ? 1 : 0, id]
  )
  
  res.json({ success: true })
})
```

**Frontend Implementation:**
```typescript
// src/api/client.ts
export const api = {
  // ... existing methods ...
  
  toggleBookmark: async (sessionId: string, bookmarked: boolean) => {
    const res = await fetch(`/api/sessions/${sessionId}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookmarked }),
    })
    return res.json()
  },
}

// src/components/SessionCard.tsx
import { Star } from 'lucide-react'

// Add bookmark button
<button
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    handleToggleBookmark()
  }}
  style={{
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: session.is_bookmarked ? 'var(--yellow)' : 'var(--text-muted)',
  }}
>
  <Star size={16} fill={session.is_bookmarked ? 'var(--yellow)' : 'none'} />
</button>
```

**Testing:**
- [ ] Click star to bookmark session
- [ ] Verify bookmark persists on page reload
- [ ] Add filter to show only bookmarked sessions
- [ ] Test bookmark toggle in session detail page

---

### Phase 2-10: Future Implementation

Detailed instructions for remaining phases will be added as Phase 1 completes. Follow the same pattern:

1. **Review feature spec** in FEATURE_ROADMAP.md
2. **Plan database changes** (if needed)
3. **Create API endpoints** (backend)
4. **Build UI components** (frontend)
5. **Test thoroughly**
6. **Update documentation**

---

## 🛠 Technical Guidelines

### Code Style

**TypeScript:**
```typescript
// Use explicit types
interface Session {
  id: string
  title: string
  status: 'active' | 'completed'
}

// Use const for immutable values
const MAX_SESSIONS = 100

// Use arrow functions for components
const MyComponent = ({ prop }: { prop: string }) => {
  return <div>{prop}</div>
}
```

**React Patterns:**
```typescript
// Use custom hooks for logic
function useSessionData(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id),
  })
}

// Keep components small and focused
function SessionTitle({ title }: { title: string }) {
  return <h1>{title}</h1>
}

// Use composition over props drilling
<SessionProvider value={session}>
  <SessionHeader />
  <SessionBody />
</SessionProvider>
```

**Styling:**
```typescript
// Use inline styles with CSS variables
<div style={{
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 16,
}}>
  Content
</div>

// Group related styles
const cardStyles = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: 16,
}
```

### Performance Best Practices

1. **Use React Query for server state:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['sessions'],
  queryFn: api.getSessions,
  staleTime: 5000, // 5 seconds
  refetchInterval: 15000, // 15 seconds
})
```

2. **Memoize expensive computations:**
```typescript
const sortedSessions = useMemo(() => {
  return sessions.sort((a, b) => b.started_at - a.started_at)
}, [sessions])
```

3. **Lazy load heavy components:**
```typescript
const HeavyChart = lazy(() => import('./HeavyChart'))

<Suspense fallback={<Loading />}>
  <HeavyChart data={data} />
</Suspense>
```

4. **Optimize bundle size:**
```typescript
// Import only what you need
import { format } from 'date-fns/format'
// Instead of: import { format } from 'date-fns'
```

### Error Handling

```typescript
// API calls
try {
  const result = await api.doSomething()
  toast.success('Success!')
} catch (error) {
  console.error('Error:', error)
  toast.error('Failed: ' + error.message)
}

// React error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

Before marking a feature complete:

- [ ] Test in Chrome, Firefox, Safari
- [ ] Test on mobile (responsive design)
- [ ] Test with slow network (throttle in DevTools)
- [ ] Test with empty state (no data)
- [ ] Test with large dataset (100+ sessions)
- [ ] Test error states (API failures)
- [ ] Test loading states
- [ ] Test keyboard navigation
- [ ] Test screen reader (basic accessibility)

### Automated Testing (Future)

```typescript
// Unit tests (Vitest)
describe('useTheme', () => {
  it('should toggle theme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')
  })
})

// E2E tests (Playwright)
test('should bookmark session', async ({ page }) => {
  await page.goto('/project/123')
  await page.click('[data-testid="bookmark-button"]')
  await expect(page.locator('[data-testid="bookmark-icon"]')).toHaveClass(/filled/)
})
```

---

## 🚀 Deployment Process

### Build for Production

```bash
# Navigate to dashboard
cd artifacts/claudectx-backup/dashboard

# Build
pnpm run build

# Output will be in dist/
# Worker serves from this directory
```

### Verify Build

```bash
# Check bundle size
ls -lh dist/assets/

# Test built version
# Start worker and visit http://localhost:9999
```

### Deployment Checklist

- [ ] Run `pnpm run build`
- [ ] Check for build errors
- [ ] Verify bundle size (<500KB)
- [ ] Test in production mode
- [ ] Check console for errors
- [ ] Verify all routes work
- [ ] Test API endpoints
- [ ] Check database migrations (if any)
- [ ] Update version number
- [ ] Tag release in git

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Build fails with TypeScript errors**
```bash
# Check TypeScript errors
pnpm run tsc --noEmit

# Fix errors or add @ts-ignore as last resort
```

**Issue: Hot reload not working**
```bash
# Restart dev server
# Clear browser cache
# Check Vite config
```

**Issue: API calls failing**
```bash
# Check worker is running
curl http://localhost:9999/api/health

# Check database
sqlite3 ~/.claudectx/db.sqlite "SELECT COUNT(*) FROM sessions"

# Check logs
tail -f ~/.claudectx/worker.log
```

**Issue: Styles not applying**
```bash
# Check CSS variables are defined
# Inspect element in DevTools
# Verify build includes CSS
```

**Issue: Performance problems**
```bash
# Profile in React DevTools
# Check bundle size
# Look for unnecessary re-renders
# Optimize images and assets
```

### Getting Help

1. **Check documentation:**
   - FEATURE_ROADMAP.md
   - PROGRESS.md
   - This file (IMPLEMENTATION_GUIDE.md)

2. **Search existing issues:**
   - GitHub issues
   - Past session notes

3. **Debug systematically:**
   - Reproduce the issue
   - Check browser console
   - Check network tab
   - Check React DevTools
   - Add console.logs
   - Use debugger

4. **Ask for help:**
   - Document what you've tried
   - Provide error messages
   - Share relevant code
   - Describe expected vs actual behavior

---

## 📚 Additional Resources

### Documentation
- [React Query Docs](https://tanstack.com/query/latest)
- [Vite Docs](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Lucide Icons](https://lucide.dev/)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Vite DevTools](https://github.com/webfansplz/vite-plugin-vue-devtools)
- [SQLite Browser](https://sqlitebrowser.org/)

### Best Practices
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## ✅ Quick Reference

### Common Commands
```bash
# Development
pnpm run dev              # Start dev server
pnpm run build            # Build for production
pnpm run build --watch    # Build and watch

# Database
sqlite3 ~/.claudectx/db.sqlite  # Open database
.schema sessions                 # Show table schema
SELECT * FROM sessions LIMIT 5;  # Query data

# Git
git status                       # Check status
git add .                        # Stage changes
git commit -m "feat: ..."        # Commit
git push                         # Push to remote
```

### File Locations
- **Frontend:** `artifacts/claudectx-backup/dashboard/src/`
- **API:** `artifacts/claudectx-backup/worker/src/`
- **Database:** `~/.claudectx/db.sqlite`
- **Logs:** `~/.claudectx/worker.log`
- **Config:** `~/.claudectx/config.json`

### Key Files
- `src/App.tsx` - Main app component
- `src/components/Layout.tsx` - Sidebar layout
- `src/api/client.ts` - API client
- `src/index.css` - Global styles
- `vite.config.ts` - Vite configuration

---

*This guide will be updated as new patterns and best practices emerge. Keep it as your reference for all development work.*
