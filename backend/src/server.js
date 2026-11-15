import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();
import {
  hashPassword,
  verifyPassword,
  getPublicEvents,
  findUserByEmail,
  findUserById,
  createUser,
  createSession,
  getUserBySession,
  deleteSession,
  getDashboardState,
  createEvent,
  createStaffingRequest,
  cancelStaffingRequest,
  updateShiftStatus,
  updateWorkerAvailability,
  applyForEvent,
  cancelWorkerShift,
  verifyAttendance,
  updateAdminEvent,
  deleteAdminEvent,
  updateAdminRequest,
  deleteAdminRequest,
  deleteAdminUser,
} from "./db.js";
import { isSupabaseConfigured } from "./supabase.js";
import { isPgConfigured } from "./pg.js";

const app = express();
const PORT = process.env.PORT || 8000;
const SESSION_COOKIE = "easyevent_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const isProduction = process.env.NODE_ENV === "production";
const isCookieSecure = process.env.SESSION_COOKIE_SECURE === "true" || isProduction;
// When deployed cross-origin (Vercel frontend + Render backend), cookies require SameSite=None and Secure=true
const cookieSameSite = isProduction ? "none" : "lax";

// Trust reverse proxy load balancer (required on Render for HTTPS termination & secure cookies)
app.set("trust proxy", 1);

// CORS Configuration supporting Vercel frontend, custom domains, and local development
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      // Allow configured origins and all Vercel deployment URLs (*.vercel.app)
      if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// Helper: Session Cookie Manager
function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    maxAge: SESSION_TTL_SECONDS * 1000,
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: cookieSameSite,
    path: "/",
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isCookieSecure,
    sameSite: cookieSameSite,
    path: "/",
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Authentication Middleware
async function authenticateUser(req, res, next) {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ detail: "Sign in to continue." });
  }

  const tokenHash = hashToken(token);
  const user = await getUserBySession(tokenHash);

  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ detail: "Your session expired. Sign in again." });
  }

  req.user = user;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ detail: "You do not have permission to perform this action." });
    }
    next();
  };
}

// ==========================================
// Public Endpoints
// ==========================================

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    database: isSupabaseConfigured
      ? "supabase"
      : isPgConfigured
      ? "render-postgresql"
      : "local-storage",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/events/public", async (_req, res) => {
  try {
    const events = await getPublicEvents();
    res.json(events);
  } catch (err) {
    console.error("Failed to fetch public events", err);
    res.status(500).json({ detail: "Could not load events." });
  }
});

// ==========================================
// Authentication Endpoints
// ==========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ detail: "Enter a valid email address." });
    }
    if (!name || name.trim().length === 0 || name.length > 100) {
      return res.status(422).json({ detail: "Enter your full name." });
    }
    if (!password || password.length < 8 || password.length > 128) {
      return res.status(422).json({ detail: "Choose a password between 8 and 128 characters." });
    }
    if (!["worker", "organizer"].includes(role)) {
      return res.status(422).json({ detail: "Role must be either worker or organizer." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ detail: "An account with this email already exists." });
    }

    const { salt, hash } = hashPassword(password);
    const user = await createUser({
      name: name.trim(),
      email: normalizedEmail,
      role,
      password_salt: salt,
      password_hash: hash,
    });

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

    await createSession(tokenHash, user.id, expiresAt);
    setSessionCookie(res, token);

    const state = await getDashboardState(user);
    res.status(201).json(state);
  } catch (err) {
    console.error("Signup error", err);
    res.status(500).json({ detail: "Account creation could not be completed." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).json({ detail: "Enter both email and password." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      return res.status(401).json({ detail: "Email or password is incorrect." });
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

    await createSession(tokenHash, user.id, expiresAt);
    setSessionCookie(res, token);

    const state = await getDashboardState(user);
    res.json(state);
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ detail: "Sign in could not be completed." });
  }
});

