# 🔌 Plugin System

<div align="center">

[🏠 Home](../../README.md) • [📚 Documentation](../README.md) • [🏗️ Architecture](architecture.md) • [🔌 API Reference](api-reference.md)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [Creating Plugins](#creating-plugins)
- [Plugin API](#plugin-api)
- [Publishing Plugins](#publishing-plugins)
- [Example Plugins](#example-plugins)

---

## Overview

MemCTX supports a plugin system that allows you to extend functionality with custom:

- **Summarization strategies** - Custom AI prompts and models
- **Context injectors** - Custom context injection formats
- **Export formats** - Custom export formats (PDF, HTML, etc.)
- **Integrations** - Connect to external services (Slack, Notion, etc.)
- **UI components** - Custom dashboard widgets

---

## Plugin Architecture

### Plugin Structure

```
my-memctx-plugin/
├── package.json
├── src/
│   ├── index.ts              # Plugin entry point
│   ├── summarizer.ts         # Custom summarizer (optional)
│   ├── injector.ts           # Custom injector (optional)
│   ├── exporter.ts           # Custom exporter (optional)
│   └── widget.tsx            # Dashboard widget (optional)
├── README.md
└── LICENSE
```

### Plugin Manifest

**package.json:**

```json
{
  "name": "memctx-plugin-custom",
  "version": "1.0.0",
  "description": "Custom MemCTX plugin",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["memctx", "memctx-plugin"],
  "memctx": {
    "type": "plugin",
    "provides": ["summarizer", "exporter"],
    "requires": "^1.0.0"
  },
  "peerDependencies": {
    "memctx": "^1.0.0"
  }
}
```

---

## Creating Plugins

### 1. Initialize Plugin

```bash
# Create plugin directory
mkdir memctx-plugin-custom
cd memctx-plugin-custom

# Initialize package
pnpm init

# Install dependencies
pnpm add -D memctx typescript @types/node

# Create TypeScript config
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
EOF
```

### 2. Create Plugin Entry Point

**src/index.ts:**

```typescript
import { Plugin, PluginContext } from 'memctx'

export default class CustomPlugin implements Plugin {
  name = 'custom-plugin'
  version = '1.0.0'

  async initialize(context: PluginContext): Promise<void> {
    console.log('Custom plugin initialized')
    
    // Register components
    if (this.summarizer) {
      context.registerSummarizer(this.summarizer)
    }
    if (this.exporter) {
      context.registerExporter(this.exporter)
    }
  }

  async destroy(): Promise<void> {
    console.log('Custom plugin destroyed')
  }
}
```

### 3. Implement Components

**Custom Summarizer:**

```typescript
// src/summarizer.ts
import { Summarizer, Session, Summary } from 'memctx'

export class CustomSummarizer implements Summarizer {
  name = 'custom'
  
  async summarize(session: Session): Promise<Summary> {
    // Custom summarization logic
    const prompt = this.buildPrompt(session)
    const response = await this.callAI(prompt)
    return this.parseResponse(response)
  }

  private buildPrompt(session: Session): string {
    return `
      Analyze this coding session:
      Duration: ${session.duration}s
      Files changed: ${session.metadata.filesChanged}
      
      Provide:
      1. Main accomplishments
      2. Technical decisions
      3. Next steps
    `
  }

  private async callAI(prompt: string): Promise<string> {
    // Call your preferred AI service
    return 'AI response'
  }

  private parseResponse(response: string): Summary {
    // Parse AI response into Summary format
    return {
      title: 'Session summary',
      completed: [],
      nextSteps: [],
      blockers: [],
      decisions: []
    }
  }
}
```

**Custom Exporter:**

```typescript
// src/exporter.ts
import { Exporter, Session } from 'memctx'

export class CustomExporter implements Exporter {
  name = 'custom'
  extension = '.custom'
  
  async export(sessions: Session[]): Promise<Buffer> {
    // Custom export logic
    const data = this.formatSessions(sessions)
    return Buffer.from(data)
  }

  private formatSessions(sessions: Session[]): string {
    // Format sessions in custom format
    return sessions.map(s => `
      Session: ${s.id}
      Project: ${s.projectId}
      Duration: ${s.duration}s
      Summary: ${s.summary?.title}
    `).join('\n---\n')
  }
}
```

**Dashboard Widget:**

```typescript
// src/widget.tsx
import React from 'react'
import { Widget, WidgetProps } from 'memctx'

export const CustomWidget: Widget = ({ sessions }: WidgetProps) => {
  const stats = calculateStats(sessions)
  
  return (
    <div className="custom-widget">
      <h3>Custom Statistics</h3>
      <div className="stats">
        <div>Total Sessions: {stats.total}</div>
        <div>Avg Duration: {stats.avgDuration}s</div>
        <div>Most Active Project: {stats.topProject}</div>
      </div>
    </div>
  )
}

function calculateStats(sessions: Session[]) {
  // Calculate custom statistics
  return {
    total: sessions.length,
    avgDuration: sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length,
    topProject: 'my-app'
  }
}
```

### 4. Build Plugin

```bash
# Build TypeScript
pnpm run build

# Verify output
ls -la dist/
```

---

## Plugin API

### Plugin Interface

```typescript
interface Plugin {
  name: string
  version: string
  initialize(context: PluginContext): Promise<void>
  destroy(): Promise<void>
}
```

### Plugin Context

```typescript
interface PluginContext {
  // Register components
  registerSummarizer(summarizer: Summarizer): void
  registerInjector(injector: Injector): void
  registerExporter(exporter: Exporter): void
  registerWidget(widget: Widget): void
  
  // Access services
  getDatabase(): Database
  getConfig(): Config
  getLogger(): Logger
  
  // Emit events
  emit(event: string, data: any): void
  on(event: string, handler: (data: any) => void): void
}
```

### Summarizer Interface

```typescript
interface Summarizer {
  name: string
  summarize(session: Session): Promise<Summary>
}

interface Summary {
  title: string
  completed: string[]
  nextSteps: string[]
  blockers: string[]
  decisions: string[]
}
```

### Exporter Interface

```typescript
interface Exporter {
  name: string
  extension: string
  export(sessions: Session[]): Promise<Buffer>
}
```

### Widget Interface

```typescript
interface Widget extends React.FC<WidgetProps> {
  name: string
  title: string
  size?: 'small' | 'medium' | 'large'
}

interface WidgetProps {
  sessions: Session[]
  projects: Project[]
  config: Config
}
```

---

## Publishing Plugins

### 1. Prepare for Publishing

```bash
# Update package.json
{
  "name": "memctx-plugin-custom",
  "version": "1.0.0",
  "description": "Custom MemCTX plugin",
  "keywords": ["memctx", "memctx-plugin"],
  "repository": "github:username/memctx-plugin-custom",
  "license": "MIT"
}

# Create README
cat > README.md << EOF
# memctx-plugin-custom

Custom MemCTX plugin for...

## Installation

\`\`\`bash
pnpm add memctx-plugin-custom
\`\`\`

## Usage

\`\`\`typescript
// In memctx config
{
  "plugins": ["memctx-plugin-custom"]
}
\`\`\`
EOF
```

### 2. Publish to NPM

```bash
# Login to NPM
npm login

# Publish
npm publish

# Or with pnpm
pnpm publish
```

### 3. Install Plugin

```bash
# Install globally
pnpm add -g memctx-plugin-custom

# Or locally
pnpm add memctx-plugin-custom
```

### 4. Enable Plugin

**~/.memctx/config.json:**

```json
{
  "plugins": [
    "memctx-plugin-custom"
  ]
}
```

---

## Example Plugins

### Slack Integration

```typescript
// memctx-plugin-slack
import { Plugin, PluginContext, Session } from 'memctx'
import { WebClient } from '@slack/web-api'

export default class SlackPlugin implements Plugin {
  name = 'slack'
  version = '1.0.0'
  private slack: WebClient

  async initialize(context: PluginContext): Promise<void> {
    this.slack = new WebClient(context.getConfig().slackToken)
    
    // Listen for session end events
    context.on('session.ended', async (session: Session) => {
      await this.notifySlack(session)
    })
  }

  private async notifySlack(session: Session): Promise<void> {
    await this.slack.chat.postMessage({
      channel: '#dev-updates',
      text: `Session completed: ${session.summary?.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${session.summary?.title}*\n\nDuration: ${session.duration}s\nProject: ${session.projectId}`
          }
        }
      ]
    })
  }

  async destroy(): Promise<void> {
    // Cleanup
  }
}
```

### Notion Export

```typescript
// memctx-plugin-notion
import { Exporter, Session } from 'memctx'
import { Client } from '@notionhq/client'

export class NotionExporter implements Exporter {
  name = 'notion'
  extension = '.notion'
  private notion: Client

  constructor(apiKey: string) {
    this.notion = new Client({ auth: apiKey })
  }

  async export(sessions: Session[]): Promise<Buffer> {
    for (const session of sessions) {
      await this.createNotionPage(session)
    }
    return Buffer.from('Exported to Notion')
  }

  private async createNotionPage(session: Session): Promise<void> {
    await this.notion.pages.create({
      parent: { database_id: 'your-database-id' },
      properties: {
        Title: {
          title: [{ text: { content: session.summary?.title || 'Untitled' } }]
        },
        Duration: {
          number: session.duration
        },
        Project: {
          select: { name: session.projectId }
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: 'Completed' } }]
          }
        },
        ...session.summary?.completed.map(item => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: item } }]
          }
        })) || []
      ]
    })
  }
}
```

### Custom AI Model

```typescript
// memctx-plugin-openai
import { Summarizer, Session, Summary } from 'memctx'
import OpenAI from 'openai'

export class OpenAISummarizer implements Summarizer {
  name = 'openai'
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  async summarize(session: Session): Promise<Summary> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a coding session analyzer. Provide concise summaries.'
        },
        {
          role: 'user',
          content: this.buildPrompt(session)
        }
      ]
    })

    return this.parseResponse(response.choices[0].message.content)
  }

  private buildPrompt(session: Session): string {
    return `Analyze this coding session:
      Duration: ${session.duration}s
      Files: ${session.metadata.filesChanged}
      Branch: ${session.branch}
      
      Provide a structured summary.`
  }

  private parseResponse(content: string): Summary {
    // Parse GPT response
    return {
      title: 'Session summary',
      completed: [],
      nextSteps: [],
      blockers: [],
      decisions: []
    }
  }
}
```

---

## Plugin Registry

Official plugins are listed at: https://memctx.dev/plugins

Submit your plugin for inclusion in the registry!

---

## Next Steps

- [🏗️ Architecture](architecture.md) - Understand the system
- [🔌 API Reference](api-reference.md) - API documentation
- [🤝 Contributing](contributing.md) - Contribute to MemCTX

---

<div align="center">

**Questions?** [Open an issue](https://github.com/bbhunterpk-ux/memctx/issues) • [Join discussions](https://github.com/bbhunterpk-ux/memctx/discussions)

</div>
