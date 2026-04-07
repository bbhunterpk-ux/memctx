# Bottom Tab Bar System - Implementation Documentation

## Overview
Implemented a browser-style bottom tab bar system for MemCTX dashboard that allows users to keep multiple projects and sessions open simultaneously and switch between them without losing context.

**Date Implemented:** 2026-04-07  
**Status:** ✅ Complete and Working

---

## Features

### Core Functionality
1. **Fixed Bottom Tab Bar** - Always visible at bottom of screen (above sidebar)
2. **Project Tabs** - Each opened project gets a tab
3. **Session Tabs** - Each opened session gets a tab
4. **Smart Tab Replacement** - Sessions replace their parent project tab (bidirectional)
5. **Persistent Tabs** - Saved to localStorage, survive page refresh
6. **Active Tab Highlighting** - Current tab highlighted with accent color
7. **Close Button (×)** - Each tab has a close button
8. **Horizontal Scroll** - Supports many tabs with smooth scrolling
9. **Smart Navigation** - Closing active tab switches to another open tab

---

## Architecture

### Component Structure

```
App.tsx (State Management)
├── openTabs: OpenTab[]
├── addTab(id, name, type, projectId?)
├── closeTab(id)
└── ProjectTabBar Component
    └── Renders tabs at bottom
```

### Data Model

```typescript
interface OpenTab {
  id: string           // Project or Session ID
  name: string         // Display name
  type: 'project' | 'session'
  projectId?: string   // For sessions: parent project ID
}
```

---

## Implementation Details

### 1. ProjectTabBar Component
**File:** `dashboard/src/components/ProjectTabBar.tsx`

**Key Features:**
- Fixed position at bottom: `left: 240px` (after sidebar)
- Z-index: 100 (above content, below modals)
- Horizontal scroll with thin scrollbar
- Hover effects on tabs and close buttons
- Active tab detection from URL

**Styling:**
- Tab width: 120px min, 200px max
- Height: 48px
- Background: `var(--surface)`
- Active border: `var(--accent)`

### 2. App.tsx State Management
**File:** `dashboard/src/App.tsx`

**State:**
```typescript
const [openTabs, setOpenTabs] = useState<OpenTab[]>(() => {
  const saved = localStorage.getItem('openTabs')
  return saved ? JSON.parse(saved) : []
})
```

**Key Functions:**

#### addTab(id, name, type, projectId?)
**Logic:**
1. Check if tab already exists → Skip
2. If opening session + project tab exists → Replace project tab
3. If opening project + session from that project exists → Replace session tab
4. Otherwise → Add new tab

**Why Bidirectional Replacement?**
- Prevents duplicate tabs for same project/session
- Maintains single tab per project context
- User expects tab to "transform" not multiply

#### closeTab(id)
**Logic:**
1. Remove tab from array
2. If closing active tab → Navigate to last remaining tab or home
3. Save to localStorage

### 3. Integration Points

#### Projects Page
**File:** `dashboard/src/pages/Projects.tsx`
```typescript
interface Props {
  onOpenProject: (id: string, name: string) => void
}
```
- Receives `onOpenProject` callback from App
- Passes to MainDashboard component
- Called when project is clicked

#### ProjectDetail Page
**File:** `dashboard/src/pages/ProjectDetail.tsx`
```typescript
interface Props {
  onOpenProject: (id: string, name: string) => void
}

useEffect(() => {
  if (project && id) {
    onOpenProject(id, project.name)
  }
}, [project, id, onOpenProject])
```
- Auto-adds project to tabs when page loads
- Ensures "Back to Project" creates/updates tab

#### SessionDetail Page
**File:** `dashboard/src/pages/SessionDetail.tsx`
```typescript
interface Props {
  onOpenSession: (id: string, name: string, projectId: string) => void
}

useEffect(() => {
  if (session && id) {
    onOpenSession(
      id, 
      session.summary_title || `Session ${id.slice(0, 8)}`, 
      session.project_id
    )
  }
}, [session, id, onOpenSession])
```
- Auto-adds session to tabs when page loads
- Passes projectId for smart replacement

#### MainDashboard Component
**File:** `dashboard/src/components/MainDashboard.tsx`
- Receives `onOpenProject` prop
- Makes project names clickable in "Most Active Projects"
- Calls `onOpenProject` + navigates on click