app.get("/api/auth/me", authenticateUser, async (req, res) => {
  try {
    const state = await getDashboardState(req.user);
    res.json(state);
  } catch (err) {
    console.error("Auth me error", err);
    res.status(500).json({ detail: "Could not load session state." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  const token = req.cookies[SESSION_COOKIE];
  if (token) {
    const tokenHash = hashToken(token);
    await deleteSession(tokenHash);
  }
  clearSessionCookie(res);
  res.status(204).end();
});

app.get("/api/state", authenticateUser, async (req, res) => {
  try {
    const state = await getDashboardState(req.user);
    res.json(state);
  } catch (err) {
    console.error("Get state error", err);
    res.status(500).json({ detail: "Could not load dashboard state." });
  }
});

// ==========================================
// Worker Actions
// ==========================================

app.patch("/api/worker/shifts/:id", authenticateUser, requireRole("worker", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Assigned", "Accepted", "Reporting", "Completed", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(422).json({ detail: "Invalid shift status." });
    }

    await updateShiftStatus(req.params.id, status);
    res.status(204).end();
  } catch (err) {
    console.error("Worker shift update error", err);
    res.status(500).json({ detail: "Shift status could not be updated." });
  }
});

app.patch("/api/worker/availability", authenticateUser, requireRole("worker"), async (req, res) => {
  try {
    const { available, availableDates } = req.body;
    await updateWorkerAvailability(req.user.id, { available, availableDates });
    res.status(204).end();
  } catch (err) {
    console.error("Worker availability update error", err);
    res.status(500).json({ detail: "Availability could not be updated." });
  }
});

app.post("/api/worker/apply", authenticateUser, requireRole("worker"), async (req, res) => {
  try {
    const { eventId, duty } = req.body;
    if (!eventId) return res.status(422).json({ detail: "Event ID is required." });
    const shift = await applyForEvent(req.user.id, eventId, duty);
    res.status(201).json(shift);
  } catch (err) {
    console.error("Worker apply error", err);
    res.status(400).json({ detail: err.message || "Could not apply for shift." });
  }
});

app.post("/api/worker/cancel-shift", authenticateUser, requireRole("worker"), async (req, res) => {
  try {
    const { shiftId } = req.body;
    if (!shiftId) return res.status(422).json({ detail: "Shift ID is required." });
    const result = await cancelWorkerShift(req.user.id, shiftId);
    res.json(result);
  } catch (err) {
    console.error("Worker shift cancellation error", err);
    res.status(400).json({ detail: err.message || "Shift could not be cancelled." });
  }
});

app.post("/api/organizer/attendance", authenticateUser, requireRole("organizer", "admin"), async (req, res) => {
  try {
    const { shiftId, attended } = req.body;
    if (!shiftId || typeof attended !== "boolean") {
      return res.status(422).json({ detail: "Shift ID and attended status (true/false) are required." });
    }
    const result = await verifyAttendance(shiftId, attended);
    res.json(result);
  } catch (err) {
    console.error("Organizer attendance verification error", err);
    res.status(500).json({ detail: err.message || "Attendance could not be recorded." });
  }
});

// ==========================================
// Organizer Actions
// ==========================================

app.post("/api/organizer/events", authenticateUser, requireRole("organizer", "admin"), async (req, res) => {
  try {
    const { title, venue, date, time, duty, required, images, crew_briefing, description } = req.body;

    if (!title?.trim() || !venue?.trim()) {
      return res.status(422).json({ detail: "Enter event title and venue." });
    }
    if (!date || !time) {
      return res.status(422).json({ detail: "Enter a valid date and time." });
    }
    const crew = Number(required);
    if (!crew || crew < 1 || crew > 5000) {
      return res.status(422).json({ detail: "Enter required crew between 1 and 5000." });
    }

    const created = await createEvent(
      {
        title: title.trim(),
        venue: venue.trim(),
        date,
        time,
        duty: duty || "Guest relations",
        required: crew,
        images: Array.isArray(images) ? images.slice(0, 2) : [],
        crew_briefing: crew_briefing || "",
        description: description || "",
      },
      req.user.id
    );

    res.status(201).json(created);
  } catch (err) {
    console.error("Create event error", err);
    res.status(500).json({ detail: "Event could not be created." });
  }
});

app.post("/api/organizer/requests", authenticateUser, requireRole("organizer", "admin"), async (req, res) => {
  try {
    const { eventId, quantity, duty } = req.body;
    const count = Number(quantity);

    if (!eventId) {
      return res.status(422).json({ detail: "Choose an event for this staffing request." });
    }
    if (!count || count < 1 || count > 500) {
      return res.status(422).json({ detail: "Enter crew count between 1 and 500." });
    }

    const request = await createStaffingRequest(
      { eventId, quantity: count, duty: duty || "Event Crew" },
      req.user.id
    );

    res.status(201).json(request);
  } catch (err) {
    console.error("Create staffing request error", err);
    res.status(500).json({ detail: "Staffing request could not be saved." });
  }
});

app.patch("/api/organizer/requests/:id", authenticateUser, requireRole("organizer", "admin"), async (req, res) => {
  try {
    await cancelStaffingRequest(req.params.id, req.user.id);
    res.status(204).end();
  } catch (err) {
    console.error("Cancel request error", err);
    res.status(500).json({ detail: "Staffing request could not be withdrawn." });
  }
});

// ==========================================
// Admin Actions
// ==========================================

app.patch("/api/admin/events/:id", authenticateUser, requireRole("admin"), async (req, res) => {
  try {
    const updated = await updateAdminEvent(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error("Admin event update error", err);
    res.status(500).json({ detail: "Event could not be updated." });
  }
});

app.delete("/api/admin/events/:id", authenticateUser, requireRole("admin"), async (req, res) => {
  try {
    await deleteAdminEvent(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Admin event delete error", err);
    res.status(500).json({ detail: "Event could not be deleted." });
  }
});

app.patch("/api/admin/requests/:id", authenticateUser, requireRole("admin"), async (req, res) => {
  try {
    const updated = await updateAdminRequest(req.params.id, req.body.status);
    res.json(updated);
  } catch (err) {
    console.error("Admin request update error", err);
    res.status(500).json({ detail: "Request could not be updated." });
  }
});

app.delete("/api/admin/requests/:id", authenticateUser, requireRole("admin"), async (req, res) => {
  try {
    await deleteAdminRequest(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Admin request delete error", err);
    res.status(500).json({ detail: "Request could not be deleted." });
  }
});

app.delete("/api/admin/users/:id", authenticateUser, requireRole("admin"), async (req, res) => {
  try {
    await deleteAdminUser(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Admin user delete error", err);
    res.status(500).json({ detail: "User could not be deleted." });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[EasyEvent] Node.js backend server listening on http://127.0.0.1:${PORT}`);
  console.log(`[EasyEvent] Database Mode: ${isSupabaseConfigured ? "Connected (Supabase)" : isPgConfigured ? "Connected (Render PostgreSQL)" : "Local Fallback Store"}`);
});

