# Hono Scalar API Documentation Integration

## Overview

This proof of concept integration adds [Scalar API Reference](https://scalar.com/) to the OpenWrite server, providing beautiful, interactive API documentation.

## What's Added

### Dependencies
- `@scalar/hono-api-reference` - Scalar integration for Hono
- `@hono/zod-openapi` - OpenAPI schema generation with Zod validation

### New Files
- **`src/lib/openapi.ts`** - OpenAPI-enabled Hono app configuration
- **`src/routes/health.ts`** - Health check endpoint with OpenAPI schema
- **`src/routes/user.ts`** - User info endpoint with OpenAPI schema

### Updated Files
- **`src/index.ts`** - Mounts OpenAPI routes alongside existing routes

## API Endpoints

### Documentation
- **`GET /api/docs`** - Interactive Scalar API reference UI
- **`GET /api/openapi.json`** - OpenAPI 3.0 specification

### API Routes (with OpenAPI schemas)
- **`GET /api/health`** - Health check with structured response
- **`GET /api/user/me`** - Current user information (authenticated)

## Features

✅ **OpenAPI 3.0 Support** - Full OpenAPI specification generation  
✅ **Interactive Documentation** - Beautiful Scalar UI for testing APIs  
✅ **Type-Safe Schemas** - Zod validation with TypeScript inference  
✅ **Authentication Integration** - Works with existing Better Auth  
✅ **Existing Routes Preserved** - All current functionality maintained  

## Usage

### Development Server
```bash
cd apps/server
bun dev
```

### Access Documentation
- **API Documentation**: http://localhost:3000/api/docs
- **OpenAPI Spec**: http://localhost:3000/api/openapi.json

### Testing Endpoints
- **Health Check**: `GET /api/health`
- **User Info**: `GET /api/user/me` (requires authentication)

## Architecture

```
apps/server/src/
├── lib/
│   └── openapi.ts          # OpenAPI Hono app setup & Scalar config
├── routes/
│   ├── health.ts           # Health endpoint with schema
│   └── user.ts             # User endpoint with schema  
└── index.ts                # Main app with mounted OpenAPI routes
```

## Next Steps (Future Enhancements)

1. **Expand Route Coverage** - Add OpenAPI schemas to more endpoints
2. **Authentication Docs** - Document auth flows in OpenAPI spec
3. **Request/Response Examples** - Add comprehensive examples
4. **Error Handling** - Standardize error response schemas
5. **API Versioning** - Implement versioning strategy
6. **Custom Themes** - Customize Scalar appearance to match OpenWrite branding

## Technical Notes

- **Coexistence**: OpenAPI routes run alongside existing routes without conflicts
- **Type Safety**: Full TypeScript inference from Zod schemas to response types
- **Performance**: Minimal bundle size increase (~400KB for full documentation UI)
- **Compatibility**: Works with existing Better Auth and ORPC setup

The integration demonstrates how modern API documentation can enhance developer experience while maintaining existing functionality.