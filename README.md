# CloudFiles Lite

A file management application built with an Nx monorepo, NestJS backend, and React frontend.

## Project Overview

CloudFiles Lite is a simplified file management system with:

- **Users** belonging to **Teams** with roles (OWNER or MEMBER)
- **Folders** belonging to Teams
- **Files** inside folders with visibility rules:
  - `TEAM`: visible to any team member
  - `OWNER_ONLY`: visible only to team OWNERs

## Monorepo Structure

```
├── apps/
│   ├── api/          # NestJS backend API
│   └── web/          # React frontend (Vite)
├── libs/
│   ├── contracts/    # Shared DTO types + Zod schemas (source of truth)
│   ├── permissions/  # Shared permission logic
│   ├── api-client/   # Typed API client for frontend
│   ├── data-access/  # Mongoose models + Redis cache (backend-only)
│   ├── test-support/ # Seed helpers/factories
│   └── ui/           # Shared React components
```

## Prerequisites

- Node.js 20+
- MongoDB (local or Docker)
- Redis (local or Docker)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Default configuration:

```
MONGODB_URI=mongodb://localhost:27017/cloudfiles-lite
REDIS_URL=redis://localhost:6379
PORT=3000
```

### 3. Start MongoDB and Redis

Using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo
docker run -d -p 6379:6379 --name redis redis
```

Or use your local installations.

### 4. Start the Applications

Start both API and web:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:api  # Backend at http://localhost:3000
npm run dev:web  # Frontend at http://localhost:4200
```

### 5. Seed the Database

With the API running:

```bash
npm run seed
# or
curl -X POST http://localhost:3000/api/dev/seed
```

This creates:

- **Users**: Alice (Team A OWNER), Bob (Team A MEMBER), Charlie (Team B MEMBER)
- **Teams**: Team A, Team B
- **Folders**: Finance, HR Documents, Projects (Team A), General, Marketing, Design Assets (Team B)
- **Files**: 20 files with varying visibility (TEAM or OWNER_ONLY)

## API Endpoints

### Authentication

All endpoints require `x-user-id` header for authentication.

### Implemented

- `GET /api/users` - List all users
- `GET /api/me` - Get current user with memberships
- `GET /api/folders` - List folders for current user
- `GET /api/folders/:id/files` - List files in folder (with search/filter/sort)
- `POST /api/dev/seed` - Seed database (dev only)
- `POST /api/dev/flush-cache` - Flush Redis cache (dev only)

## Scripts

```bash
npm run dev         # Run both API and web
npm run dev:api     # Run API only
npm run dev:web     # Run web only
npm run build       # Build all projects
npm run seed        # Seed database
npm run lint        # Lint all projects
```

## Candidate Tasks

### Task 1: Find and Fix the Bug

There is a **bug** in this codebase that causes a permission leak under certain conditions.

**Expected Behavior:**

- Alice (OWNER) can see all files in Finance folder
- Bob (MEMBER) should only see expense-report and roadmap files

**To Reproduce:**

1. Start fresh
2. Switch to Alice, open Finance folder - note the files you see
3. Switch to Bob, open Finance folder - note the files you see
4. Compare what Bob sees vs what he should see based on visibility rules

Your task is to find and fix the bug.

### Task 2: Implement Saved Views Feature

Implement a "Saved Views" feature that allows users to save their current folder view configuration (filters, search query, sort order) for quick access later.

**Requirements:**

- Users can save a view with a name for a specific folder
- Views store the current filters (type, search query, sort field/order)
- Users can list their saved views
- Users can load a saved view to restore the filters
- Users can delete saved views they no longer need
- Views are private to the user who created them

**Hints:**

- Follow the patterns established in the existing codebase
- Consider where to store the saved views data

### Task 3: Implement Share Links Feature

Generate shareable links for saved views that allow other users to access a read-only version.

**Requirements:**

- Users can generate a shareable link for any of their saved views
- Links use token-based access (random unique token in URL)
- Links support optional expiry (`expiresAt` timestamp)
- Shared views are read-only (enforced at API layer)
- Anyone with the link can access the view (no authentication required)
- Expired links return an appropriate error

**Hints:**

- Consider how tokens should be generated and validated
- Think about what data the shared view endpoint should return

## Technology Stack

- **Backend**: NestJS, Mongoose, ioredis
- **Frontend**: React, TanStack Query, React Router
- **Database**: MongoDB
- **Cache**: Redis
- **Build**: Nx, Vite, Webpack
- **Validation**: Zod
