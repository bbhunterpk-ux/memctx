# 🔌 API Reference

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [🏗️ Architecture](architecture.md) • [🤝 Contributing](contributing.md)

</div>

---

## 📋 Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Sessions API](#sessions-api)
- [Projects API](#projects-api)
- [Summarization API](#summarization-api)
- [Configuration API](#configuration-api)
- [WebSocket API](#websocket-api)

---

## Base URL

```
http://localhost:9999/api
```

Default port: `9999` (configurable via `MEMCTX_PORT`)

---

## Authentication

Currently no authentication required (local-only API).

Future versions will support API key authentication:

```http
Authorization: Bearer <api-key>
```

---

## Sessions API

### List Sessions

```http
GET /api/sessions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `project` | string | Filter by project ID |
| `tags` | string | Comma-separated tags |
| `from` | string | Start date (ISO 8601) |
| `to` | string | End date (ISO 8601) |
| `limit` | number | Results per page (default: 20) |
| `offset` | number | Pagination offset |
| `sort` | string | Sort field (`startTime`, `duration`) |
| `order` | string | Sort order (`asc`, `desc`) |

**Response:**

```typescript
{
  success: true,
  data: [
    {
      id: "abc123",
      projectId: "proj_xyz",
      startTime: 1712491505984,
      endTime: 1712495105984,
      duration: 3600,
      branch: "main",
      summary: {
        title: "Fixed authentication bug",
        completed: ["Fixed login redirect", "Added error handling"],
        nextSteps: ["Add tests", "Deploy to staging"],
        blockers: [],
        decisions: ["Use JWT instead of sessions"]
      },
      tags: ["bugfix", "auth"],
      notes: "Critical security fix",
      metadata: {
        filesChanged: 5,
        linesAdded: 120,
        linesRemoved: 45
      },
      createdAt: 1712491505984,
      updatedAt: 1712495105984
    }
  ],
  meta: {
    total: 150,
    page: 1,
    limit: 20
  }
}
```

### Get Session

```http
GET /api/sessions/:id
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "abc123",
    projectId: "proj_xyz",
    // ... full session object
  }
}
```

### Create Session

```http
POST /api/sessions
```

**Request Body:**

```typescript
{
  projectId: "proj_xyz",
  startTime: 1712491505984,
  branch: "feature/new-auth",
  tags: ["feature", "auth"],
  notes: "Implementing new authentication system"
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "abc123",
    // ... created session
  }
}
```

### Update Session

```http
PUT /api/sessions/:id
```

**Request Body:**

```typescript
{
  endTime: 1712495105984,
  tags: ["feature", "auth", "completed"],
  notes: "Authentication system complete"
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "abc123",
    // ... updated session
  }
}
```

### Delete Session

```http
DELETE /api/sessions/:id
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "abc123",
    deleted: true
  }
}
```

### End Session

```http
POST /api/sessions/:id/end
```

**Request Body:**

```typescript
{
  summarize?: boolean  // Trigger immediate summarization
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "abc123",
    endTime: 1712495105984,
    duration: 3600,
    summarizationQueued: true
  }
}
```

---

## Projects API

### List Projects

```http
GET /api/projects
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tags` | string | Filter by tags |
| `limit` | number | Results per page |
| `offset` | number | Pagination offset |

**Response:**

```typescript
{
  success: true,
  data: [
    {
      id: "proj_xyz",
      name: "My App",
      path: "/home/user/projects/my-app",
      description: "Production web application",
      tags: ["frontend", "react"],
      config: {
        excludePaths: ["node_modules", "dist"],
        summarization: {
          enabled: true,
          minDuration: 300
        }
      },
      sessionCount: 45,
      lastActivity: 1712495105984,
      createdAt: 1712400000000,
      updatedAt: 1712495105984
    }
  ],
  meta: {
    total: 10
  }
}
```

### Get Project

```http
GET /api/projects/:id
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "proj_xyz",
    // ... full project object
    sessions: [
      // ... recent sessions
    ]
  }
}
```

### Create Project

```http
POST /api/projects
```

**Request Body:**

```typescript
{
  name: "My App",
  path: "/home/user/projects/my-app",
  description: "Production web application",
  tags: ["frontend", "react"],
  config: {
    excludePaths: ["node_modules", "dist"],
    summarization: {
      enabled: true,
      minDuration: 300
    }
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "proj_xyz",
    // ... created project
  }
}
```

### Update Project

```http
PUT /api/projects/:id
```

**Request Body:**

```typescript
{
  description: "Updated description",
  tags: ["frontend", "react", "typescript"]
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    id: "proj_xyz",
    // ... updated project
  }
}
```

### Delete Project

```http
DELETE /api/projects/:id
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `keepSessions` | boolean | Keep session data (default: false) |

**Response:**

```typescript
{
  success: true,
  data: {
    id: "proj_xyz",
    deleted: true,
    sessionsDeleted: 45
  }
}
```

---

## Summarization API

### Summarize Session

```http
POST /api/summarize/:sessionId
```

**Request Body:**

