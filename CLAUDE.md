# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenWrite is a full-stack TypeScript application built with the Better-T-Stack, featuring a monorepo structure managed by Turborepo. This open-source AI-powered writing platform consists of three main applications:

- **Web App** (`apps/web/`): React frontend with TanStack Router, TailwindCSS, and shadcn/ui components
- **Server** (`apps/server/`): Hono-based REST server deployed on Cloudflare Workers  
- **Documentation** (`apps/docs/`): VitePress documentation site

## Architecture

### Backend (apps/server/)
- **Framework**: Hono with Cloudflare Workers runtime
- **API Layer**: Hono REST API with OpenAPI type safety
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Authentication**: Better Auth with email/password support
- **Key Files**:
  - `src/index.ts`: Main Hono application with CORS, auth handlers, and REST routing setup
  - `src/lib/context.ts`: Request context creation with session handling
  - `src/lib/auth.ts`: Better Auth configuration with Drizzle adapter

### Frontend (apps/web/)
- **Framework**: React 19 with TanStack Router for file-based routing
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for REST calls
- **Key Files**:
  - `src/main.tsx`: Application entry point with router and query client setup
  - `src/routes/`: File-based routing structure
  - `src/components/`: Reusable UI components
  - `src/utils/api.ts`: REST API client configuration and utilities

## Development Commands

### Primary Commands (run from project root)
```bash
bun dev              # Start both web and server in development
bun build            # Build all applications
bun check-types      # TypeScript type checking across all apps
bun lint             # Code formatting, linting, and import sorting
bun quality          # Run both type checking and linting (recommended for CI/hooks)
bun quality:fix      # Auto-fix formatting/linting issues, then run type checking
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
- `apps/docs/`: VitePress documentation site commands

## Development Setup

1. Install dependencies: `bun install`
2. Set up environment variables in `apps/server/.dev.vars`
3. Initialize database: `bun db:push`
4. Start development: `bun dev`

The web application runs on http://localhost:3001 and the API on http://localhost:3000.

## Testing

Type checking is the primary validation method. Run `bun check-types` before committing changes to ensure type safety across the full-stack application.

## Claude Code Integration

This project includes Claude Code hooks configured in `.claude/settings.json`:

- **user-prompt-submit hook**: Runs quality checks before processing user requests
- **Stop hook**: Runs quality checks automatically when Claude finishes a task
- **PreToolUse hooks**: Logs commands, edits, and writes for development tracking

The quality check script (`.claude/quality-check.sh`) intelligently runs:
- Full type checking + linting if TypeScript/JavaScript files are modified
- Just linting if only other files are modified

Manual commands available:
```bash
bun quality          # Full quality check (type checking + linting)
bun quality:fix      # Auto-fix issues then run quality check
./.claude/quality-check.sh  # Smart quality check based on git status
```

To bypass hooks temporarily (not recommended), you can modify `.claude/settings.json`.

## Documentation Strategy

All project documentation is centralized in the `apps/docs/` directory using VitePress:

- **API Documentation**: `apps/docs/api/` - Server API endpoints and usage
- **User Guide**: `apps/docs/guide/` - End-user features and tutorials  
- **Contributing Guide**: `apps/docs/contributing/` - Development setup, architecture, deployment

This includes technical documentation like database configuration, deployment guides, and architectural decisions. The docs app serves as the single source of truth for all project documentation, making it easily discoverable and maintainable.