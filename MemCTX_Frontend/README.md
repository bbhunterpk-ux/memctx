# MemCTX Frontend

Official landing page for **MemCTX** - Autonomous Session Memory & Context Handoff for Claude Code.

## About MemCTX

MemCTX is an npm package that gives Claude Code world-class memory capabilities. It automatically tracks your coding sessions, remembers context across conversations, and provides seamless handoffs between sessions. Never repeat yourself again - your AI pair programmer now remembers everything.

### Key Features Showcased

- **Autonomous Session Memory** - Automatic tracking and summarization of coding sessions
- **Context Handoff** - Seamless continuation between sessions with full context
- **Session Analytics** - Visual dashboard with insights and metrics
- **CLI Integration** - Simple `npx memctx init` setup
- **Real-time Updates** - Live session tracking and status

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **React Router** - Client-side routing
- **Lenis** - Smooth scrolling animations

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Server runs on `http://localhost:8080`

### Build

```bash
# Production build
pnpm build

# Development build
pnpm build:dev
```

### Testing

```bash
# Run tests once
pnpm test

# Watch mode
pnpm test:watch
```

## Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── HeroSection.tsx  # Landing hero with CTA
│   ├── FeaturesSection.tsx
│   ├── ProductShowcase.tsx
│   ├── ComparisonSection.tsx
│   ├── ArchitectureSection.tsx
│   ├── InstallationSection.tsx
│   ├── CLISection.tsx
│   ├── CTASection.tsx
│   ├── TerminalMockup.tsx
│   ├── Navbar.tsx
│   └── Footer.tsx
├── pages/               # Route pages
│   ├── Index.tsx        # Main landing page
│   ├── Docs.tsx         # Documentation
│   └── NotFound.tsx
├── hooks/               # Custom React hooks
│   ├── useLenis.ts      # Smooth scrolling
│   └── useScrollReveal.ts
├── lib/                 # Utilities
│   └── utils.ts
├── App.tsx              # Root component with routing
└── main.tsx             # Entry point
```

## Page Sections

The landing page includes:

1. **Hero Section** - Main value proposition with install command
2. **Features Section** - Key capabilities of MemCTX
3. **Product Showcase** - Visual demonstration
4. **Comparison Section** - Before/after scenarios
5. **Architecture Section** - Technical overview
6. **Installation Section** - Setup instructions
7. **CLI Section** - Command reference
8. **CTA Section** - Call to action
9. **Footer** - Links and information

## Design Features

- Responsive design with mobile-first approach
- Dark mode support with theme switching
- Smooth scrolling animations with Lenis
- Scroll-triggered reveal animations
- Gradient text effects
- Animated background orbs
- Terminal-style code blocks
- Copy-to-clipboard functionality
- SEO optimized meta tags
- Type-safe development

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm build:dev` - Development build
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode

## Links

- **NPM Package**: https://www.npmjs.com/package/memctx
- **GitHub**: https://github.com/bbhunterpk-ux/Claude-Context

## License

MIT
