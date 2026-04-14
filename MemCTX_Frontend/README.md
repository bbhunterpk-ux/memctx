# MemCTX Frontend

Modern, responsive landing page for MemCTX - Autonomous Session Memory for Claude Code.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **React Router** - Client-side routing
- **Lenis** - Smooth scrolling

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
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── ...
├── pages/           # Route pages
│   ├── Index.tsx
│   ├── Docs.tsx
│   └── NotFound.tsx
├── lib/             # Utilities
│   └── utils.ts
├── App.tsx          # Root component
└── main.tsx         # Entry point
```

## Features

- Responsive design with mobile-first approach
- Dark mode support
- Smooth scrolling animations
- SEO optimized
- Type-safe development
- Component-based architecture

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm build:dev` - Development build
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode

## License

MIT