### 4. Layout Adjustments
**File:** `dashboard/src/components/Layout.tsx`

Added bottom padding to main content:
```typescript
<main style={{
  flex: 1,
  overflow: 'auto',
  minWidth: 0,
  marginLeft: 240,
  paddingBottom: 60,  // Space for tab bar
  transition: 'margin-left 0.3s ease',
}}>
```

---

## User Flow Examples

### Example 1: Opening Multiple Projects
1. User clicks "Project A" → Tab appears: `[Project A]`
2. User clicks "Project B" → Tabs: `[Project A] [Project B]`
3. User clicks "Project A" tab → Switches to Project A
4. User clicks × on Project B → Tabs: `[Project A]`

### Example 2: Project → Session → Back
1. User opens "Project A" → Tab: `[Project A]`
2. User clicks session in Project A → Tab transforms: `[Session Name]`
3. User clicks "Back to Project" → Tab transforms back: `[Project A]`
4. **No duplicate tabs created!**

### Example 3: Multiple Projects with Sessions
1. Open Project A → `[Project A]`
2. Open Session from A → `[Session A1]`
3. Open Project B → `[Session A1] [Project B]`
4. Open Session from B → `[Session A1] [Session B1]`
5. Click Session A1 tab → Returns to that exact session
6. Click "Back to Project" → `[Project A] [Session B1]`

---

## Troubleshooting Guide

### Issue: Tabs Not Appearing
**Symptoms:** Click project/session, no tab appears

**Debug Steps:**
1. Open browser console (F12)
2. Check for console.log messages from `addTab`
3. Verify `onOpenProject` or `onOpenSession` is being called
4. Check localStorage: `localStorage.getItem('openTabs')`

**Common Causes:**
- Props not passed down correctly
- useEffect dependencies missing
- Tab already exists (check console logs)

**Fix:**
- Verify prop chain: App → Page → Component
- Check useEffect dependency array includes all required values

### Issue: Duplicate Tabs Created
**Symptoms:** Multiple tabs for same project/session

**Debug Steps:**
1. Check console logs for "Replaced" vs "Adding new tab"
2. Verify projectId is being passed correctly for sessions
3. Check tab comparison logic in addTab

**Common Causes:**
- projectId not passed when opening session
- Tab type mismatch (project vs session)
- Comparison logic not finding existing tab

**Fix:**
- Ensure SessionDetail passes `session.project_id`
- Verify findIndex logic matches correctly
- Check tab.id and tab.type comparisons

### Issue: Tab Bar Under Sidebar
**Symptoms:** Tab bar appears behind sidebar

**Debug Steps:**
1. Inspect tab bar element in browser DevTools
2. Check `left` CSS property
3. Check z-index values

**Fix:**
```typescript
// In ProjectTabBar.tsx
left: 240,  // Must match sidebar width
zIndex: 100,
```

### Issue: Tabs Not Persisting After Refresh
**Symptoms:** Tabs disappear on page reload

**Debug Steps:**
1. Check localStorage: `localStorage.getItem('openTabs')`
2. Verify useEffect is saving to localStorage
3. Check for JSON parse errors in console

**Fix:**
```typescript
// In App.tsx
useEffect(() => {
  localStorage.setItem('openTabs', JSON.stringify(openTabs))
}, [openTabs])
```

### Issue: Wrong Tab Highlighted as Active
**Symptoms:** Active tab highlighting doesn't match current page

**Debug Steps:**
1. Check URL pattern matching in ProjectTabBar
2. Verify tab.id matches URL parameter
3. Check location.pathname value

**Fix:**
```typescript
// In ProjectTabBar.tsx
const activeTabId = location.pathname.match(/\/(project|session)\/([^/]+)/)?.[2]
const isActive = tab.id === activeTabId
```

### Issue: Closing Tab Doesn't Navigate
**Symptoms:** Close tab, but stays on same page

**Debug Steps:**
1. Check closeTab function logic
2. Verify navigate() is being called
3. Check if filtered tabs array is correct

**Fix:**
```typescript
// In App.tsx closeTab function
if (currentPath.includes(`/${id}`)) {
  if (filtered.length > 0) {
    const nextTab = filtered[filtered.length - 1]
    navigate(`/${nextTab.type}/${nextTab.id}`)
  } else {
    navigate('/')
  }
}
```

---

## Code Locations