```typescript
{
  model?: "claude-opus-4" | "claude-haiku-4",  // Optional model override
  force?: boolean  // Force re-summarization
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    jobId: "job_abc123",
    status: "queued",
    estimatedTime: 30  // seconds
  }
}
```

### Get Summarization Status

```http
GET /api/summarize/status/:jobId
```

**Response:**

```typescript
{
  success: true,
  data: {
    jobId: "job_abc123",
    status: "completed" | "queued" | "processing" | "failed",
    progress: 100,
    result?: {
      title: "Fixed authentication bug",
      completed: ["Fixed login redirect", "Added error handling"],
      nextSteps: ["Add tests", "Deploy to staging"],
      blockers: [],
      decisions: ["Use JWT instead of sessions"]
    },
    error?: string,
    startedAt: 1712495105984,
    completedAt: 1712495135984
  }
}
```

### Batch Summarize

```http
POST /api/summarize/batch
```

**Request Body:**

```typescript
{
  sessionIds: ["abc123", "def456", "ghi789"],
  model?: "claude-opus-4" | "claude-haiku-4"
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    jobIds: ["job_1", "job_2", "job_3"],
    queued: 3
  }
}
```

---

## Configuration API

### Get Configuration

```http
GET /api/config
```

**Response:**

```typescript
{
  success: true,
  data: {
    model: "claude-opus-4",
    port: 9999,
    autoStart: true,
    theme: "dark",
    summarization: {
      enabled: true,
      minDuration: 300,
      maxConcurrent: 3
    },
    performance: {
      cacheSize: 100,
      requestTimeout: 30000
    },
    logging: {
      level: "info",
      file: "~/.memctx/memctx.log"
    }
  }
}
```

### Update Configuration

```http
PUT /api/config
```

**Request Body:**

```typescript
{
  theme: "light",
  summarization: {
    minDuration: 600
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    // ... updated config
  }
}
```

### Reset Configuration

```http
POST /api/config/reset
```

**Response:**

```typescript
{
  success: true,
  data: {
    // ... default config
  }
}
```

---

## WebSocket API

### Connect

```javascript
const ws = new WebSocket('ws://localhost:9999/ws')
```

### Events

#### Session Started

```typescript
{
  type: "session.started",
  data: {
    id: "abc123",
    projectId: "proj_xyz",
    startTime: 1712491505984
  }
}
```

#### Session Ended

```typescript
{
  type: "session.ended",
  data: {
    id: "abc123",
    endTime: 1712495105984,
    duration: 3600
  }
}
```

#### Summarization Complete

```typescript
{
  type: "summarization.complete",
  data: {
    sessionId: "abc123",
    summary: {
      title: "Fixed authentication bug",
      // ... summary data
    }
  }
}
```

#### Worker Status

```typescript
{
  type: "worker.status",
  data: {
    status: "running" | "stopped" | "error",
    uptime: 3600,
    activeJobs: 2
  }
}
```

### Subscribe to Events

```javascript
ws.send(JSON.stringify({
  type: "subscribe",
  events: ["session.started", "session.ended", "summarization.complete"]
}))
```

---

## Error Responses

### Standard Error Format

```typescript
{
  success: false,
  error: "Error message",
  code: "ERROR_CODE",
  details?: any
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Invalid request body or parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `API_ERROR` | 502 | Claude API error |
| `TIMEOUT` | 504 | Request timeout |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `GET /api/sessions` | 100/min |
| `POST /api/summarize` | 10/min |
| `POST /api/summarize/batch` | 5/min |
| All other endpoints | 60/min |

---

## Examples

### JavaScript/TypeScript

```typescript
// Fetch sessions
const response = await fetch('http://localhost:9999/api/sessions?project=proj_xyz')
const { data } = await response.json()

// Create session
const session = await fetch('http://localhost:9999/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'proj_xyz',
    startTime: Date.now(),
    tags: ['feature']
  })
})

// Summarize session
const job = await fetch('http://localhost:9999/api/summarize/abc123', {
  method: 'POST'
})
```

### Python

```python
import requests

# Fetch sessions
response = requests.get('http://localhost:9999/api/sessions', params={
    'project': 'proj_xyz',
    'limit': 10
})
sessions = response.json()['data']

# Create session
session = requests.post('http://localhost:9999/api/sessions', json={
    'projectId': 'proj_xyz',
    'startTime': int(time.time() * 1000),
    'tags': ['feature']
})

# Summarize session
job = requests.post('http://localhost:9999/api/summarize/abc123')
```

### cURL

```bash
# Fetch sessions
curl http://localhost:9999/api/sessions?project=proj_xyz

# Create session
curl -X POST http://localhost:9999/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj_xyz","startTime":1712491505984,"tags":["feature"]}'

# Summarize session
curl -X POST http://localhost:9999/api/summarize/abc123
```

---

## Next Steps

- [🏗️ Architecture](architecture.md) - Understand the system
- [🤝 Contributing](contributing.md) - Contribute to MemCTX
- [🔧 Development Setup](development.md) - Set up dev environment

---

<div align="center">

**Questions?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
