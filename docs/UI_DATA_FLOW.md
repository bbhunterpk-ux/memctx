# UI Data Flow - Dashboard Implementation

## Overview

The ClaudeContext dashboard is a React + TypeScript web application that provides real-time visualization of sessions, memory, and project activity. This document explains how data flows from the backend API to the UI components.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (React App)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Projects  │  │   Memory   │  │  Sessions  │            │
│  │    Page    │  │    Page    │  │    Page    │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
│        │                │                │                   │
│        └────────────────┼────────────────┘                   │
│                         │                                    │
│                  ┌──────▼──────┐                             │
│                  │ API Client  │                             │
│                  │ (fetch)     │                             │
│                  └──────┬──────┘                             │
│                         │                                    │
│                  ┌──────▼──────┐                             │
│                  │  WebSocket  │                             │
│                  │  (ws://)    │                             │
│                  └──────┬──────┘                             │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          │ HTTP/WS
                          │
┌─────────────────────────▼──────────────────────────────────┐
│              ClaudeContext Worker (Express)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                         │  │
│  │  • GET  /api/projects                                │  │
│  │  • GET  /api/sessions?project_id=X                   │  │
│  │  • GET  /api/memory?project_id=X                     │  │
│  │  • GET  /api/context?cwd=/path                       │  │
│  │  • GET  /api/health                                  │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │              Database Queries                        │  │
│  │  (Drizzle ORM + SQLite)                              │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │         SQLite Database (~/.claudectx/db.sqlite)     │  │
│  │  • sessions                                          │  │
│  │  • projects                                          │  │
│  │  • preferences                                       │  │
│  │  • knowledge_items                                   │  │
│  │  • learned_patterns                                  │  │
│  │  • tasks                                             │  │
│  │  • contacts                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. API Client

### 2.1 Client Implementation

**File:** `dashboard/src/api/client.ts`

```typescript
const API_BASE = 'http://localhost:8000'

export const api = {
  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/api/projects`)
    return res.json()
  },

  // Sessions
  async getSessions(projectId: string) {
    const res = await fetch(`${API_BASE}/api/sessions?project_id=${projectId}`)
    return res.json()
  },

  // Memory
  async getMemory(projectId: string) {
    const res = await fetch(`${API_BASE}/api/memory?project_id=${projectId}`)
    return res.json()
  },

  // Context
  async getContext(cwd: string) {
    const res = await fetch(`${API_BASE}/api/context?cwd=${encodeURIComponent(cwd)}`)
    return res.json()
  },

  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`)
    return res.json()
  }
}
```

---

### 2.2 Error Handling

```typescript
async function fetchWithErrorHandling<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url)
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    
    return await res.json()
  } catch (err) {
    console.error('API Error:', err)
    throw err
  }
}
```

---

## 3. Data Types

### 3.1 TypeScript Interfaces

**File:** `dashboard/src/types.ts`

```typescript
export interface Project {
  id: string
  name: string
  path: string
  created_at: number
  last_session_at: number | null
}

export interface Session {
  id: string
  project_id: string
  started_at: number
  ended_at: number | null
  status: 'active' | 'completed' | 'compacted'
  summary_title: string | null
  summary_status: 'completed' | 'in_progress' | 'blocked' | null
  summary_what_we_did: string[] | null
  summary_next_steps: string[] | null
  summary_gotchas: string[] | null
  total_turns: number
  total_tool_calls: number
}

export interface Preference {
  id: number
  project_id: string
  category: string
  key: string
  value: string
  confidence: number
  created_at: number
  updated_at: number
}

export interface KnowledgeItem {
  id: string
  project_id: string
  category: string
  topic: string
  content: string
  confidence: number
  access_count: number
  created_at: number
  updated_at: number
}

export interface LearnedPattern {
  id: string
  project_id: string
  pattern_type: string
  title: string
  description: string
  example: string | null
  success_count: number
  failure_count: number
  last_used_at: number | null
  created_at: number
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: number
  updated_at: number
  completed_at: number | null
}

export interface Contact {
  id: string
  project_id: string
  name: string
  type: 'person' | 'team' | 'organization'
  role: string | null
  email: string | null
  created_at: number
}

export interface MemoryData {
  project_id: string
  stats: {
    preferences: number
    knowledge: number
    patterns: number
    tasks: number
    contacts: number
  }
  preferences: Preference[]
  knowledge: KnowledgeItem[]
  patterns: LearnedPattern[]
  tasks: Task[]
  contacts: Contact[]
}
```

---

## 4. React Components

### 4.1 Projects Page

**File:** `dashboard/src/pages/Projects.tsx`

**Data Flow:**

1. **Component Mount:**
   ```typescript
   useEffect(() => {
     loadProjects()
   }, [])
   ```

