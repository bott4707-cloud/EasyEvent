from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

Role = Literal["worker", "organizer", "admin"]
ShiftStatus = Literal["Assigned", "Accepted", "Reporting", "Completed", "Cancelled"]
RequestStatus = Literal["Pending", "Approved", "Rejected", "Cancelled"]
EventStatus = Literal["Pending approval", "Published", "Rejected"]
SESSION_COOKIE = "easyevent_session"
SESSION_TTL = timedelta(days=7)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
DEFAULT_DATABASE = Path(__file__).with_name("easyevent.sqlite3")
DUTIES = (
    "Registration & check-in",
    "Ushering",
    "Guest relations",
    "Setup & teardown",
    "Catering support",
    "AV & technical support",
    "Stagehand support",
    "Crowd guidance",
    "Cleanup",
)

SEED_EVENTS = (
    ("city-lights", "City Lights Cultural Night", "Palace Grounds", "Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006", "2026-11-14", "16:00", "Ushering", 28, 16, "Published"),
    ("makers-market", "The Makers Weekend", "Whitefield Convention Centre", "Whitefield Main Road, Bengaluru, Karnataka 560066", "2026-11-28", "08:00", "Guest relations", 18, 10, "Published"),
    ("food-stories", "Food Stories Festival", "Jayamahal Palace", "Jayamahal Road, Bengaluru, Karnataka", "2026-12-12", "11:00", "Catering support", 22, 15, "Published"),
    ("design-meet", "Design & Ideas Forum", "BIEC Convention Centre", "Bengaluru, Karnataka", "2027-01-09", "09:00", "AV & technical support", 14, 8, "Published"),
    ("community-run", "Good Morning Bengaluru Run", "Cubbon Park", "Kasturba Road, Bengaluru, Karnataka 560001", "2026-11-22", "05:30", "Crowd guidance", 16, 12, "Published"),
    ("winter-conference", "Bengaluru Business Exchange", "Bengaluru International Exhibition Centre", "Bengaluru, Karnataka", "2026-12-19", "07:30", "Registration & check-in", 32, 19, "Published"),
)

SEED_SHIFTS = (
    ("worker-city-lights", "City Lights Cultural Night", "Palace Grounds", "Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006", "2026-11-14", "4:00 PM", "10:00 PM", "Ushering", "Shared after confirmation", "Assigned"),
    ("worker-makers-market", "The Makers Weekend", "KTPO Convention Centre", "Whitefield Main Road, Bengaluru, Karnataka 560066", "2026-11-28", "8:00 AM", "3:00 PM", "Guest relations", "Shared after confirmation", "Assigned"),
    ("worker-community-run", "Good Morning Bengaluru Run", "Cubbon Park", "Kasturba Road, Bengaluru, Karnataka 560001", "2026-10-18", "5:30 AM", "10:00 AM", "Guest relations", "Shared after confirmation", "Completed"),
)


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class Signup(Credentials):
    name: str = Field(min_length=1, max_length=100)
    role: Literal["worker", "organizer"]


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    venue: str = Field(min_length=1, max_length=150)
    date: str
    time: str
    duty: str = Field(min_length=1, max_length=80)
    required: int = Field(ge=1, le=5000)


class RequestCreate(BaseModel):
    eventId: str
    quantity: int = Field(ge=1, le=500)
    duty: str = Field(min_length=1, max_length=80)


class AvailabilityUpdate(BaseModel):
    available: bool | None = None
    availableDates: list[str] | None = Field(default=None, max_length=31)


class ShiftUpdate(BaseModel):
    status: ShiftStatus


class EventUpdate(BaseModel):
    status: EventStatus | None = None
    title: str | None = Field(default=None, min_length=1, max_length=150)
    venue: str | None = Field(default=None, min_length=1, max_length=150)
    date: str | None = None
    time: str | None = None
    duty: str | None = Field(default=None, min_length=1, max_length=80)
    required: int | None = Field(default=None, ge=1, le=5000)
    assigned: int | None = Field(default=None, ge=0, le=5000)


