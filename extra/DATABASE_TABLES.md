# CloudFiles Lite - Database Schema & Tables

> Complete reference for all MongoDB collections, their schemas, indexes, and example documents.

*Updated: January 2026*

---

## Table of Contents

1. [Overview](#overview)
2. [Users Collection](#1-users-collection)
3. [Teams Collection](#2-teams-collection)
4. [TeamMemberships Collection](#3-teammemberships-collection)
5. [Folders Collection](#4-folders-collection)
6. [Files Collection](#5-files-collection)
7. [SavedViews Collection](#6-savedviews-collection)
8. [ShareLinks Collection](#7-sharelinks-collection)
9. [Entity Relationship Diagram](#entity-relationship-diagram)
10. [Seed Data Summary](#seed-data-summary)

---

## Overview

CloudFiles Lite uses **MongoDB** as its database with **Mongoose** as the ODM (Object Document Mapper). The database contains 7 collections:

| Collection | Purpose | Documents |
|------------|---------|-----------|
| `users` | User accounts | 3 |
| `teams` | Organization teams | 2 |
| `teammemberships` | User-Team relationships with roles | 3 |
| `folders` | File organization | 6 |
| `files` | Actual file metadata | 20 |
| `savedviews` | User's saved filter configurations | Dynamic |
| `sharelinks` | Public share tokens for saved views | Dynamic |

---

## 1. Users Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class User {
  _id: ObjectId;           // Auto-generated unique identifier
  email: string;           // Required, unique
  name: string;            // Required
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | Yes (auto) | Yes | MongoDB unique identifier |
| `email` | String | Yes | Yes | User's email address |
| `name` | String | Yes | No | User's display name |
| `createdAt` | Date | Yes (auto) | No | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | No | Last modification timestamp |

### Example Document

```json
{
  "_id": ObjectId("695a30a314f5d2876993f7d1"),
  "email": "alice@example.com",
  "name": "Alice",
  "createdAt": ISODate("2026-01-04T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-04T10:00:00.000Z")
}
```

### Seed Data

| _id | name | email |
|-----|------|-------|
| `695a30a314f5d2876993f7d1` | Alice | alice@example.com |
| `695a30a314f5d2876993f7d3` | Bob | bob@example.com |
| `695a30a314f5d2876993f7d5` | Charlie | charlie@example.com |

---

## 2. Teams Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class Team {
  _id: ObjectId;           // Auto-generated unique identifier
  name: string;            // Required - team name
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `name` | String | Yes | Team display name |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last modification timestamp |

### Example Document

```json
{
  "_id": ObjectId("695a30a314f5d2876993f7d7"),
  "name": "Team A",
  "createdAt": ISODate("2026-01-04T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-04T10:00:00.000Z")
}
```

### Seed Data

| _id | name |
|-----|------|
| `695a30a314f5d2876993f7d7` | Team A |
| `695a30a314f5d2876993f7d9` | Team B |

---

## 3. TeamMemberships Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class TeamMembership {
  _id: ObjectId;           // Auto-generated unique identifier
  userId: ObjectId;        // Reference to User
  teamId: ObjectId;        // Reference to Team
  role: 'OWNER' | 'MEMBER'; // User's role in the team
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `userId` | ObjectId | Yes | Reference to `users._id` |
| `teamId` | ObjectId | Yes | Reference to `teams._id` |
| `role` | Enum | Yes | Either `OWNER` or `MEMBER` |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last modification timestamp |

### Indexes

```javascript
// Compound unique index - one membership per user per team
{ userId: 1, teamId: 1 } // unique: true
```

### Role Permissions

| Role | Description | Can See TEAM Files | Can See OWNER_ONLY Files |
|------|-------------|-------------------|-------------------------|
| `OWNER` | Team administrator | Yes | Yes |
| `MEMBER` | Regular team member | Yes | **No** |

### Example Document

```json
{
  "_id": ObjectId("695a30a314f5d2876993f7db"),
  "userId": ObjectId("695a30a314f5d2876993f7d1"),
  "teamId": ObjectId("695a30a314f5d2876993f7d7"),
  "role": "OWNER",
  "createdAt": ISODate("2026-01-04T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-04T10:00:00.000Z")
}
```

### Seed Data

| userId | teamId | role |
|--------|--------|------|
| Alice (`...f7d1`) | Team A (`...f7d7`) | **OWNER** |
| Bob (`...f7d3`) | Team A (`...f7d7`) | MEMBER |
| Charlie (`...f7d5`) | Team B (`...f7d9`) | MEMBER |

### Visual Representation

```
Team A (695a30a314f5d2876993f7d7)
├── Alice (OWNER) - Can see ALL files
└── Bob (MEMBER) - Can see only TEAM visibility files

Team B (695a30a314f5d2876993f7d9)
└── Charlie (MEMBER) - Can see only TEAM visibility files
```

---

## 4. Folders Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class Folder {
  _id: ObjectId;           // Auto-generated unique identifier
  teamId: ObjectId;        // Reference to Team (owner of folder)
  name: string;            // Folder name
  parentId: ObjectId|null; // Reference to parent Folder (for nesting)
  createdAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `teamId` | ObjectId | Yes | Reference to `teams._id` - which team owns this folder |
| `name` | String | Yes | Folder display name |
| `parentId` | ObjectId | No | Reference to parent `folders._id` for nested folders |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |

### Indexes

```javascript
{ teamId: 1 }  // For listing folders by team
```

### Example Document

```json
{
  "_id": ObjectId("695a30a314f5d2876993f7e1"),
  "teamId": ObjectId("695a30a314f5d2876993f7d7"),
  "name": "Finance",
  "parentId": null,
  "createdAt": ISODate("2026-01-04T10:00:00.000Z")
}
```

### Seed Data

| _id | name | teamId (Team) |
|-----|------|---------------|
| `695a30a314f5d2876993f7e1` | Finance | Team A |
| `695a30a314f5d2876993f7e5` | HR Documents | Team A |
| `695a30a314f5d2876993f7e7` | Projects | Team A |
| `695a30a314f5d2876993f7e3` | General | Team B |
| `695a30a314f5d2876993f7e9` | Marketing | Team B |
| `695a30a314f5d2876993f7eb` | Design Assets | Team B |

---

## 5. Files Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class File {
  _id: ObjectId;           // Auto-generated unique identifier
  teamId: ObjectId;        // Reference to Team
  folderId: ObjectId;      // Reference to Folder
  name: string;            // File name
  type: FileType;          // PDF, DOC, IMG, or OTHER
  sizeBytes: number;       // File size in bytes
  tags: string[];          // Array of tags
  visibility: FileVisibility; // TEAM or OWNER_ONLY
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `teamId` | ObjectId | Yes | Reference to `teams._id` |
| `folderId` | ObjectId | Yes | Reference to `folders._id` |
| `name` | String | Yes | File name with extension |
| `type` | Enum | Yes | `PDF`, `DOC`, `IMG`, or `OTHER` |
| `sizeBytes` | Number | Yes | File size in bytes |
| `tags` | [String] | No | Array of tag strings |
| `visibility` | Enum | Yes | `TEAM` or `OWNER_ONLY` |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last modification timestamp |

### Enums

**FileType:**
| Value | Description |
|-------|-------------|
| `PDF` | PDF documents |
| `DOC` | Word documents, text files |
| `IMG` | Images (PNG, JPG, etc.) |
| `OTHER` | Any other file type (ZIP, etc.) |

**FileVisibility:**
| Value | Who Can See |
|-------|-------------|
| `TEAM` | All team members (OWNER + MEMBER) |
| `OWNER_ONLY` | Only team OWNERs |

### Indexes

```javascript
{ folderId: 1 }           // For listing files in a folder
{ folderId: 1, type: 1 }  // For filtering by type within folder
{ name: 'text' }          // Text search index on file name
```

### Example Document

```json
{
  "_id": ObjectId("695a30a314f5d2876993f801"),
  "teamId": ObjectId("695a30a314f5d2876993f7d7"),
  "folderId": ObjectId("695a30a314f5d2876993f7e1"),
  "name": "budget-2025.pdf",
  "type": "PDF",
  "sizeBytes": 2097152,
  "tags": ["finance", "2025", "budget"],
  "visibility": "OWNER_ONLY",
  "createdAt": ISODate("2026-01-04T10:00:00.000Z"),
  "updatedAt": ISODate("2026-01-04T10:00:00.000Z")
}
```

### Seed Data by Folder

#### Finance Folder (Team A)

| File Name | Type | Size | Visibility | Alice | Bob |
|-----------|------|------|------------|-------|-----|
| budget-2025.pdf | PDF | 2 MB | OWNER_ONLY | Yes | No |
| roadmap.pdf | PDF | 512 KB | TEAM | Yes | Yes |
| expense-report-q4.pdf | PDF | 256 KB | TEAM | Yes | Yes |
| investor-deck-confidential.pdf | PDF | 5 MB | OWNER_ONLY | Yes | No |

#### HR Documents Folder (Team A)

| File Name | Type | Size | Visibility | Alice | Bob |
|-----------|------|------|------------|-------|-----|
| employee-handbook.pdf | PDF | 1 MB | TEAM | Yes | Yes |
| salary-structure-2025.pdf | PDF | 128 KB | OWNER_ONLY | Yes | No |
| org-chart.png | IMG | 512 KB | TEAM | Yes | Yes |

#### Projects Folder (Team A)

| File Name | Type | Size | Visibility | Alice | Bob |
|-----------|------|------|------------|-------|-----|
| project-alpha-plan.doc | DOC | 384 KB | TEAM | Yes | Yes |
| technical-specification.doc | DOC | 768 KB | TEAM | Yes | Yes |
| client-contract-draft.pdf | PDF | 1 MB | OWNER_ONLY | Yes | No |

#### General Folder (Team B)

| File Name | Type | Size | Visibility | Charlie |
|-----------|------|------|------------|---------|
| welcome-guide.pdf | PDF | 256 KB | TEAM | Yes |
| team-meeting-notes.doc | DOC | 64 KB | TEAM | Yes |

#### Marketing Folder (Team B)

| File Name | Type | Size | Visibility | Charlie |
|-----------|------|------|------------|---------|
| brand-guidelines.pdf | PDF | 3 MB | TEAM | Yes |
| campaign-budget-q1.pdf | PDF | 192 KB | OWNER_ONLY | No |
| social-media-plan.doc | DOC | 128 KB | TEAM | Yes |
| product-photos.zip | OTHER | 25 MB | TEAM | Yes |

#### Design Assets Folder (Team B)

| File Name | Type | Size | Visibility | Charlie |
|-----------|------|------|------------|---------|
| logo-primary.png | IMG | 256 KB | TEAM | Yes |
| icon-set-v2.zip | OTHER | 8 MB | TEAM | Yes |
| app-wireframes.png | IMG | 2 MB | TEAM | Yes |
| final-mockups-confidential.png | IMG | 4 MB | OWNER_ONLY | No |

---

## 6. SavedViews Collection

### Schema Definition

```typescript
// Embedded sub-document for filters
@Schema({ _id: false })
export class SavedViewFilters {
  q?: string;              // Search query
  type?: FileType;         // Type filter
  tags?: string[];         // Tags filter
  sort?: 'name' | 'updatedAt';  // Sort field
  order?: 'asc' | 'desc';  // Sort order
}

@Schema({ timestamps: true })
export class SavedView {
  _id: ObjectId;           // Auto-generated unique identifier
  userId: ObjectId;        // Reference to User who created this
  folderId: ObjectId;      // Reference to Folder this view applies to
  name: string;            // View name (max 100 chars)
  filters: SavedViewFilters; // Embedded filter configuration
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `userId` | ObjectId | Yes | Reference to `users._id` - owner of the view |
| `folderId` | ObjectId | Yes | Reference to `folders._id` - which folder this view is for |
| `name` | String | Yes | View name (max 100 characters) |
| `filters` | Object | Yes | Embedded SavedViewFilters object |
| `filters.q` | String | No | Search query string |
| `filters.type` | Enum | No | File type filter |
| `filters.tags` | [String] | No | Tags to filter by |
| `filters.sort` | Enum | No | Sort field (`name` or `updatedAt`) |
| `filters.order` | Enum | No | Sort order (`asc` or `desc`) |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last modification timestamp |

### Indexes

```javascript
{ userId: 1, folderId: 1 }  // For listing views by user and folder
{ userId: 1, name: 1 }      // Unique - no duplicate names per user
```

### Middleware

```typescript
// Cascade delete: When a SavedView is deleted, all its ShareLinks are also deleted
SavedViewSchema.pre('deleteOne', async function() {
  const viewId = this.getFilter()['_id'];
  await ShareLinkModel.deleteMany({ savedViewId: viewId });
});
```

### Example Document

```json
{
  "_id": ObjectId("695a84a4c694288aec46c000"),
  "userId": ObjectId("695a30a314f5d2876993f7d1"),
  "folderId": ObjectId("695a30a314f5d2876993f7e7"),
  "name": "Project Docs Recent",
  "filters": {
    "type": "DOC",
    "sort": "updatedAt",
    "order": "desc"
  },
  "createdAt": ISODate("2026-01-04T15:17:56.237Z"),
  "updatedAt": ISODate("2026-01-04T15:17:56.237Z")
}
```

### Example Use Cases

| View Name | Folder | Filters | Purpose |
|-----------|--------|---------|---------|
| "Finance PDFs" | Finance | `type: PDF, sort: name` | Show only PDFs sorted alphabetically |
| "HR Handbook Search" | HR Docs | `q: "handbook"` | Search for handbook documents |
| "Recent Images" | Design | `type: IMG, sort: updatedAt, order: desc` | Latest images first |

---

## 7. ShareLinks Collection

### Schema Definition

```typescript
@Schema({ timestamps: true })
export class ShareLink {
  _id: ObjectId;           // Auto-generated unique identifier
  token: string;           // Unique share token (nanoid, 21 chars)
  savedViewId: ObjectId;   // Reference to SavedView being shared
  createdBy: ObjectId;     // Reference to User who created the link
  expiresAt: Date | null;  // Expiration timestamp (null = never expires)
  createdAt: Date;         // Auto-generated
  updatedAt: Date;         // Auto-generated
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes (auto) | MongoDB unique identifier |
| `token` | String | Yes | Unique 21-character token (nanoid) |
| `savedViewId` | ObjectId | Yes | Reference to `savedviews._id` |
| `createdBy` | ObjectId | Yes | Reference to `users._id` who created this link |
| `expiresAt` | Date | No | When the link expires (null = never) |
| `createdAt` | Date | Yes (auto) | Document creation timestamp |
| `updatedAt` | Date | Yes (auto) | Last modification timestamp |

### Indexes

```javascript
{ token: 1 }        // unique: true - for fast token lookups
{ savedViewId: 1 }  // For listing all links for a view
{ createdBy: 1 }    // For listing all links created by a user
```

### Token Generation

```typescript
import { nanoid } from 'nanoid';
const token = nanoid(21);  // e.g., "V1StGXR8_Z5jdHi6B-myT"
// 21 characters = 126 bits of entropy
// URL-safe characters: A-Za-z0-9_-
```

### Example Document

```json
{
  "_id": ObjectId("695d0901a496fe0d1797584f"),
  "token": "V1StGXR8_Z5jdHi6B-myT",
  "savedViewId": ObjectId("695a84a4c694288aec46c000"),
  "createdBy": ObjectId("695a30a314f5d2876993f7d1"),
  "expiresAt": ISODate("2026-01-07T13:07:13.220Z"),
  "createdAt": ISODate("2026-01-06T13:07:13.205Z"),
  "updatedAt": ISODate("2026-01-06T13:07:13.205Z")
}
```

### Share Link URL

```
Frontend URL: http://localhost:4200/shared/{token}
Example: http://localhost:4200/shared/V1StGXR8_Z5jdHi6B-myT
```

### Expiration Options

| Option | expiresAt Value |
|--------|-----------------|
| Never expires | `null` |
| 1 hour | `now + 1 hour` |
| 24 hours | `now + 24 hours` |
| 7 days | `now + 168 hours` |
| 30 days | `now + 720 hours` |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFILES LITE ERD                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│    USERS     │         │  TEAMMEMBERSHIPS │         │    TEAMS     │
├──────────────┤         ├──────────────────┤         ├──────────────┤
│ _id (PK)     │◄───────┤│ userId (FK)      │────────►│ _id (PK)     │
│ email        │         │ teamId (FK)      │         │ name         │
│ name         │         │ role             │         │ createdAt    │
│ createdAt    │         │ createdAt        │         │ updatedAt    │
│ updatedAt    │         │ updatedAt        │         └──────────────┘
└──────────────┘         └──────────────────┘                │
       │                                                      │
       │                                                      │
       │         ┌──────────────┐         ┌──────────────┐   │
       │         │   FOLDERS    │         │    FILES     │   │
       │         ├──────────────┤         ├──────────────┤   │
       │         │ _id (PK)     │◄───────┤│ folderId (FK)│   │
       │         │ teamId (FK)  │────────►│ teamId (FK)  │───┘
       │         │ name         │         │ name         │
       │         │ parentId(FK) │─────┐   │ type         │
       │         │ createdAt    │     │   │ sizeBytes    │
       │         └──────────────┘     │   │ tags[]       │
       │                │             │   │ visibility   │
       │                └─────────────┘   │ createdAt    │
       │                                  │ updatedAt    │
       │                                  └──────────────┘
       │
       │         ┌──────────────┐         ┌──────────────┐
       │         │  SAVEDVIEWS  │         │  SHARELINKS  │
       │         ├──────────────┤         ├──────────────┤
       └────────►│ userId (FK)  │◄───────┤│savedViewId(FK)│
                 │ folderId (FK)│         │ createdBy(FK)│────► USERS
                 │ name         │         │ token        │
                 │ filters {}   │         │ expiresAt    │
                 │ createdAt    │         │ createdAt    │
                 │ updatedAt    │         │ updatedAt    │
                 └──────────────┘         └──────────────┘
                        │
                        │ CASCADE DELETE
                        ▼
                 (ShareLinks deleted when SavedView deleted)
```

### Relationships Summary

| From | To | Type | Description |
|------|-----|------|-------------|
| TeamMembership | User | Many-to-One | Each membership belongs to one user |
| TeamMembership | Team | Many-to-One | Each membership belongs to one team |
| Folder | Team | Many-to-One | Each folder belongs to one team |
| Folder | Folder | Self-reference | Folders can have parent folders |
| File | Folder | Many-to-One | Each file is in one folder |
| File | Team | Many-to-One | Each file belongs to one team |
| SavedView | User | Many-to-One | Each view is owned by one user |
| SavedView | Folder | Many-to-One | Each view is for one folder |
| ShareLink | SavedView | Many-to-One | Each link shares one view |
| ShareLink | User | Many-to-One | Each link is created by one user |

---

## Seed Data Summary

### Statistics

| Collection | Count |
|------------|-------|
| Users | 3 |
| Teams | 2 |
| TeamMemberships | 3 |
| Folders | 6 |
| Files | 20 |
| SavedViews | Dynamic (user-created) |
| ShareLinks | Dynamic (user-created) |

### OWNER_ONLY Files (Restricted Access)

| # | File Name | Folder | Team | Only Visible To |
|---|-----------|--------|------|-----------------|
| 1 | budget-2025.pdf | Finance | Team A | Alice (OWNER) |
| 2 | investor-deck-confidential.pdf | Finance | Team A | Alice (OWNER) |
| 3 | salary-structure-2025.pdf | HR Documents | Team A | Alice (OWNER) |
| 4 | client-contract-draft.pdf | Projects | Team A | Alice (OWNER) |
| 5 | campaign-budget-q1.pdf | Marketing | Team B | (No OWNER in seed) |
| 6 | final-mockups-confidential.png | Design Assets | Team B | (No OWNER in seed) |

### Permission Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERMISSION MATRIX                           │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Visibility    │     OWNER       │          MEMBER             │
├─────────────────┼─────────────────┼─────────────────────────────┤
│     TEAM        │    ✅ CAN SEE   │         ✅ CAN SEE          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│   OWNER_ONLY    │    ✅ CAN SEE   │         ❌ CANNOT SEE       │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Test Commands

```bash
# Seed the database
curl -X POST http://localhost:3000/api/dev/seed

# List all users
curl -s http://localhost:3000/api/users | jq

# Get Alice's accessible folders (Team A folders)
curl -s -H "x-user-id: 695a30a314f5d2876993f7d1" \
  http://localhost:3000/api/folders | jq

# Get files in Finance folder as Alice (OWNER - sees all 4 files)
curl -s -H "x-user-id: 695a30a314f5d2876993f7d1" \
  "http://localhost:3000/api/folders/695a30a314f5d2876993f7e1/files" | jq

# Get files in Finance folder as Bob (MEMBER - sees only 2 TEAM files)
curl -s -H "x-user-id: 695a30a314f5d2876993f7d3" \
  "http://localhost:3000/api/folders/695a30a314f5d2876993f7e1/files" | jq

# Create a saved view
curl -s -X POST http://localhost:3000/api/saved-views \
  -H "Content-Type: application/json" \
  -H "x-user-id: 695a30a314f5d2876993f7d1" \
  -d '{"name":"My PDFs","folderId":"695a30a314f5d2876993f7e1","filters":{"type":"PDF"}}' | jq

# Create a share link for a saved view
curl -s -X POST http://localhost:3000/api/saved-views/{viewId}/share \
  -H "Content-Type: application/json" \
  -H "x-user-id: 695a30a314f5d2876993f7d1" \
  -d '{"expiresInHours": 24}' | jq
```

---

*Generated: January 2026*