2. **Fetch Projects:**
   ```typescript
   async function loadProjects() {
     setLoading(true)
     try {
       const data = await api.getProjects()
       setProjects(data.projects)
     } catch (err) {
       setError(err.message)
     } finally {
       setLoading(false)
     }
   }
   ```

3. **Render:**
   ```tsx
   {projects.map(project => (
     <ProjectCard
       key={project.id}
       project={project}
       onClick={() => navigate(`/project/${project.id}`)}
     />
   ))}
   ```

**API Response:**

```json
{
  "projects": [
    {
      "id": "abc123",
      "name": "Claude-Context",
      "path": "/home/max/All_Projects_Files/April 2026 Projects/Claude-Context",
      "created_at": 1775098433,
      "last_session_at": 1775175855
    }
  ]
}
```

---

### 4.2 Memory Page

**File:** `dashboard/src/pages/Memory.tsx`

**Data Flow:**

1. **Component Mount:**
   ```typescript
   useEffect(() => {
     if (projectId) {
       loadMemory()
     }
   }, [projectId])
   ```

2. **Fetch Memory:**
   ```typescript
   async function loadMemory() {
     setLoading(true)
     try {
       const data = await api.getMemory(projectId)
       setMemory(data)
     } catch (err) {
       setError(err.message)
     } finally {
       setLoading(false)
     }
   }
   ```

3. **Render Sections:**
   ```tsx
   <div className="memory-page">
     <StatsOverview stats={memory.stats} />
     <PreferencesList preferences={memory.preferences} />
     <KnowledgeGrid knowledge={memory.knowledge} />
     <PatternsTimeline patterns={memory.patterns} />
     <TasksKanban tasks={memory.tasks} />
     <ContactsNetwork contacts={memory.contacts} />
   </div>
   ```

**API Response:**

```json
{
  "project_id": "abc123",
  "stats": {
    "preferences": 5,
    "knowledge": 7,
    "patterns": 5,
    "tasks": 2,
    "contacts": 1
  },
  "preferences": [
    {
      "id": 1,
      "category": "coding",
      "key": "style",
      "value": "TypeScript with strict mode",
      "confidence": 0.9
    }
  ],
  "knowledge": [
    {
      "id": "k1",
      "category": "technology",
      "topic": "9router",
      "content": "Returns OpenAI format",
      "confidence": 0.8,
      "access_count": 3
    }
  ],
  "patterns": [
    {
      "id": "p1",
      "pattern_type": "debugging",
      "title": "Check logs first",
      "description": "Always check logs before diving into code",
      "success_count": 3,
      "failure_count": 0
    }
  ],
  "tasks": [
    {
      "id": "t1",
      "title": "Test memory system",
      "status": "pending",
      "priority": "high"
    }
  ],
  "contacts": [
    {
      "id": "c1",
      "name": "Max",
      "type": "person",
      "role": "Developer"
    }
  ]
}
```

---

### 4.3 Sessions Page

**File:** `dashboard/src/pages/Sessions.tsx`

**Data Flow:**

1. **Fetch Sessions:**
   ```typescript
   async function loadSessions() {
     const data = await api.getSessions(projectId)
     setSessions(data.sessions)
   }
   ```

2. **Render Timeline:**
   ```tsx
   <Timeline>
     {sessions.map(session => (
       <SessionCard
         key={session.id}
         session={session}
         onClick={() => setSelectedSession(session)}
       />
     ))}
   </Timeline>
   ```

3. **Session Detail Modal:**
   ```tsx
   {selectedSession && (
     <Modal onClose={() => setSelectedSession(null)}>
       <SessionDetail session={selectedSession} />
     </Modal>
   )}
   ```

**API Response:**

```json
{
  "sessions": [
    {
      "id": "cdf670bf-4648-4ac0-af05-66c0c6133b37",
      "project_id": "abc123",
      "started_at": 1775175855,
      "ended_at": 1775180000,
      "status": "completed",
      "summary_title": "Fixed ClaudeContext Session Summarization",
      "summary_status": "completed",
      "summary_what_we_did": [
        "Restarted worker with correct API endpoint",
        "Generated summaries for all completed sessions"
      ],
      "summary_next_steps": [
        "Monitor current session completion"
      ],
      "summary_gotchas": [
        "Worker must use port 8000 for hooks to reach it"
      ],
      "total_turns": 45,
      "total_tool_calls": 120
    }
  ]
}
```

---

## 5. Real-Time Updates (WebSocket)

### 5.1 WebSocket Connection

**File:** `dashboard/src/hooks/useWebSocket.ts`

```typescript
export function useWebSocket(url: string) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = new WebSocket(url)
    
    socket.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
    }
    
    socket.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    }
    
    socket.onerror = (err) => {
      console.error('WebSocket error:', err)
    }
    
    setWs(socket)
    
    return () => {
      socket.close()
    }
  }, [url])
  
  return { ws, connected }
}
```

