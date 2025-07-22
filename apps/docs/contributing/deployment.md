# OpenWrite Deployment Guide

This guide covers deploying OpenWrite to Cloudflare using GitHub Actions.

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with access to:
   - Cloudflare Workers (for the unified full-stack app)
   - Cloudflare D1 (for the database)

2. **GitHub Repository Secrets**: Add the following secrets to your GitHub repository:

### Required Secrets

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions, then add:

| Secret Name | Description | How to Get It |
|-------------|-------------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers and Pages permissions | Create at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Found in the right sidebar of any Cloudflare dashboard page |
| `BETTER_AUTH_SECRET` | Secret for Better Auth (32+ character random string) | Generate with `openssl rand -base64 32` |

**Note**: The database ID is stored in `apps/server/wrangler.jsonc` and doesn't need to be a secret since it's not sensitive information.

### Creating Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom Token" template
4. Set permissions:
   - Account: `Cloudflare Workers:Edit`
   - Zone: `Zone:Read` (for your domain, if using custom domain)
   - Account: `Account:Read`
   - Account: `D1:Edit`
5. Add account resource: `Include - All accounts` or select specific account
6. Add zone resource (if using custom domain): `Include - Specific zone - yourdomain.com`

## Initial Setup

### 1. Database Setup

Run the setup script to create your D1 database:

```bash
bun run setup
```

This will:
- Create a new D1 database
- Update your `wrangler.jsonc` with the database ID
- Generate and run initial migrations
- Create `.dev.vars` with secure secrets

### 2. Manual Database Setup (Alternative)

If you prefer manual setup:

```bash
# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create openwrite-app

# Update apps/server/wrangler.jsonc with the database ID from the output
# Then generate migrations
cd apps/server
bun db:generate

# Apply migrations locally for testing
npx wrangler d1 migrations apply openwrite-app --local

# Apply migrations to production (after first deployment)
npx wrangler d1 migrations apply openwrite-app --remote
```

## Deployment

### Automatic Deployment

The GitHub Actions workflow automatically deploys when you push to the `main` branch:

1. **Type checks** all TypeScript code
2. **Builds** the web application
3. **Deploys** the unified full-stack app to Cloudflare Workers (includes both API and static assets)
4. **Runs** database migrations on production (main branch only)

### Manual Deployment

You can also deploy manually:

```bash
# Build web app first
cd apps/web
bun build

# Deploy unified app (API + Static Assets)
cd ../server
npx wrangler deploy
```

## Environment Variables

### Production Secrets

Production secrets are managed through Wrangler:

```bash
cd apps/server

# Set the Better Auth secret
npx wrangler secret put BETTER_AUTH_SECRET

# Set any other secrets as needed
npx wrangler secret put SOME_SECRET
```

### Public Environment Variables

Public environment variables go in `apps/server/wrangler.jsonc`:

```json
{
  "vars": {
    "NODE_ENV": "production",
    "CORS_ORIGIN": "https://your-domain.com"
  }
}
```

## Custom Domains

### Worker (Full-Stack App) Custom Domain

1. In Cloudflare Dashboard → Workers & Pages → openwrite
2. Go to Settings → Triggers
3. Add Custom Domain
4. Enter your domain (e.g., `yourdomain.com`)

The unified Worker serves both the API endpoints (e.g., `/api/*`, `/rpc/*`) and the web app (static files + SPA routing).

## Monitoring

After deployment, monitor your application:

- **Worker**: Cloudflare Dashboard → Workers & Pages → openwrite
- **D1**: Cloudflare Dashboard → D1 → openwrite-app

The unified Worker handles all requests - both API calls and web app serving.

## Troubleshooting

### Common Issues

1. **"No account id found"**: Ensure `CLOUDFLARE_ACCOUNT_ID` secret is set correctly
2. **Database errors**: Run migrations with `npx wrangler d1 migrations apply openwrite-app --remote`
3. **Build failures**: Check that all dependencies are installed and types are correct

### Debug Commands

```bash
# Check Wrangler configuration
npx wrangler whoami

# List your databases
npx wrangler d1 list

# Check deployment status
npx wrangler deployments list
```

## Development vs Production

- **Development**: Uses local SQLite files via Wrangler dev
- **Production**: Uses remote D1 database via HTTP API
- **Configuration**: Automatically detected in `drizzle.config.ts`

The deployment pipeline ensures a smooth transition from local development to production infrastructure.