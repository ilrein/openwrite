# GitHub Projects Setup for WrittenCraft.ai

## Project Structure

### **Project Name**: WrittenCraft.ai Development
### **Description**: Master project for building an open-source AI writing platform

## Custom Fields to Create

1. **Phase** (Single select)
   - Phase 1: MVP Foundation
   - Phase 2: Advanced Planning
   - Phase 3: AI Story Engine
   - Phase 4: Analytics & Scale

2. **Priority** (Single select)
   - 🔴 Critical
   - 🟠 High
   - 🟡 Medium
   - 🟢 Low

3. **Effort** (Single select)
   - XS (1-2 days)
   - S (3-5 days)
   - M (1-2 weeks)
   - L (2-4 weeks)
   - XL (1+ months)

4. **Team** (Single select)
   - Backend
   - Frontend
   - AI/ML
   - DevOps
   - Design

## Views to Create

### 1. **Kanban Board** (Default)
**Columns:**
- 📋 Backlog
- 🔄 In Progress
- 👀 In Review
- ✅ Done

**Grouped by**: Status
**Filtered by**: Phase 1 (for current focus)

### 2. **Phase Timeline**
**Layout**: Timeline view
**Grouped by**: Phase
**Sorted by**: Priority

### 3. **Team Board**
**Layout**: Board
**Grouped by**: Team
**Filtered by**: Status != Done

### 4. **Roadmap Table**
**Layout**: Table
**Columns**: Title, Phase, Priority, Effort, Team, Status
**Sorted by**: Phase, then Priority

## Phase 1 Tasks to Add

### Database & Backend Foundation
- [ ] **Database Schema Design**
  - Phase: Phase 1, Priority: Critical, Effort: M, Team: Backend
  - Design core models: Users, Projects, Chapters, Scenes, Characters, Locations

- [ ] **Authentication System Enhancement**
  - Phase: Phase 1, Priority: High, Effort: S, Team: Backend
  - Extend Better Auth with user profiles, usage tracking, social login

- [ ] **ORPC API Structure**
  - Phase: Phase 1, Priority: High, Effort: M, Team: Backend
  - Design and implement all core API endpoints with type safety

### AI Integration Layer
- [ ] **Multi-Provider AI Service**
  - Phase: Phase 1, Priority: Critical, Effort: L, Team: AI/ML
  - OpenAI, Anthropic, Groq, Local model support

- [ ] **Context Management System**
  - Phase: Phase 1, Priority: High, Effort: M, Team: AI/ML
  - Maintain story context across AI interactions

- [ ] **Usage Tracking & Rate Limiting**
  - Phase: Phase 1, Priority: High, Effort: S, Team: Backend
  - Token counting, user limits, billing preparation

### Frontend Core Features
- [ ] **Rich Text Editor Integration**
  - Phase: Phase 1, Priority: Critical, Effort: L, Team: Frontend
  - TipTap integration with auto-save, formatting, AI assistance UI

- [ ] **Project Management Interface**
  - Phase: Phase 1, Priority: High, Effort: L, Team: Frontend
  - Project dashboard, chapter/scene navigation, file tree

- [ ] **AI Writing Assistant UI**
  - Phase: Phase 1, Priority: High, Effort: M, Team: Frontend
  - AI suggestion panels, context selection, provider switching

### Core User Features
- [ ] **Document Import/Export**
  - Phase: Phase 1, Priority: Medium, Effort: M, Team: Backend
  - DOCX, PDF, Markdown support with format preservation

- [ ] **Real-time Auto-save**
  - Phase: Phase 1, Priority: High, Effort: S, Team: Frontend
  - Conflict resolution, offline support, sync indicators

- [ ] **Basic Collaboration**
  - Phase: Phase 1, Priority: Medium, Effort: M, Team: Backend
  - Project sharing, comment system, basic permissions

## Phase 2+ Tasks (Backlog Items)

### Advanced Planning Tools
- [ ] **Codex Wiki System** (Phase 2, Critical)
- [ ] **Visual Story Canvas** (Phase 2, High) 
- [ ] **Character Arc Visualization** (Phase 2, Medium)
- [ ] **Timeline Management** (Phase 2, Medium)

### AI Story Engine
- [ ] **Full Draft Generation** (Phase 3, Critical)
- [ ] **Plot Hole Detection** (Phase 3, High)
- [ ] **Style Consistency AI** (Phase 3, High)
- [ ] **Plugin Architecture** (Phase 3, Medium)

### Scale & Analytics
- [ ] **Writing Analytics Dashboard** (Phase 4, High)
- [ ] **Mobile Application** (Phase 4, Medium)
- [ ] **Advanced Export Templates** (Phase 4, Medium)
- [ ] **Performance Optimization** (Phase 4, Critical)

## Milestones to Create

1. **MVP Beta Release** (End of Phase 1)
   - All Phase 1 tasks complete
   - 100+ beta users onboarded
   - Core writing + AI features working

2. **Public Launch** (End of Phase 2)
   - Advanced planning tools complete
   - 1000+ registered users
   - Community feedback incorporated

3. **AI Engine Release** (End of Phase 3)
   - Full story generation capabilities
   - Plugin marketplace launched
   - 10k+ active users

4. **Scale & Optimize** (End of Phase 4)
   - Mobile apps released
   - Enterprise features
   - 50k+ users, sustainable revenue

## Setup Instructions

1. **Create the Project**:
   - Go to repository → Projects → New project
   - Choose "Table" layout initially
   - Add custom fields listed above

2. **Import Tasks**:
   - Convert existing issues #1-5 to project items
   - Add remaining Phase 1 tasks manually
   - Set appropriate Phase/Priority/Effort for each

3. **Create Views**:
   - Set up the 4 different views listed above
   - Configure filters and grouping for each view

4. **Set Current Focus**:
   - Filter Kanban view to show only Phase 1 items
   - Move 2-3 highest priority items to "In Progress"
   - Keep remaining Phase 1 items in "Backlog"