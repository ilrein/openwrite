# Tauri Desktop App Migration Plan

## Current Challenge
- Cloudflare D1 requires complex setup (wrangler, accounts, CLI tools)
- Not suitable for desktop apps (Workers can't run locally)
- Users want a simple download-and-run experience

## Tauri Solution Architecture

### Frontend (Keep Existing)
- **React app** in `apps/web/` stays mostly the same
- **TailwindCSS + shadcn/ui** components unchanged
- **TanStack Router** for client-side routing
- **TanStack Query** for data fetching (now calls Tauri commands)

### Backend (New Tauri Rust Backend)
```
apps/desktop/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs           # Tauri app setup
│   │   ├── database.rs       # SQLite operations
│   │   ├── auth.rs          # Local auth management
│   │   ├── api.rs           # API handlers (replaces Hono)
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                      # Symlink to apps/web/src/
├── package.json
└── index.html
```

## Migration Steps

### 1. Database Layer (SQLite)
Replace Cloudflare D1 + Drizzle with Tauri + SQLite:

```rust
// src-tauri/src/database.rs
use rusqlite::{Connection, Result};
use tauri::State;

#[derive(Debug)]
pub struct Database {
    conn: std::sync::Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let conn = Connection::open("openwrite.db")?;
        // Run migrations automatically on startup
        conn.execute_batch(include_str!("../migrations/init.sql"))?;
        Ok(Database {
            conn: std::sync::Mutex::new(conn),
        })
    }
}

#[tauri::command]
pub fn create_user(
    db: State<Database>,
    email: String,
    password: String,
) -> Result<String, String> {
    // Hash password and insert user
    // Return user ID or error
}
```

### 2. Authentication Layer
Replace Better Auth with local session management:

```rust
// src-tauri/src/auth.rs
use tauri::{State, Manager};
use std::collections::HashMap;
use std::sync::Mutex;

pub struct AuthState {
    sessions: Mutex<HashMap<String, User>>,
}

#[tauri::command]
pub fn sign_in(
    db: State<Database>,
    auth: State<AuthState>,
    email: String,
    password: String,
) -> Result<User, String> {
    // Verify credentials against local database
    // Create session
    // Return user data
}
```

### 3. API Layer (Tauri Commands)
Replace ORPC endpoints with Tauri commands:

```rust
// src-tauri/src/api.rs
#[tauri::command]
pub fn get_user_projects(
    db: State<Database>,
    auth: State<AuthState>,
    session_token: String,
) -> Result<Vec<Project>, String> {
    // Verify session
    // Query user's projects
    // Return projects
}

#[tauri::command] 
pub fn create_project(
    db: State<Database>,
    auth: State<AuthState>,
    session_token: String,
    title: String,
) -> Result<Project, String> {
    // Create new project in local database
}
```

### 4. Frontend Adapter Layer
Create adapter to replace ORPC client:

```typescript
// apps/desktop/src/lib/tauri-client.ts
import { invoke } from '@tauri-apps/api/tauri'

export const tauriClient = {
  auth: {
    signIn: (email: string, password: string) =>
      invoke('sign_in', { email, password }),
    signUp: (email: string, password: string) =>
      invoke('sign_up', { email, password }),
  },
  projects: {
    list: (sessionToken: string) =>
      invoke('get_user_projects', { sessionToken }),
    create: (sessionToken: string, title: string) =>
      invoke('create_project', { sessionToken, title }),
  }
}
```

## User Experience

### Current (Complex):
1. Clone repo
2. Install Node.js, Bun, Wrangler
3. Create Cloudflare account
4. Run `wrangler login`
5. Run `wrangler d1 create`
6. Update wrangler.jsonc manually
7. Set environment variables
8. Run migrations
9. Start dev server

### With Setup Script (Simplified):
1. Clone repo
2. Run `bun setup` 
3. Wait for automation
4. Run `bun dev`

### With Tauri Desktop (Ideal):
1. Download `.dmg`/`.exe`/`.AppImage`
2. Double-click to install
3. Open app, start writing

## Implementation Timeline

### Week 1-2: Basic Tauri Setup
- Initialize Tauri project structure
- Set up SQLite database with migrations
- Create basic user authentication

### Week 3-4: Core Features
- Project management (CRUD operations)
- Document editing and saving
- Local file system integration

### Week 5-6: UI Integration
- Port existing React components
- Replace ORPC calls with Tauri commands
- Test complete user flows

### Week 7-8: Polish & Distribution
- App icons and metadata
- Code signing certificates
- Build pipeline for multiple platforms
- App store submission (optional)

## Benefits of Tauri Approach

✅ **Zero Setup**: Download and run, no CLI tools needed  
✅ **Offline First**: No internet required for core functionality  
✅ **Native Performance**: Rust backend, native SQLite  
✅ **Cross Platform**: Windows, macOS, Linux support  
✅ **Small Bundle**: ~10-20MB vs Electron's ~100MB+  
✅ **Secure**: Tauri's security model with restricted APIs  

This approach completely eliminates the Cloudflare dependency for desktop users while keeping the web version for those who prefer hosted solutions.