### Core Files
- **Tab Bar Component:** `dashboard/src/components/ProjectTabBar.tsx`
- **State Management:** `dashboard/src/App.tsx`
- **Layout Padding:** `dashboard/src/components/Layout.tsx`

### Integration Files
- **Projects Page:** `dashboard/src/pages/Projects.tsx`
- **Project Detail:** `dashboard/src/pages/ProjectDetail.tsx`
- **Session Detail:** `dashboard/src/pages/SessionDetail.tsx`
- **Main Dashboard:** `dashboard/src/components/MainDashboard.tsx`

### Build Commands
```bash
# Rebuild dashboard
cd artifacts/claudectx-backup/dashboard
pnpm run build

# Restart service
cd ../../..
./kill.sh && sleep 2 && ./start.sh
```

---

## Testing Checklist

### Basic Functionality
- [ ] Open project → Tab appears
- [ ] Open session → Tab appears
- [ ] Click tab → Navigates to that project/session
- [ ] Close tab → Tab removed, navigates away if active
- [ ] Refresh page → Tabs persist

### Smart Replacement
- [ ] Open project → Open session → Tab transforms (no duplicate)
- [ ] Open session → Back to project → Tab transforms back
- [ ] Open Project A → Session A → Project B → Session B → All work correctly

### Edge Cases
- [ ] Close last tab → Navigates to home
- [ ] Close active tab → Switches to another tab
- [ ] Open same project twice → Only one tab
- [ ] Open same session twice → Only one tab
- [ ] Many tabs (10+) → Horizontal scroll works

### Visual
- [ ] Active tab highlighted correctly
- [ ] Tab bar doesn't overlap sidebar
- [ ] Tab bar doesn't cover content (60px padding)
- [ ] Close button hover effect works
- [ ] Tab hover effect works
- [ ] Long names truncate with ellipsis

---

## Performance Considerations

### localStorage Usage
- Tabs saved on every change
- JSON stringify/parse on mount
- **Impact:** Minimal (small data size)
- **Limit:** Browser localStorage limit (~5-10MB)

### Re-renders
- State updates trigger re-render of App and ProjectTabBar
- useEffect in pages may trigger multiple times
- **Optimization:** Memoization not needed (small component tree)

### Memory
- Each tab stores: id, name, type, projectId (optional)
- **Typical size:** ~100 bytes per tab
- **Max recommended:** 20-30 tabs

---

## Future Enhancements

### Potential Features
1. **Tab Reordering** - Drag and drop to reorder tabs
2. **Tab Groups** - Group related sessions under project
3. **Tab Context Menu** - Right-click for options (close others, close all)
4. **Tab Pinning** - Pin important tabs to prevent accidental close
5. **Tab Search** - Search/filter tabs when many are open
6. **Keyboard Shortcuts** - Ctrl+Tab to switch, Ctrl+W to close
7. **Tab Previews** - Hover to see preview of project/session
8. **Recently Closed** - Reopen recently closed tabs

### Known Limitations
1. No tab reordering (fixed order: oldest to newest)
2. No visual indicator for unsaved changes
3. No tab grouping or organization
4. No keyboard navigation between tabs
5. No tab overflow menu (relies on scroll)

---

## Debug Console Logs

When debugging, check browser console for these logs:

```
addTab called: {id, name, type, projectId, currentTabs}
Tab already exists, skipping
Looking for project tab: [projectId] found at index: [index]
Replaced project tab with session tab
Looking for session tab from project: [projectId] found at index: [index]
Replaced session tab with project tab
Adding new tab
```

These logs help trace the tab replacement logic and identify issues.

---

## Summary

The bottom tab bar system provides a seamless multi-project/session experience similar to modern browsers. The key innovation is **bidirectional smart replacement** which prevents tab proliferation while maintaining intuitive navigation.

**Key Success Factors:**
1. Single source of truth (App.tsx state)
2. Smart replacement logic (prevents duplicates)
3. Persistent storage (localStorage)
4. Clean integration (props passed down)
5. Visual feedback (active highlighting)

**Maintenance Notes:**
- Keep console.log statements for debugging
- Test bidirectional replacement when modifying logic
- Verify localStorage compatibility across browsers
- Monitor performance with many tabs (20+)

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-07  
**Author:** Claude (Opus 4.6)  
**Status:** Production Ready ✅
