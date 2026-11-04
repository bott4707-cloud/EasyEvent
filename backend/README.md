# EASYEVENT backend

The backend is a FastAPI service with SQLite persistence. Password hashes and
opaque server-side sessions are stored in the database; the session identifier
is sent only in an HttpOnly, SameSite=Lax cookie. Worker and Organizer accounts
can self-register. Admin accounts cannot: create the initial Admin by setting
`ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Run locally

Requirements: Python 3.11+ and pip.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`; choose a unique password of at
least 12 characters. Then start the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`; its interactive docs are at
`http://127.0.0.1:8000/docs`. The SQLite database is created next to `main.py`
by default and is excluded from version control.

For production, set `SESSION_COOKIE_SECURE=true`, use HTTPS, use a strong unique
Admin password, and configure `ALLOWED_ORIGINS` for the deployed frontend. Do
not commit `.env` or expose backend environment variables through Vite.

## Access control

- Signup accepts only `worker` and `organizer`; the backend never accepts a
  client-selected Admin role.
- Dashboard data is filtered by role and account ownership.
- Worker shift transitions, Organizer event/request creation, and all Admin
  management routes are authorized on the server.
- Admins can review event status, manage staffing requests, and remove
  Worker/Organizer accounts. Admin accounts remain environment-provisioned.
- The database seeds example events and shifts on first startup.

The frontend proxies `/api` requests to this service during Vite development.
