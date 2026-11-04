# EASYEVENT frontend

The frontend is a React and TypeScript single-page application built with Vite.

## Requirements

- Node.js 20.19+ or 22.12+
- Python 3.11+
- npm

## Run locally

Start the backend in one PowerShell terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before starting.
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Start the frontend in another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Create a production build with `npm.cmd run build`, or serve the build locally
with `npm.cmd run preview`.

The VS Code tasks include dependency installation, starting the dev server, and
building the frontend (`Terminal` → `Run Task`).

The Worker, Organizer, and Admin dashboards use the FastAPI backend and SQLite
database. Worker and Organizer accounts can be created through the app; Admin
accounts are provisioned only through backend environment settings. Enquiry
forms open an email draft to `hello@easyevent.in`; the app does not send or
store enquiry form details.

## Project layout

- `src/components/` — separate Worker, Organizer, and Admin dashboard files
- `src/` — React UI, API client, sample data, and styles
- `index.html`, `vite.config.ts`, `tsconfig*.json` — Vite and TypeScript setup
- `package.json` — frontend dependencies and scripts

Backend code and backend-only configuration belong in the sibling `../backend`
directory, not in this frontend.

The workspace root contains the single `.gitignore` for frontend, backend, and
local development files. Nested ignore files are intentionally not used.