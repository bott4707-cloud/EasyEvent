# EASYEVENT Backend (Node.js & Supabase)

The backend is a Node.js Express service powered by Supabase. It supports secure session-based authentication, role-based access control (Worker, Organizer, Admin), and full CRUD for events, shifts, and staffing requests.

## Tech Stack
- **Runtime**: Node.js 20+ / 24+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **Authentication**: Secure HttpOnly cookies with scrypt password hashing & SHA-256 session tokens

## Supabase Database Setup

1. Create a project at [Supabase](https://supabase.com).
2. Go to your project's **SQL Editor** (`/sql`).
3. Copy and run the SQL script from `backend/supabase-schema.sql`. This creates:
   - `users` (Workers, Organizers, Admins)
   - `events` (Bengaluru event listings with crew staffing counts)
   - `shifts` (Worker shift assignments and progression)
   - `staffing_requests` (Organizer extra crew dispatch requests)
   - `sessions` (Session tokens)
   - Row Level Security (RLS) policies and performance indexes
4. Go to **Project Settings** → **API** to copy your:
   - `Project URL`
   - `anon public` key
   - `service_role` key (keep secret)

## Local Configuration

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Paste your Supabase credentials in `.env`:
   ```env
   PORT=8000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   > **Note**: If `SUPABASE_URL` is omitted or empty, the backend automatically runs in **Local Fallback Mode** with seed data so you can test immediately without any setup.

3. Install dependencies and start the backend:
   ```powershell
   cd backend
   npm.cmd install
   npm.cmd start
   ```
   For auto-reload during development:
   ```powershell
   npm.cmd run dev
   ```

## REST API Endpoints
- `GET /api/health` — Health check & database connection status
- `GET /api/events/public` — Published Bengaluru events for public browsing
- `POST /api/auth/signup` — Register as `worker` or `organizer`
- `POST /api/auth/login` — Sign in to active workspace
- `GET /api/auth/me` — Current authenticated session state
- `POST /api/auth/logout` — End session
- `GET /api/state` — Real-time state filtered by role
- `PATCH /api/worker/shifts/:id` — Advance shift status (`Assigned` → `Accepted` → `Reporting` → `Completed`)
- `PATCH /api/worker/availability` — Update 7-day availability roster
- `POST /api/organizer/events` — Create and publish event with crew quota
- `POST /api/organizer/requests` — Dispatch staffing crew request
- `PATCH /api/organizer/requests/:id` — Cancel / withdraw staffing request
- `PATCH /api/admin/events/:id` / `DELETE` — Admin approval & deletion
- `PATCH /api/admin/requests/:id` — Admin staffing approval
- `DELETE /api/admin/users/:id` — Admin account management
