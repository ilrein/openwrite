# AI Providers API

The AI Providers API allows users to securely connect and manage multiple AI service providers (OpenRouter, OpenAI, Anthropic, etc.) for use within OpenWrite's AI-powered writing features.

## Overview

OpenWrite supports multiple AI providers to give users flexibility in choosing their preferred AI models and pricing. The system includes:

- **Secure API key storage** - Keys are encrypted and linked to user accounts
- **OAuth integration** - Seamless connection flows (starting with OpenRouter PKCE)
- **Usage tracking** - Monitor API usage and set limits
- **Multi-provider support** - Connect multiple providers simultaneously
- **Default provider selection** - Set preferred providers per use case

## Supported Providers

| Provider | Connection Method | Status | Models Available |
|----------|-------------------|--------|-----------------|
| OpenRouter | OAuth PKCE | ✅ Active | 200+ models from multiple providers |
| OpenAI | API Key | 🔄 Planned | GPT-4, GPT-3.5, DALL-E |
| Anthropic | API Key | 🔄 Planned | Claude 3.5, Claude 3 |
| Ollama | Direct Connection | 🔄 Planned | Local models |
| Groq | API Key | 🔄 Planned | Fast inference models |
| Google | API Key | 🔄 Planned | Gemini models |
| Cohere | API Key | 🔄 Planned | Command models |

## Database Schema

The `ai_provider` table stores provider connections:

```sql
CREATE TABLE ai_provider (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  
  -- Provider information
  provider TEXT NOT NULL CHECK (provider IN (
    'openrouter', 'openai', 'anthropic', 'ollama', 
    'groq', 'gemini', 'cohere'
  )),
  provider_user_id TEXT,
  
  -- API key details (encrypted at application layer)
  api_key TEXT NOT NULL, -- Encrypted using AES-GCM
  key_hash TEXT, -- SHA-256 hash for identification
  key_label TEXT,
  
  -- Configuration
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage tracking
  usage_limit INTEGER,
  usage_remaining INTEGER,
  current_usage INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP,
  
  -- OAuth fields (encrypted at application layer)
  access_token TEXT, -- Encrypted using AES-GCM
  refresh_token TEXT, -- Encrypted using AES-GCM
  token_expires_at TIMESTAMP,
  
  -- Provider-specific configuration (JSON)
  supported_models TEXT, -- JSON array
  provider_config TEXT,  -- JSON object
  
  -- Constraints
  UNIQUE(user_id, provider) -- Each user can have only one configuration per provider
);
```

## API Endpoints

### List AI Providers

Get all AI providers for the authenticated user.

```http
GET /api/ai-providers
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "providers": [
    {
      "id": "uuid",
      "provider": "openrouter",
      "keyLabel": "OpenRouter",
      "isActive": true,
      "isDefault": false,
      "usageLimit": 10000,
      "usageRemaining": 8500,
      "currentUsage": 1500,
      "createdAt": "2024-01-15T10:30:00Z",
      "lastUsedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

### Create AI Provider

Add a new AI provider with manual API key entry.

```http
POST /api/ai-providers
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-...",
  "keyLabel": "OpenAI GPT-4",
  "isDefault": true,
  "usageLimit": 5000
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid"
}
```

### Update AI Provider

Update provider settings (cannot change API key).

```http
PUT /api/ai-providers/{id}
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "keyLabel": "Updated Label",
  "isActive": false,
  "usageLimit": 2000
}
```

### Delete AI Provider

Remove an AI provider and its stored credentials.

```http
DELETE /api/ai-providers/{id}
Authorization: Bearer <session-token>
```

### Get Provider Details

Retrieve detailed information about a specific provider.

```http
GET /api/ai-providers/{id}
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "provider": {
    "id": "uuid",
    "provider": "openrouter",
    "providerUserId": "or-user-123",
    "keyLabel": "OpenRouter",
    "keyHash": "hash-for-identification",
    "isActive": true,
    "isDefault": false,
    "usageLimit": 10000,
    "usageRemaining": 8500,
    "currentUsage": 1500,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T12:00:00Z",
    "lastUsedAt": "2024-01-20T14:45:00Z",
    "supportedModels": ["openai/gpt-4", "anthropic/claude-3"],
    "providerConfig": {
      "maxTokens": 4000,
      "temperature": 0.7
    }
  }
}
```

## OpenRouter OAuth PKCE Integration

OpenRouter supports OAuth PKCE for secure, user-friendly API key acquisition.

### Exchange OAuth Code

After user completes OAuth flow, exchange the authorization code for an API key.

```http
POST /api/ai-providers/openrouter/exchange
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "code": "auth-code-from-openrouter",
  "codeVerifier": "pkce-code-verifier",
  "codeChallengeMethod": "S256"
}
```

**Response:**
```json
{
  "success": true,
  "id": "uuid"
}
```

## Frontend Integration

### TypeScript API Client

```typescript
import { api } from '@/lib/api'