class RequestUpdate(BaseModel):
    status: RequestStatus


def password_hash(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return salt.hex(), digest.hex()


def password_matches(password: str, salt_hex: str, digest_hex: str) -> bool:
    try:
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except ValueError:
        return False
    actual = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1, dklen=32)
    return hmac.compare_digest(actual, expected)


def parse_iso_date(value: str) -> date:
    try:
        return date.fromisoformat(value)
    except ValueError as error:
        raise HTTPException(status_code=422, detail="Use a valid YYYY-MM-DD date.") from error


def validate_email(email: str) -> str:
    normalized = email.strip().lower()
    if not EMAIL_PATTERN.fullmatch(normalized):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return normalized


def public_user(row: sqlite3.Row) -> dict[str, str]:
    return {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}


def event_json(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"], "title": row["title"], "venue": row["venue"],
        "address": row["address"], "date": row["date"], "time": row["time"],
        "duty": row["duty"], "required": row["required"], "assigned": row["assigned"],
        "status": row["status"],
    }


def request_json(row: sqlite3.Row) -> dict[str, object]:
    return {
        "id": row["id"], "eventId": row["event_id"], "quantity": row["quantity"],
        "duty": row["duty"], "status": row["status"], "createdAt": row["created_at"],
    }


def shift_json(row: sqlite3.Row) -> dict[str, str]:
    return {
        "id": row["id"], "title": row["title"], "venue": row["venue"],
        "address": row["address"], "date": row["date"], "reporting": row["reporting"],
        "endTime": row["end_time"], "duty": row["duty"],
        "supervisor": row["supervisor"], "status": row["status"],
    }


