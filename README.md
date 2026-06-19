# Team Task Tracker

A small full-stack web application for managing tasks across engineering teams. Built as a TypeScript monorepo with a Node.js API and a React frontend.

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| API | Node.js 22 + Express + TypeScript |
| Database | SQLite (via better-sqlite3) |
| Frontend | React 18 + Vite + TypeScript |
| Shared types | `packages/shared` workspace package |
| Tests | Vitest + Supertest |

## Features

- Simple mock login (no external auth provider required)
- Team-scoped project and task management
- Kanban-style task board (To Do / In Progress / Done / Cancelled)
- Task fields: title, description, status, priority, assignee, due date
- Admin audit log showing recent activity

## Requirements

- Node.js >= 22
- pnpm >= 9

## Installation

```bash
pnpm install
```

## Running locally

Start both the API and the web dev server in parallel:

```bash
pnpm dev
```

- API: http://localhost:3001
- Web: http://localhost:5173

The database is created automatically on first run and seeded with sample teams, users, projects, and tasks.

**Demo credentials:**

| Email | Password | Team | Role |
|---|---|---|---|
| alice@example.com | password123 | Alpha Squad | admin |
| bob@example.com | password123 | Alpha Squad | member |
| carol@example.com | password123 | Beta Team | admin |
| dave@example.com | password123 | Beta Team | member |

## Available scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start API and web in parallel (watch mode) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit/integration tests (API) |
| `pnpm typecheck` | TypeScript type check (web) |
| `pnpm lint` | ESLint across all app source files |

## Project structure

```
.
├── apps/
│   ├── api/          Node.js Express API
│   └── web/          React + Vite frontend
├── packages/
│   └── shared/       Shared TypeScript types and validation helpers
├── pnpm-workspace.yaml
└── package.json
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/auth/login | Authenticate and receive a JWT |
| POST | /api/auth/logout | Invalidate session (client-side) |
| GET | /api/projects | List projects for the current team |
| GET | /api/projects/:id | Get a single project |
| GET | /api/projects/:id/tasks | List tasks for a project |
| POST | /api/projects/:id/tasks | Create a task |
| PUT | /api/projects/:id/tasks/:taskId | Update a task |
| DELETE | /api/projects/:id/tasks/:taskId | Delete a task |
| GET | /api/audit | Audit log (admin only) |
| GET | /api/users/team-members | List members of the authenticated user's team |
