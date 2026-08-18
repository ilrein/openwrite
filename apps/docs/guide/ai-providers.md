# AI Providers

Connect your favorite AI services to OpenWrite for enhanced writing assistance. Manage multiple providers, track usage, and seamlessly switch between different AI models.

## Overview

OpenWrite's AI Providers system allows you to:

- **Connect multiple AI services** - Use OpenRouter, OpenAI, Anthropic, and more
- **Secure credential management** - API keys are encrypted and safely stored
- **One-click OAuth connections** - Easy setup with supported providers
- **Usage tracking** - Monitor your API usage and costs
- **Provider switching** - Switch between providers based on your needs

## Getting Started

### Connecting Your First Provider

1. **Navigate to Settings** → **AI Providers**
2. **Choose a Provider** from the available options
3. **Connect via OAuth** (recommended) or **Enter API Key manually**
4. **Set as Default** if this will be your primary provider

### OpenRouter (Recommended)

OpenRouter provides access to 200+ AI models from various providers through a single API. It's perfect for:

- **Cost optimization** - Compare prices across providers
- **Model variety** - Access models from OpenAI, Anthropic, Meta, and more
- **Fallback support** - Automatic failover if your primary model is unavailable

#### Connecting OpenRouter

1. Click **"Connect OpenRouter"** in the AI Providers section
2. You'll be redirected to OpenRouter's secure login page
3. **Authorize OpenWrite** to access your account
4. **Return to OpenWrite** - your connection is now active!

The OAuth connection is secured using PKCE (Proof Key for Code Exchange), ensuring your credentials are never exposed.

### Choosing a Model

Every provider has a **Model** field on the connect form. Leave it blank to use
the provider's default, or enter a model ID to pin the assistant to it.

On OpenRouter this matters for cost: model IDs ending in `:free` (for example
`z-ai/glm-5.2:free`) cost nothing, while `openrouter/auto` and most named models
bill credits. If you connect an OpenRouter key with no credits and do not set a
model, OpenWrite uses a `:free` model so the assistant still works.

There is no edit flow for a connected provider yet, so changing the model means
disconnecting the provider and connecting it again with the new value.

### Custom (OpenAI-compatible)

Any service that speaks the OpenAI chat-completions API can be connected with the
**Custom (OpenAI-compatible)** provider — LM Studio, vLLM, llama.cpp, DeepSeek,
Together, or a company gateway.

You need two things:

- **Base URL** — the OpenAI-compatible base, such as `https://api.deepseek.com/v1`.
  OpenWrite appends `/chat/completions` for you, so a URL that already ends in it
  works too.
- **Model** — the model ID the endpoint serves. Required, since OpenWrite cannot
  guess what a custom endpoint hosts.

The **API Key** is optional here. Leave it blank for an endpoint that does not
authenticate; if you provide one it is encrypted at rest and sent as a
`Bearer` token.

::: warning Local endpoints need a tunnel
Completions are requested by the server, not your browser. On the hosted app that
server is a Cloudflare Worker, which cannot reach `http://localhost` on your
machine — a loopback URL will fail even though the endpoint works locally.

To use LM Studio, vLLM or llama.cpp from your own machine, expose it with a tunnel
and paste the public HTTPS URL, the same way the Ollama setup does:

```bash
# ngrok
ngrok http 1234

# or cloudflared
cloudflared tunnel --url http://localhost:1234
```

If you self-host OpenWrite and run the server on the same machine as the model, a
`localhost` URL is fine.
:::

## Managing Providers

### Provider Settings

Each connected provider has configurable options:

- **Label** - Custom name for easy identification
- **Active Status** - Enable/disable the provider
- **Default Provider** - Set as primary for new writing sessions
- **Usage Limits** - Set spending or request limits
- **Supported Models** - View available AI models

### Usage Monitoring

Track your AI usage across all providers:

- **Current Usage** - Requests made this billing period
- **Remaining Credits** - Available credits or requests
- **Usage History** - Historical usage patterns
- **Cost Tracking** - Estimated costs (where available)

### Security Features

- **Encrypted Storage** - API keys are encrypted at rest
- **User-scoped Access** - Keys are only accessible by you
- **Secure Deletion** - Keys are permanently removed when disconnected
- **Session Management** - OAuth tokens are refreshed automatically

## Provider Comparison

