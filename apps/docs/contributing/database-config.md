# Database Configuration

This project uses an intelligent Drizzle configuration that automatically detects whether to use local or remote Cloudflare D1 databases.

## How it Works

The `drizzle.config.ts` automatically chooses the appropriate driver:

### Local Development (SQLite)
- **When**: `NODE_ENV !== "production"` AND no `CLOUDFLARE_D1_TOKEN` AND local D1 file exists
- **Driver**: Direct SQLite file access
- **Database**: `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`

### Remote/Production (D1 HTTP API)
- **When**: `NODE_ENV === "production"` OR `CLOUDFLARE_D1_TOKEN` is set
- **Driver**: `d1-http`  
- **Database**: Cloudflare D1 via HTTP API

## Environment Variables

### For Remote D1 (in `.dev.vars` or production secrets):
```bash
CLOUDFLARE_ACCOUNT_ID=a9c9538ffdbcd1f606f241c5d9a22512
CLOUDFLARE_DATABASE_ID=9c50826a-1e7a-498c-ab1b-d1a73192cca9
CLOUDFLARE_D1_TOKEN=your-api-token-here
```

## Commands

```bash
# Local development (automatically uses local SQLite)
bun db:studio
bun db:generate
bun db:push

# Force remote configuration
bun drizzle-kit studio --config=drizzle-production.config.ts

# Check which configuration is being used (uncomment debug line)
bun db:generate
```

## Creating D1 API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token" → "Custom Token"
3. Permissions: `Account` → `Cloudflare D1:Edit`
4. Copy token to `.dev.vars` or production secrets

## Benefits

- **No hardcoded paths**: Automatically discovers local D1 database file
- **Environment-aware**: Switches between local/remote based on context
- **Zero configuration**: Works out of the box for both development and production
- **Fallback safety**: Uses `:memory:` if local file not found
- **Flexible**: Can override with explicit config files when needed