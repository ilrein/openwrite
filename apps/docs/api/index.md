# API Reference

Welcome to the OpenWrite API documentation. This section provides comprehensive information about our RESTful API and WebSocket endpoints.

## Overview

The OpenWrite API is built with:
- **REST endpoints** for type-safe calls
- **Hono** framework for fast, lightweight endpoints
- **Zod** for runtime validation and type safety
- **Better Auth** for authentication

## Authentication

All API requests require authentication. We support:
- **Session-based authentication** for web clients
- **API keys** for programmatic access (coming soon)
- **OAuth2** integration (planned)

## Base URL

```
Production: https://api.openwrite.dev
Development: http://localhost:3000
```

## Rate Limits

- **Free tier**: 1000 requests per hour
- **Premium tier**: 10,000 requests per hour
- **Pro tier**: 100,000 requests per hour

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "error": null
}
```

For errors:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Quick Start

1. **Authenticate** with your credentials
2. **Create a project** to organize your writing
3. **Start writing** with AI assistance
4. **Export your work** in various formats

## SDK Libraries

- **JavaScript/TypeScript**: Official SDK with full type support
- **Python**: Community-maintained (coming soon)
- **Go**: Community-maintained (coming soon)

## API Sections

- [Authentication](./auth.md) - Login, logout, session management
- [Projects](./projects.md) - Create and manage writing projects
- [AI Providers](./ai-providers.md) - Connect and manage AI service providers
- [AI Integration](./ai.md) - AI writing assistance endpoints
- [WebSocket Events](./websocket.md) - Real-time collaboration

---

*This API is in active development. Check back for updates and new endpoints!*