def create_app(
    database_path: Path | None = None,
    admin_email: str | None = None,
    admin_password: str | None = None,
    cookie_secure: bool | None = None,
) -> FastAPI:
    db_path = database_path or Path(os.environ.get("DATABASE_PATH", str(DEFAULT_DATABASE)))
    configured_admin_email = admin_email if admin_email is not None else os.environ.get("ADMIN_EMAIL", "")
    configured_admin_password = admin_password if admin_password is not None else os.environ.get("ADMIN_PASSWORD", "")
    secure_cookie = cookie_secure if cookie_secure is not None else os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
    allowed_origins = {
        item.strip()
        for item in os.environ.get(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173",
        ).split(",")
        if item.strip()
    }

    def connect() -> sqlite3.Connection:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    def initialize_database() -> None:
        if bool(configured_admin_email) != bool(configured_admin_password):
            raise RuntimeError("Set both ADMIN_EMAIL and ADMIN_PASSWORD to provision the Admin account.")
        if configured_admin_email and (len(configured_admin_password) < 12 or len(configured_admin_password) > 128):
            raise RuntimeError("ADMIN_PASSWORD must be between 12 and 128 characters.")
        with connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    role TEXT NOT NULL CHECK (role IN ('worker', 'organizer', 'admin')),
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    available INTEGER NOT NULL DEFAULT 0,
                    available_dates TEXT NOT NULL DEFAULT '[]'
                );
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    venue TEXT NOT NULL,
                    address TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    duty TEXT NOT NULL,
                    required INTEGER NOT NULL CHECK (required BETWEEN 1 AND 5000),
                    assigned INTEGER NOT NULL DEFAULT 0 CHECK (assigned >= 0),
                    status TEXT NOT NULL CHECK (status IN ('Pending approval', 'Published', 'Rejected')),
                    owner_id TEXT REFERENCES users(id) ON DELETE SET NULL
                );
                CREATE TABLE IF NOT EXISTS staffing_requests (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                    organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 500),
                    duty TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
                    created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS shifts (
                    id TEXT PRIMARY KEY,
                    worker_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    title TEXT NOT NULL,
                    venue TEXT NOT NULL,
                    address TEXT NOT NULL,
                    date TEXT NOT NULL,
                    reporting TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    duty TEXT NOT NULL,
                    supervisor TEXT NOT NULL,
                    status TEXT NOT NULL CHECK (status IN ('Assigned', 'Accepted', 'Reporting', 'Completed', 'Cancelled'))
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_events_owner ON events(owner_id);
                CREATE INDEX IF NOT EXISTS idx_requests_organizer ON staffing_requests(organizer_id);
                CREATE INDEX IF NOT EXISTS idx_shifts_worker ON shifts(worker_id);
                CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
                """
            )
            if connection.execute("SELECT COUNT(*) FROM events").fetchone()[0] == 0:
                connection.executemany(
                    """INSERT INTO events
                    (id, title, venue, address, date, time, duty, required, assigned, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    SEED_EVENTS,
                )
            if connection.execute("SELECT COUNT(*) FROM shifts").fetchone()[0] == 0:
                connection.executemany(
                    """INSERT INTO shifts
                    (id, title, venue, address, date, reporting, end_time, duty, supervisor, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    SEED_SHIFTS,
                )
            if configured_admin_email:
                normalized_email = validate_email(configured_admin_email)
                existing = connection.execute(
                    "SELECT id, role FROM users WHERE email = ?", (normalized_email,)
                ).fetchone()
                if existing and existing["role"] != "admin":
                    raise RuntimeError("ADMIN_EMAIL already belongs to a non-Admin account.")
                if not existing:
                    salt, digest = password_hash(configured_admin_password)
                    connection.execute(
                        """INSERT INTO users (id, name, email, role, password_salt, password_hash)
                        VALUES (?, ?, ?, 'admin', ?, ?)""",
                        (f"admin-{uuid.uuid4()}", "Administrator", normalized_email, salt, digest),
                    )

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        initialize_database()
        yield

    app = FastAPI(title="EASYEVENT API", version="1.0.0", lifespan=lifespan)

    @app.middleware("http")
    async def verify_browser_origin(request: Request, call_next):
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin")
            if origin and origin not in allowed_origins:
                return Response(status_code=status.HTTP_403_FORBIDDEN, content="Untrusted request origin.")
        return await call_next(request)

    def get_current_user(request: Request) -> sqlite3.Row:
        token = request.cookies.get(SESSION_COOKIE)
        if not token:
            raise HTTPException(status_code=401, detail="Sign in to continue.")
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        now = int(datetime.now(timezone.utc).timestamp())
        with connect() as connection:
            row = connection.execute(
                """SELECT users.* FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token_hash = ? AND sessions.expires_at > ?""",
                (token_hash, now),
            ).fetchone()
        if row is None:
            raise HTTPException(status_code=401, detail="Your session expired. Sign in again.")
        return row

    def require_role(user: sqlite3.Row, *roles: str) -> None:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")

    def create_session(user_id: str, response: Response) -> None:
        token = secrets.token_urlsafe(32)
        expires_at = int((datetime.now(timezone.utc) + SESSION_TTL).timestamp())
        with connect() as connection:
            connection.execute(
                "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                (hashlib.sha256(token.encode("utf-8")).hexdigest(), user_id, expires_at),
            )
        response.set_cookie(
            SESSION_COOKIE,
            token,
            max_age=int(SESSION_TTL.total_seconds()),
            httponly=True,
            secure=secure_cookie,
            samesite="lax",
            path="/",
        )

    def dashboard_state(user: sqlite3.Row) -> dict[str, object]:
        role = user["role"]
        with connect() as connection:
            if role == "admin":
                users = [public_user(row) for row in connection.execute(
                    "SELECT id, name, email, role FROM users ORDER BY name COLLATE NOCASE"
                )]
                events = [event_json(row) for row in connection.execute("SELECT * FROM events ORDER BY date, time")]
                requests = [request_json(row) for row in connection.execute(
                    "SELECT * FROM staffing_requests ORDER BY created_at DESC"
                )]
                shifts = [shift_json(row) for row in connection.execute("SELECT * FROM shifts ORDER BY date")]
            elif role == "organizer":
                users = []
                events = [event_json(row) for row in connection.execute(
                    "SELECT * FROM events WHERE owner_id = ? OR owner_id IS NULL ORDER BY date, time",
                    (user["id"],),
                )]
                requests = [request_json(row) for row in connection.execute(
                    "SELECT * FROM staffing_requests WHERE organizer_id = ? ORDER BY created_at DESC",
                    (user["id"],),
                )]
                shifts = []
            else:
                users = []
                events = [event_json(row) for row in connection.execute(
                    "SELECT * FROM events WHERE status = 'Published' ORDER BY date, time"
                )]
                requests = []
                shifts = [shift_json(row) for row in connection.execute(
                    "SELECT * FROM shifts WHERE worker_id = ? OR worker_id IS NULL ORDER BY date",
                    (user["id"],),
                )]
        available_dates = json.loads(user["available_dates"])
        return {
            "user": public_user(user),
            "data": {
                "users": users,
                "events": events,
                "requests": requests,
                "shifts": shifts,
                "available": bool(user["available"]),
                "availableDates": available_dates,
            },
        }

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/events/public")
    def public_events() -> list[dict[str, object]]:
        with connect() as connection:
            rows = connection.execute(
                "SELECT * FROM events WHERE status = 'Published' ORDER BY date, time"
            ).fetchall()
        return [event_json(row) for row in rows]

    @app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
    def signup(payload: Signup, response: Response) -> dict[str, object]:
        email = validate_email(payload.email)
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=422, detail="Enter your full name.")
        salt, digest = password_hash(payload.password)
        user_id = f"account-{uuid.uuid4()}"
        try:
            with connect() as connection:
                connection.execute(
                    """INSERT INTO users (id, name, email, role, password_salt, password_hash)
                    VALUES (?, ?, ?, ?, ?, ?)""",
                    (user_id, name, email, payload.role, salt, digest),
                )
                user = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        except sqlite3.IntegrityError as error:
            raise HTTPException(status_code=409, detail="An account already exists for this email.") from error
        create_session(user_id, response)
        return dashboard_state(user)

    @app.post("/api/auth/login")
    def login(payload: Credentials, response: Response) -> dict[str, object]:
        email = validate_email(payload.email)
        with connect() as connection:
            user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user is None or not password_matches(payload.password, user["password_salt"], user["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        create_session(user["id"], response)
        return dashboard_state(user)

    @app.get("/api/auth/me")
    def current_session(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        return dashboard_state(user)

    @app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
    def logout(request: Request, response: Response) -> Response:
        token = request.cookies.get(SESSION_COOKIE)
        if token:
            with connect() as connection:
                connection.execute(
                    "DELETE FROM sessions WHERE token_hash = ?",
                    (hashlib.sha256(token.encode("utf-8")).hexdigest(),),
                )
        response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=secure_cookie, samesite="lax")
        response.status_code = status.HTTP_204_NO_CONTENT
        return response

    @app.get("/api/state")
    def get_state(user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        return dashboard_state(user)

    @app.post("/api/organizer/events", status_code=status.HTTP_201_CREATED)
    def create_event(payload: EventCreate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "organizer")
        if payload.duty not in DUTIES:
            raise HTTPException(status_code=422, detail="Choose a supported event duty.")
        parsed_date = parse_iso_date(payload.date)
        if parsed_date < date.today():
            raise HTTPException(status_code=422, detail="Choose today or a future event date.")
        if not re.fullmatch(r"\d{2}:\d{2}", payload.time):
            raise HTTPException(status_code=422, detail="Use a valid 24-hour event time.")
        title, venue = payload.title.strip(), payload.venue.strip()
        if not title or not venue:
            raise HTTPException(status_code=422, detail="Enter an event name and venue.")
        event_id = f"event-{uuid.uuid4()}"
        with connect() as connection:
            connection.execute(
                """INSERT INTO events
                (id, title, venue, address, date, time, duty, required, assigned, status, owner_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'Pending approval', ?)""",
                (event_id, title, venue, f"{venue}, Bengaluru, Karnataka", payload.date, payload.time, payload.duty, payload.required, user["id"]),
            )
            event = connection.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        return event_json(event)

    @app.post("/api/organizer/requests", status_code=status.HTTP_201_CREATED)
    def create_request(payload: RequestCreate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "organizer")
        request_id = f"request-{uuid.uuid4()}"
        with connect() as connection:
            event = connection.execute(
                "SELECT id FROM events WHERE id = ? AND (owner_id = ? OR owner_id IS NULL)",
                (payload.eventId, user["id"]),
            ).fetchone()
            if event is None:
                raise HTTPException(status_code=404, detail="Choose an event you can manage.")
            if payload.duty not in DUTIES:
                raise HTTPException(status_code=422, detail="Choose a supported event duty.")
            connection.execute(
                """INSERT INTO staffing_requests
                (id, event_id, organizer_id, quantity, duty, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?)""",
                (request_id, payload.eventId, user["id"], payload.quantity, payload.duty, date.today().isoformat()),
            )
            row = connection.execute("SELECT * FROM staffing_requests WHERE id = ?", (request_id,)).fetchone()
        return request_json(row)

    @app.patch("/api/organizer/requests/{request_id}")
    def cancel_request(request_id: str, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "organizer")
        with connect() as connection:
            result = connection.execute(
                """UPDATE staffing_requests SET status = 'Cancelled'
                WHERE id = ? AND organizer_id = ? AND status = 'Pending'""",
                (request_id, user["id"]),
            )
            if result.rowcount != 1:
                raise HTTPException(status_code=404, detail="Pending staffing request not found.")
            row = connection.execute("SELECT * FROM staffing_requests WHERE id = ?", (request_id,)).fetchone()
        return request_json(row)

    @app.patch("/api/worker/shifts/{shift_id}")
    def update_shift(shift_id: str, payload: ShiftUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, str]:
        require_role(user, "worker")
        transitions = {
            "Assigned": {"Accepted"},
            "Accepted": {"Reporting"},
            "Reporting": {"Completed"},
        }
        with connect() as connection:
            row = connection.execute("SELECT * FROM shifts WHERE id = ?", (shift_id,)).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Shift could not be found.")
            if row["worker_id"] not in (None, user["id"]) or payload.status not in transitions.get(row["status"], set()):
                raise HTTPException(status_code=409, detail="This shift cannot be moved to that status.")
            if row["worker_id"] is None and (row["status"] != "Assigned" or payload.status != "Accepted"):
                raise HTTPException(status_code=409, detail="Accept an available shift before updating it.")
            result = connection.execute(
                """UPDATE shifts SET status = ?, worker_id = ?
                WHERE id = ? AND (worker_id = ? OR (worker_id IS NULL AND status = 'Assigned'))""",
                (payload.status, user["id"], shift_id, user["id"]),
            )
            if result.rowcount != 1:
                raise HTTPException(status_code=409, detail="This shift was claimed by another worker.")
            updated = connection.execute("SELECT * FROM shifts WHERE id = ?", (shift_id,)).fetchone()
        return shift_json(updated)

    @app.patch("/api/worker/availability")
    def update_availability(payload: AvailabilityUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "worker")
        if payload.available is None and payload.availableDates is None:
            raise HTTPException(status_code=422, detail="Provide availability or available dates.")
        dates = payload.availableDates
        if dates is not None:
            if len(set(dates)) != len(dates):
                raise HTTPException(status_code=422, detail="Available dates must be unique.")
            for value in dates:
                parse_iso_date(value)
        with connect() as connection:
            if payload.available is not None and dates is not None:
                connection.execute(
                    "UPDATE users SET available = ?, available_dates = ? WHERE id = ?",
                    (int(payload.available), json.dumps(dates), user["id"]),
                )
            elif payload.available is not None:
                connection.execute("UPDATE users SET available = ? WHERE id = ?", (int(payload.available), user["id"]))
            else:
                connection.execute(
                    "UPDATE users SET available_dates = ? WHERE id = ?",
                    (json.dumps(dates), user["id"]),
                )
        return {"available": payload.available, "availableDates": dates}

    @app.patch("/api/admin/events/{event_id}")
    def update_event(event_id: str, payload: EventUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "admin")
        changes = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not changes:
            raise HTTPException(status_code=422, detail="Provide at least one event field to update.")
        if "title" in changes:
            changes["title"] = changes["title"].strip()
            if not changes["title"]:
                raise HTTPException(status_code=422, detail="Enter an event name.")
        if "venue" in changes:
            changes["venue"] = changes["venue"].strip()
            if not changes["venue"]:
                raise HTTPException(status_code=422, detail="Enter a venue.")
            changes["address"] = f"{changes['venue']}, Bengaluru, Karnataka"
        if "date" in changes:
            parse_iso_date(changes["date"])
        if "time" in changes and not re.fullmatch(r"\d{2}:\d{2}", changes["time"]):
            raise HTTPException(status_code=422, detail="Use a valid 24-hour event time.")
        if "duty" in changes and changes["duty"] not in DUTIES:
            raise HTTPException(status_code=422, detail="Choose a supported event duty.")
        fields = ", ".join(f"{key} = ?" for key in changes)
        values = list(changes.values()) + [event_id]
        with connect() as connection:
            existing = connection.execute(
                "SELECT required, assigned FROM events WHERE id = ?", (event_id,)
            ).fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Event could not be found.")
            new_required = changes.get("required", existing["required"])
            new_assigned = changes.get("assigned", existing["assigned"])
            if new_assigned > new_required:
                raise HTTPException(status_code=422, detail="Crew assigned cannot exceed crew required.")
            result = connection.execute(f"UPDATE events SET {fields} WHERE id = ?", values)
            if result.rowcount != 1:
                raise HTTPException(status_code=404, detail="Event could not be found.")
            row = connection.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
        return event_json(row)

    @app.delete("/api/admin/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_event(event_id: str, user: sqlite3.Row = Depends(get_current_user)) -> Response:
        require_role(user, "admin")
        with connect() as connection:
            result = connection.execute("DELETE FROM events WHERE id = ?", (event_id,))
            if result.rowcount != 1:
                raise HTTPException(status_code=404, detail="Event could not be found.")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.patch("/api/admin/requests/{request_id}")
    def update_request(request_id: str, payload: RequestUpdate, user: sqlite3.Row = Depends(get_current_user)) -> dict[str, object]:
        require_role(user, "admin")
        with connect() as connection:
            result = connection.execute(
                "UPDATE staffing_requests SET status = ? WHERE id = ?",
                (payload.status, request_id),
            )
            if result.rowcount != 1:
                raise HTTPException(status_code=404, detail="Staffing request could not be found.")
            row = connection.execute("SELECT * FROM staffing_requests WHERE id = ?", (request_id,)).fetchone()
        return request_json(row)

    @app.delete("/api/admin/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_request(request_id: str, user: sqlite3.Row = Depends(get_current_user)) -> Response:
        require_role(user, "admin")
        with connect() as connection:
            result = connection.execute("DELETE FROM staffing_requests WHERE id = ?", (request_id,))
            if result.rowcount != 1:
                raise HTTPException(status_code=404, detail="Staffing request could not be found.")
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    @app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_user(user_id: str, user: sqlite3.Row = Depends(get_current_user)) -> Response:
        require_role(user, "admin")
        with connect() as connection:
            target = connection.execute("SELECT role FROM users WHERE id = ?", (user_id,)).fetchone()
            if target is None or target["role"] == "admin":
                raise HTTPException(status_code=404, detail="Worker or Organizer account could not be found.")
            if target["role"] == "organizer":
                connection.execute("DELETE FROM events WHERE owner_id = ?", (user_id,))
            else:
                connection.execute("DELETE FROM shifts WHERE worker_id = ?", (user_id,))
            connection.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return app


app = create_app()
