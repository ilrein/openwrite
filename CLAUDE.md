# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenWrite is a full-stack TypeScript application built with the Better-T-Stack, featuring a monorepo structure managed by Turborepo. This open-source AI-powered writing platform consists of three main applications:

- **Web App** (`apps/web/`): React frontend with TanStack Router, TailwindCSS, and shadcn/ui components
- **Server** (`apps/server/`): Hono-based API server with ORPC for type-safe RPC, deployed on Cloudflare Workers  
- **Documentation** (`apps/docs/`): VitePress documentation site

## Architecture

### Backend (apps/server/)
- **Framework**: Hono with Cloudflare Workers runtime
- **API Layer**: ORPC for end-to-end type-safe RPC calls
- **Database**: SQLite/Turso with Drizzle ORM
- **Authentication**: Better Auth with email/password support
- **Key Files**:
  - `src/index.ts`: Main Hono application with CORS, auth handlers, and RPC setup
  - `src/routers/index.ts`: ORPC router definitions with public/protected procedures
  - `src/lib/orpc.ts`: ORPC configuration with middleware for authentication
  - `src/lib/context.ts`: Request context creation with session handling
  - `src/lib/auth.ts`: Better Auth configuration with Drizzle adapter

### Frontend (apps/web/)
- **Framework**: React 19 with TanStack Router for file-based routing
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query integrated with ORPC client
- **Key Files**:
  - `src/main.tsx`: Application entry point with router and query client setup
  - `src/routes/`: File-based routing structure
  - `src/utils/orpc.ts`: ORPC client configuration
  - `src/components/`: Reusable UI components

## Development Commands

### Primary Commands (run from project root)
```bash
bun dev              # Start both web and server in development
bun build            # Build all applications
bun check-types      # TypeScript type checking across all apps
```

### Targeted Commands
```bash
bun dev:web          # Start only web app (port 3001)
bun dev:server       # Start only server (port 3000)
```

### Database Commands
```bash
bun db:push          # Apply schema changes to database
bun db:studio        # Open Drizzle Studio for database management
bun db:generate      # Generate migration files
bun db:migrate       # Run database migrations
```

### Application-Specific Commands
Navigate to specific app directories for additional commands:
- `apps/server/`: Wrangler commands for Cloudflare Workers deployment
- `apps/web/`: Vite commands and Cloudflare Pages deployment

## Development Setup

1. Install dependencies: `bun install`
2. Set up environment variables in `apps/server/.env`
3. Initialize database: `bun db:push`
4. Start development: `bun dev`

The web application runs on http://localhost:3001 and the API on http://localhost:3000.

## Testing

Type checking is the primary validation method. Run `bun check-types` before committing changes to ensure type safety across the full-stack application.