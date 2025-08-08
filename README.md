# OpenWrite

**AI-powered writing platform for novelists & screenwriters. ✨📝**

OpenWrite is a comprehensive writing platform that empowers authors to write better stories faster. It combines intelligent AI assistance with powerful organization tools to help you plan, write, and collaborate on your creative projects.

## What OpenWrite Does

OpenWrite is a comprehensive AI-powered writing platform that transforms how authors create and structure their stories. The platform features a rich text editor with intelligent AI assistance that understands your characters, plot, and writing style, offering contextual suggestions as you write. The standout Story Canvas provides an interactive visual workspace where you can drag and drop story elements—from high-level acts and chapters down to individual scenes and beats—and connect them to map your narrative flow. Each story element can be detailed with goals, conflicts, character involvement, and thematic connections, creating a living blueprint of your work.

The platform integrates multiple AI providers (OpenAI, Anthropic, Claude, and local models) directly into the writing experience, while robust organization tools help manage character databases, locations, and world-building through the Codex system. Real-time collaboration features enable teams to work together with live editing and version control, while built-in analytics track writing progress, word counts, and productivity patterns.

OpenWrite combines the best features of Sudowrite and NovelCrafter into a single, powerful, and fully open-source platform. Built with a modern TypeScript stack including React, TanStack Router, Hono, a type-safe REST API, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Hono** - Lightweight, performant server framework
- **REST API** – Type-safe endpoints with OpenAPI integration
- **workers** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Email & password authentication with Better Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database:
Local development for a Cloudflare D1 database will already be running as part of the `wrangler dev` command.

2. Update your `.env` file in the `apps/server` directory with the appropriate connection details if needed.

3. Apply the schema to your database:
```bash
bun db:push
```


Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).



## Project Structure

```
openwrite/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Hono-based REST API server
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun dev:server`: Start only the server
- `bun check-types`: Check TypeScript types across all apps
- `bun db:push`: Push schema changes to database
- `bun db:studio`: Open database studio UI
- `cd apps/server && bun db:local`: Start the local SQLite database

### Ilia was here!