// List providers
const providers = await api.aiProviders.list()

// Connect OpenRouter via OAuth
const connectOpenRouter = async () => {
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await createSHA256CodeChallenge(codeVerifier)
  
  // Store verifier for callback
  sessionStorage.setItem('openrouter_code_verifier', codeVerifier)
  
  // Redirect to OpenRouter
  const callbackUrl = `${window.location.origin}/auth/callback`
  const authUrl = `https://openrouter.ai/auth?callback_url=${encodeURIComponent(callbackUrl)}&code_challenge=${codeChallenge}&code_challenge_method=S256`
  
  window.location.href = authUrl
}

// Handle OAuth callback
const handleCallback = async (code: string) => {
  const codeVerifier = sessionStorage.getItem('openrouter_code_verifier')
  
  await api.aiProviders.exchangeOpenRouterCode({
    code,
    codeVerifier,
    codeChallengeMethod: 'S256'
  })
  
  sessionStorage.removeItem('openrouter_code_verifier')
}

// Create manual provider
await api.aiProviders.create({
  provider: 'openai',
  apiKey: 'sk-...',
  keyLabel: 'My OpenAI Key',
  isDefault: true
})

// Update provider
await api.aiProviders.update(providerId, {
  isDefault: true,
  usageLimit: 1000
})

// Delete provider
await api.aiProviders.delete(providerId)
```

### React Hook Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useAiProviders() {
  return useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => api.aiProviders.list()
  })
}

export function useCreateAiProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: api.aiProviders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
    }
  })
}
```

## Security Considerations

### API Key Storage

- **Encryption**: API keys and OAuth tokens are encrypted using AES-GCM before storage
- **Key Derivation**: Uses ENCRYPTION_KEY environment variable for encryption/decryption
- **Hash Identification**: SHA-256 hashes are stored for key identification without exposing plain text
- **Scope Limitation**: Keys are only accessible by the owning user
- **Secure Deletion**: Encrypted keys are permanently deleted when providers are removed

### OAuth Security

- **PKCE Flow**: Prevents authorization code interception attacks
- **State Validation**: Protects against CSRF attacks
- **Short-lived Codes**: Authorization codes expire quickly

### Usage Tracking

- **Rate Limiting**: Prevent abuse through usage limits
- **Monitoring**: Track unusual usage patterns
- **Alerts**: Notify users when approaching limits

## Setup and Configuration

### Encryption Key Setup

Before using the AI Providers system, you must generate an encryption key:

```bash
# Generate encryption key (run once during setup)
bun run setup-encryption.ts
```

Add the generated key to your environment variables:

```bash
# .dev.vars (development)
ENCRYPTION_KEY=<generated-key>

# Production environment
ENCRYPTION_KEY=<generated-key>
```

**⚠️ Important**: 
- Keep the encryption key secure and never share it publicly
- Losing this key will make existing encrypted API keys unrecoverable
- Use different keys for development and production environments

### Database Constraints

The system enforces a unique constraint on `(user_id, provider)` combinations, ensuring each user can have only one configuration per provider type. Attempting to create duplicate entries will result in a 409 Conflict error.

## Error Handling

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `PROVIDER_NOT_FOUND` | 404 | AI provider not found or not owned by user |
| `INVALID_API_KEY` | 400 | API key format is invalid |
| `DUPLICATE_PROVIDER` | 409 | Provider already exists for user (unique constraint) |
| `USAGE_LIMIT_EXCEEDED` | 429 | Provider usage limit exceeded |
| `OAUTH_EXCHANGE_FAILED` | 400 | Failed to exchange OAuth code |
| `ENCRYPTION_FAILED` | 500 | Failed to encrypt/decrypt API key (missing ENCRYPTION_KEY) |

### Error Response Format

```json
{
  "error": "PROVIDER_NOT_FOUND",
  "message": "The specified AI provider was not found or you don't have access to it."
}
```

## Future Enhancements

### Planned Features

- **Cost Tracking**: Track spending across providers
- **Model Routing**: Automatically route requests to optimal models
- **Fallback Chains**: Automatic failover between providers
- **Team Sharing**: Share provider access within organizations
- **Usage Analytics**: Detailed usage reports and insights

### Additional Providers

- **Azure OpenAI**: Enterprise OpenAI access
- **AWS Bedrock**: Amazon's AI model marketplace
- **Hugging Face**: Open source model hub
- **Custom Endpoints**: Self-hosted model APIs

---

*The AI Providers system is designed for extensibility and security, making it easy to add new providers while maintaining user data protection.*