---

### 5.2 Event Handling

**File:** `dashboard/src/App.tsx`

```typescript
function App() {
  const { ws, connected } = useWebSocket('ws://localhost:8000')
  
  useEffect(() => {
    if (!ws) return
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'session_start':
          handleSessionStart(data)
          break
        
        case 'session_end':
          handleSessionEnd(data)
          break
        
        case 'tool_use':
          handleToolUse(data)
          break
        
        case 'memory_updated':
          handleMemoryUpdate(data)
          break
      }
    }
  }, [ws])
  
  return (
    <div className="app">
      <StatusBar connected={connected} />
      <Router>
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/memory" element={<Memory />} />
        </Routes>
      </Router>
    </div>
  )
}
```

---

### 5.3 WebSocket Events

**Worker broadcasts these events:**

```typescript
// Session started
broadcast({
  type: 'session_start',
  session_id: 'abc123',
  project: { id: 'proj1', name: 'My Project' }
})

// Session ended
broadcast({
  type: 'session_end',
  session_id: 'abc123'
})

// Tool used
broadcast({
  type: 'tool_use',
  session_id: 'abc123',
  tool_name: 'Edit',
  file_path: '/path/to/file.ts'
})

// Memory updated
broadcast({
  type: 'memory_updated',
  project_id: 'proj1',
  memory_type: 'knowledge',
  item: { topic: '9router', content: '...' }
})
```

---

## 6. State Management

### 6.1 React Context

**File:** `dashboard/src/context/AppContext.tsx`

```typescript
interface AppState {
  projects: Project[]
  currentProject: Project | null
  sessions: Session[]
  memory: MemoryData | null
  loading: boolean
  error: string | null
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    projects: [],
    currentProject: null,
    sessions: [],
    memory: null,
    loading: false,
    error: null
  })
  
  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
```

---

### 6.2 Custom Hooks

**File:** `dashboard/src/hooks/useMemory.ts`

```typescript
export function useMemory(projectId: string) {
  const [memory, setMemory] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadMemory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMemory(projectId)
      setMemory(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])
  
  useEffect(() => {
    loadMemory()
  }, [loadMemory])
  
  return { memory, loading, error, reload: loadMemory }
}
```

**Usage:**

```typescript
function MemoryPage() {
  const { projectId } = useParams()
  const { memory, loading, error, reload } = useMemory(projectId)
  
  if (loading) return <Spinner />
  if (error) return <Error message={error} />
  if (!memory) return <Empty />
  
  return <MemoryView memory={memory} onRefresh={reload} />
}
```

---

## 7. UI Components

### 7.1 Preferences List

**File:** `dashboard/src/components/PreferencesList.tsx`

```typescript
interface Props {
  preferences: Preference[]
}

export function PreferencesList({ preferences }: Props) {
  const grouped = groupBy(preferences, 'category')
  
  return (
    <div className="preferences-list">
      {Object.entries(grouped).map(([category, prefs]) => (
        <div key={category} className="preference-group">
          <h3>{category}</h3>
          {prefs.map(pref => (
            <PreferenceCard key={pref.id} preference={pref} />
          ))}
        </div>
      ))}
    </div>
  )
}

function PreferenceCard({ preference }: { preference: Preference }) {
  return (
    <div className="preference-card">
      <div className="preference-key">{preference.key}</div>
      <div className="preference-value">{preference.value}</div>
      <ConfidenceBar value={preference.confidence} />
    </div>
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const percentage = Math.round(value * 100)
  const color = value > 0.8 ? 'green' : value > 0.5 ? 'yellow' : 'red'
  
  return (
    <div className="confidence-bar">
      <div 
        className={`confidence-fill ${color}`}
        style={{ width: `${percentage}%` }}
      />
      <span>{percentage}%</span>
    </div>
  )
}
```

---

### 7.2 Knowledge Grid

**File:** `dashboard/src/components/KnowledgeGrid.tsx`

```typescript
interface Props {
  knowledge: KnowledgeItem[]
}

export function KnowledgeGrid({ knowledge }: Props) {
  const [filter, setFilter] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  
  const filtered = knowledge.filter(item => {
    if (category && item.category !== category) return false
    if (filter && !item.topic.toLowerCase().includes(filter.toLowerCase())) {
      return false
    }
    return true
  })
  
  const categories = [...new Set(knowledge.map(k => k.category))]
  
  return (
    <div className="knowledge-grid">
      <div className="knowledge-filters">
        <input
          type="text"
          placeholder="Search knowledge..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select value={category || ''} onChange={e => setCategory(e.target.value || null)}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="knowledge-items">
        {filtered.map(item => (
          <KnowledgeCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function KnowledgeCard({ item }: { item: KnowledgeItem }) {
  return (
    <div className="knowledge-card">
      <div className="knowledge-category">{item.category}</div>
      <h4 className="knowledge-topic">{item.topic}</h4>
      <p className="knowledge-content">{item.content}</p>
      <div className="knowledge-meta">
        <ConfidenceBar value={item.confidence} />
        <span className="access-count">Accessed {item.access_count} times</span>
      </div>
    </div>
  )
}
```