| Feature | OpenRouter | OpenAI | Anthropic | Ollama | Custom |
|---------|------------|--------|-----------|---------|--------|
| **Connection** | OAuth PKCE | API Key | API Key | Direct | Base URL + optional key |
| **Models** | 200+ models | GPT series | Claude series | Local models | Whatever the endpoint serves |
| **Pricing** | Pay-per-use (`:free` models available) | Subscription/Pay-per-use | Pay-per-use | Free (local) | Depends on the endpoint |
| **Setup Difficulty** | Easy | Medium | Medium | Advanced | Advanced |
| **Best For** | Variety & cost optimization | Latest GPT models | Reasoning & analysis | Privacy & local inference | Self-hosted or unlisted services |

Groq, Google Gemini and Cohere are also available and connect with an API key.

## AI Model Selection

### OpenRouter Models

Popular models available through OpenRouter:

- **GPT-4 Turbo** - Latest OpenAI model with 128k context
- **Claude 3.5 Sonnet** - Anthropic's most capable model
- **Llama 3.1 405B** - Meta's largest open-source model
- **Gemini Pro** - Google's multimodal model
- **Command R+** - Cohere's enterprise model

### Choosing the Right Model

Consider these factors when selecting models:

- **Task Type** - Creative writing, analysis, code generation
- **Context Length** - How much text you need to process
- **Speed vs Quality** - Fast responses vs highest quality
- **Cost** - Balance performance with budget
- **Privacy** - Some models offer enhanced privacy features

## Usage Scenarios

### Creative Writing

**Recommended Setup:**
- **Primary**: OpenRouter with Claude 3.5 Sonnet
- **Fallback**: OpenRouter with GPT-4 Turbo
- **Budget Option**: OpenRouter with Llama 3.1 70B

### Technical Writing

**Recommended Setup:**
- **Primary**: OpenAI GPT-4 Turbo
- **Fallback**: OpenRouter with Claude 3.5 Sonnet
- **Code Examples**: OpenRouter with Code Llama

### Privacy-Focused Writing

**Recommended Setup:**
- **Primary**: Ollama with local models
- **Cloud Fallback**: OpenRouter with privacy-focused models
- **Backup**: Anthropic Claude (enhanced privacy)

## Troubleshooting

### Common Issues

#### Connection Failed
- **Check API Key** - Ensure your key is valid and active
- **Network Issues** - Verify internet connection
- **Service Status** - Check provider's status page

#### Usage Limits Exceeded
- **Check Quotas** - Review your provider's usage limits
- **Upgrade Plan** - Consider upgrading your provider account
- **Switch Providers** - Use alternative providers temporarily

#### 402 Payment Required
- **Pick a free model** - On OpenRouter, set the Model field to an ID ending in `:free`
- **Add credits** - Named models and `openrouter/auto` bill your OpenRouter balance
- **Check the model exists** - A retired `:free` model returns an error until you change it

#### Model Not Available
- **Provider Status** - Model may be temporarily unavailable
- **Model Deprecation** - Provider may have retired the model
- **Access Permissions** - Some models require special access

### Getting Help

If you encounter issues:

1. **Check Provider Documentation** - Each provider has specific requirements
2. **Review Error Messages** - OpenWrite provides detailed error information
3. **Contact Support** - Reach out through our support channels
4. **Community Forum** - Ask questions in our community discussions

## Best Practices

### Security

- **Rotate API Keys** regularly for manually-entered keys
- **Use OAuth** when available for enhanced security
- **Monitor Usage** to detect unauthorized access
- **Revoke Access** if you suspect compromise

### Cost Management

- **Set Usage Limits** to prevent unexpected charges
- **Compare Prices** across providers for cost optimization
- **Monitor Trends** to predict monthly costs
- **Use Cheaper Models** for less critical tasks

### Performance

- **Test Different Models** to find the best fit for your use case
- **Configure Fallbacks** to ensure uninterrupted service
- **Cache Responses** when appropriate to reduce API calls
- **Batch Requests** when possible to improve efficiency

## Future Features

We're continuously improving the AI Providers system:

### Coming Soon

- **Cost Analytics** - Detailed spending reports and predictions
- **Model Recommendations** - AI-powered model selection
- **Team Sharing** - Share provider access within organizations
- **Custom Endpoints** - Connect to self-hosted AI models
- **Usage Alerts** - Notifications when approaching limits

### Requested Features

- **Automatic Failover** - Seamless switching when providers are down
- **Response Caching** - Reduce costs by caching similar requests
- **A/B Testing** - Compare outputs from different models
- **Bulk Operations** - Manage multiple providers simultaneously

---

*AI Providers make it easy to harness the power of multiple AI services while keeping your credentials secure and usage under control.*