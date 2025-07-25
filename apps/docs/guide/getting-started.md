# Getting Started

Welcome to OpenWrite! This guide will help you get up and running with your own instance of the platform.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Bun** (v1.2.24 or later) - [Install Bun](https://bun.sh)
- **Node.js** (v18 or later) - Required for some dependencies
- **Git** - For cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ilrein/openwrite.git
cd openwrite
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create the environment file for the server:

```bash
cp apps/server/.dev.vars.example apps/server/.dev.vars
```

Edit `apps/server/.dev.vars` with your configuration:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# AI Providers (optional - configure as needed)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

### 4. Database Setup

Initialize your database:

```bash
bun db:push
```

### 5. Start Development

Launch both the web app and server:

```bash
bun dev
```

Your applications will be available at:
- **Web App**: http://localhost:3001
- **API Server**: http://localhost:3000
- **Database Studio**: http://localhost:4983 (runs automatically with `bun dev`)

## First Steps

### Create an Account

1. Navigate to http://localhost:3001
2. Click "Sign Up" to create your account
3. Fill in your email and password
4. You'll be automatically logged in

### Set Up AI Providers

1. Go to Dashboard → AI Providers
2. Configure your preferred AI services:
   - **OpenAI**: Add your API key for GPT models
   - **Anthropic**: Add your key for Claude models
   - **OpenRouter**: Connect for access to multiple models
   - **Local Models**: Set up Ollama or other local providers

### Create Your First Project

1. Click "New Project" from the dashboard
2. Choose a project type (Novel, Short Story, etc.)
3. Give your project a name and description
4. Start writing!

## Development Commands

### Primary Commands
```bash
bun dev              # Start web + server + database studio
bun build            # Build all applications
bun check-types      # TypeScript validation
bun lint             # Code formatting and linting
bun quality          # Run type checking + linting
```

### Targeted Development
```bash
bun dev:web          # Start only web app (port 3001)
bun dev:server       # Start only server (port 3000)
bun dev:docs         # Start documentation site
```

### Database Management
```bash
bun db:studio        # Open database management UI
bun db:push          # Apply schema changes
bun db:generate      # Generate migration files
bun db:migrate       # Run pending migrations
```

## What's Next?

- Explore the [Features Overview](./features.md) to learn about all capabilities
- Check out the [AI Assistant Guide](./ai-assistant.md) for writing tips
- Read about [Project Management](./projects.md) for organizing your work
- Join our community on [GitHub](https://github.com/ilrein/openwrite) for support

## Troubleshooting

### Common Issues

**Database connection errors**: Make sure you've run `bun db:push` to initialize the database.

**Port conflicts**: If ports 3000 or 3001 are in use, you can modify them in the respective app configurations.

**AI provider issues**: Double-check your API keys in the `.dev.vars` file and ensure they have proper permissions.

**Build failures**: Run `bun quality` to check for TypeScript or linting issues.

For more help, check our [GitHub Issues](https://github.com/ilrein/openwrite/issues) or create a new issue if you encounter problems.