---

### 7.3 Tasks Kanban

**File:** `dashboard/src/components/TasksKanban.tsx`

```typescript
interface Props {
  tasks: Task[]
}

export function TasksKanban({ tasks }: Props) {
  const columns = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  }
  
  return (
    <div className="tasks-kanban">
      <Column title="Pending" tasks={columns.pending} />
      <Column title="In Progress" tasks={columns.in_progress} />
      <Column title="Completed" tasks={columns.completed} />
    </div>
  )
}

function Column({ title, tasks }: { title: string; tasks: Task[] }) {
  return (
    <div className="kanban-column">
      <h3>{title} ({tasks.length})</h3>
      <div className="kanban-tasks">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: Task }) {
  const priorityColor = {
    urgent: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'gray'
  }[task.priority]
  
  return (
    <div className="task-card">
      <div className="task-header">
        <span className={`priority-badge ${priorityColor}`}>
          {task.priority}
        </span>
      </div>
      <h4 className="task-title">{task.title}</h4>
      {task.description && (
        <p className="task-description">{task.description}</p>
      )}
      <div className="task-footer">
        <span className="task-date">
          {formatDate(task.created_at)}
        </span>
      </div>
    </div>
  )
}
```

---

## 8. Data Formatting

### 8.1 Date Formatting

```typescript
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
```

---

### 8.2 JSON Parsing

```typescript
export function parseJsonField<T>(field: string | null): T[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

// Usage
const whatWeDid = parseJsonField<string>(session.summary_what_we_did)
```

---

## 9. Performance Optimization

### 9.1 Memoization

```typescript
const MemoizedKnowledgeGrid = React.memo(KnowledgeGrid, (prev, next) => {
  return prev.knowledge === next.knowledge
})
```

---

### 9.2 Virtual Scrolling

For large lists (100+ items):

```typescript
import { FixedSizeList } from 'react-window'

function LargeKnowledgeList({ knowledge }: { knowledge: KnowledgeItem[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={knowledge.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <KnowledgeCard item={knowledge[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

---

## 10. Error Handling

### 10.1 Error Boundary

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

---

## 11. Complete Data Flow Example

### Scenario: User views memory for a project

1. **User clicks project card**
   ```typescript
   <ProjectCard onClick={() => navigate(`/memory?project=${project.id}`)} />
   ```

2. **Memory page loads**
   ```typescript
   function MemoryPage() {
     const { projectId } = useSearchParams()
     const { memory, loading } = useMemory(projectId)
     // ...
   }
   ```

3. **useMemory hook fetches data**
   ```typescript
   const data = await fetch(`http://localhost:8000/api/memory?project_id=${projectId}`)
   const memory = await data.json()
   ```

4. **Worker queries database**
   ```typescript
   const preferences = db.select().from(preferences).where(eq(preferences.project_id, projectId))
   const knowledge = db.select().from(knowledgeItems).where(eq(knowledgeItems.project_id, projectId))
   // ... etc
   ```

5. **Worker returns JSON**
   ```json
   {
     "project_id": "abc123",
     "stats": { "preferences": 5, "knowledge": 7, ... },
     "preferences": [...],
     "knowledge": [...],
     ...
   }
   ```

6. **React updates state**
   ```typescript
   setMemory(data)
   ```

7. **Components re-render**
   ```tsx
   <PreferencesList preferences={memory.preferences} />
   <KnowledgeGrid knowledge={memory.knowledge} />
   <PatternsTimeline patterns={memory.patterns} />
   ```

8. **User sees updated UI**

---

## 12. Troubleshooting

### Issue: CORS errors

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/api/memory' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix:**
Worker already has CORS enabled:
```typescript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  next()
})
```

---

### Issue: WebSocket not connecting

**Symptoms:**
```
WebSocket connection to 'ws://localhost:8000' failed
```

**Diagnosis:**
```bash
curl http://localhost:8000/api/health
```

**Fix:**
Ensure worker is running on port 8000

---

### Issue: Data not updating in real-time

**Symptoms:**
- UI shows stale data
- WebSocket connected but no updates

**Fix:**
Check WebSocket event handlers are registered:
```typescript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('WebSocket event:', data)
  // Handle event
}
```

---

## 13. Next Steps

- Read SESSION_AND_SUMMARY_FLOW.md for backend details
- Read MEMORY_SYSTEM.md for memory extraction details
- Check API.md for complete API reference
