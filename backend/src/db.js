import crypto from "node:crypto";
import { supabase, isSupabaseConfigured } from "./supabase.js";

// Password hashing utility matching original scrypt specification
export function hashPassword(password, salt = null) {
  const saltBuf = salt ? Buffer.from(salt, "hex") : crypto.randomBytes(16);
  const hashBuf = crypto.scryptSync(password, saltBuf, 32, { N: 16384, r: 8, p: 1 });
  return {
    salt: saltBuf.toString("hex"),
    hash: hashBuf.toString("hex"),
  };
}

export function verifyPassword(password, saltHex, hashHex) {
  try {
    const saltBuf = Buffer.from(saltHex, "hex");
    const expectedBuf = Buffer.from(hashHex, "hex");
    const actualBuf = crypto.scryptSync(password, saltBuf, 32, { N: 16384, r: 8, p: 1 });
    return crypto.timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

// Initial Seed Data
const INITIAL_EVENTS = [
  {
    id: "city-lights",
    title: "City Lights Cultural Night",
    venue: "Palace Grounds",
    address: "Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006",
    date: "2026-11-14",
    time: "16:00",
    duty: "Ushering",
    required: 28,
    assigned: 16,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Report to Gate 3 security booth by 3:30 PM sharp. Dress Code: All-black formal shirt & trousers. Collect your crew accreditation pass from On-Site Lead Priya Sharma.",
    description: "An evening cultural gala celebrating heritage, music, and performing arts with 3,000+ dignitaries and guests.",
  },
  {
    id: "makers-market",
    title: "The Makers Weekend",
    venue: "Whitefield Convention Centre",
    address: "Whitefield Main Road, Bengaluru, Karnataka 560066",
    date: "2026-11-28",
    time: "08:00",
    duty: "Guest relations",
    required: 18,
    assigned: 10,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Check in at North Entrance lobby desk by 7:30 AM. Briefing will be held by Floor Lead Arjun Nair at 7:45 AM. Ensure guest welcome kits are ready.",
    description: "Premier artisan and startup exhibition bringing together over 150 innovators, food curators, and designers.",
  },
  {
    id: "food-stories",
    title: "Food Stories Festival",
    venue: "Jayamahal Palace",
    address: "Jayamahal Road, Bengaluru, Karnataka",
    date: "2026-12-12",
    time: "11:00",
    duty: "Catering support",
    required: 22,
    assigned: 15,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Assemble at the Main Kitchen tent area at 10:15 AM. Wear company aprons and comfortable non-slip shoes.",
    description: "Three-day outdoor culinary festival featuring live counters and masterclasses.",
  },
  {
    id: "design-meet",
    title: "Design & Ideas Forum",
    venue: "BIEC Convention Centre",
    address: "Bengaluru, Karnataka",
    date: "2027-01-09",
    time: "09:00",
    duty: "AV & technical support",
    required: 14,
    assigned: 8,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Arrive at Hall 2 Tech Console by 8:15 AM. Run audio soundchecks with Stage Director Nikhil.",
    description: "Enterprise technology forum featuring keynotes from Silicon Valley and Indian startup founders.",
  },
  {
    id: "community-run",
    title: "Good Morning Bengaluru Run",
    venue: "Cubbon Park",
    address: "Kasturba Road, Bengaluru, Karnataka 560001",
    date: "2026-11-22",
    time: "05:30",
    duty: "Crowd guidance",
    required: 16,
    assigned: 12,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Reporting time: 5:00 AM sharp at Amphitheatre Main Flagoff point. Collect reflective vests from Vikram Sen.",
    description: "Annual 10K and Half Marathon around scenic Cubbon Park promoting urban wellness.",
  },
  {
    id: "winter-conference",
    title: "Bengaluru Business Exchange",
    venue: "Bengaluru International Exhibition Centre",
    address: "Bengaluru, Karnataka",
    date: "2026-12-19",
    time: "07:30",
    duty: "Registration & check-in",
    required: 32,
    assigned: 19,
    status: "Published",
    owner_id: null,
    images: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Registration desks open at 7:30 AM. Collect QR scanner iPads from Level 1 Helpdesk. Business casual attire.",
    description: "High-level B2B summit bringing together CXOs and enterprise leaders.",
  },
];

const INITIAL_SHIFTS = [
  {
    id: "worker-tech-summit",
    worker_id: null,
    event_id: "tech-summit",
    title: "Bengaluru Tech Summit 2026",
    venue: "Bengaluru Palace (Main Arena)",
    address: "Palace Road, Vasanth Nagar, Bengaluru, Karnataka 560052",
    date: "2026-11-12",
    reporting: "08:30 AM",
    end_time: "05:00 PM",
    duty: "Stage Support / AV",
    supervisor: "Suresh Gowda (Event Organizer) · +91 98450 11223",
    status: "Completed",
  },
  {
    id: "worker-city-lights",
    worker_id: null,
    event_id: "city-lights",
    title: "City Lights Cultural Night",
    venue: "Palace Grounds",
    address: "Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006",
    date: "2026-11-14",
    reporting: "4:00 PM",
    end_time: "10:00 PM",
    duty: "Ushering",
    supervisor: "Pradeep (Event Organizer) · +91 98450 12345",
    status: "Assigned",
  },
  {
    id: "worker-makers-market",
    worker_id: null,
    event_id: "makers-market",
    title: "The Makers Weekend",
    venue: "KTPO Convention Centre",
    address: "Whitefield Main Road, Bengaluru, Karnataka 560066",
    date: "2026-11-28",
    reporting: "8:00 AM",
    end_time: "3:00 PM",
    duty: "Guest relations",
    supervisor: "Sarah (Event Organizer) · +91 97410 56789",
    status: "Assigned",
  },
  {
    id: "worker-community-run",
    worker_id: null,
    event_id: "community-run",
    title: "Good Morning Bengaluru Run",
    venue: "Cubbon Park",
    address: "Kasturba Road, Bengaluru, Karnataka 560001",
    date: "2026-10-18",
    reporting: "5:30 AM",
    end_time: "10:00 AM",
    duty: "Guest relations",
    supervisor: "Karthik (Event Organizer) · +91 99000 88776",
    status: "Completed",
  },
];

// In-Memory store for offline/standalone mode
const defaultWorkerHash = hashPassword("WorkerPassword2026!");
const defaultOrgHash = hashPassword("OrganizerPassword2026!");
const defaultAdminHash = hashPassword("AdminPassword2026!");

const memoryStore = {
  users: [
    {
      id: "demo-worker-1",
      name: "Rohan Verma",
      email: "worker@easyevent.in",
      role: "worker",
      password_salt: defaultWorkerHash.salt,
      password_hash: defaultWorkerHash.hash,
      available: true,
      available_dates: ["2026-11-15", "2026-11-16", "2026-11-21", "2026-11-22"],
    },
    {
      id: "demo-worker-2",
      name: "Pooja Hegde",
      email: "pooja.crew@easyevent.in",
      role: "worker",
      password_salt: defaultWorkerHash.salt,
      password_hash: defaultWorkerHash.hash,
      available: true,
      available_dates: ["2026-11-15", "2026-11-17", "2026-11-18", "2026-11-19"],
    },
    {
      id: "demo-worker-3",
      name: "Vikram Sen",
      email: "vikram.crew@easyevent.in",
      role: "worker",
      password_salt: defaultWorkerHash.salt,
      password_hash: defaultWorkerHash.hash,
      available: false,
      available_dates: [],
    },
    {
      id: "demo-org-1",
      name: "Ananya Rao",
      email: "organizer@easyevent.in",
      role: "organizer",
      password_salt: defaultOrgHash.salt,
      password_hash: defaultOrgHash.hash,
      available: false,
      available_dates: [],
    },
    {
      id: "demo-admin-1",
      name: "Administrator",
      email: "admin@easyevent.in",
      role: "admin",
      password_salt: defaultAdminHash.salt,
      password_hash: defaultAdminHash.hash,
      available: false,
      available_dates: [],
    },
  ],
  events: [...INITIAL_EVENTS],
  shifts: [...INITIAL_SHIFTS],
  requests: [],
  sessions: [],
};

// Helper to prevent hanging database queries from blocking the event loop
function withTimeout(promise, ms = 1200) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Database query timeout")), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Track unavailable / missing database tables to avoid repeat failed round-trips
const missingTables = new Map();

function isTableAvailable(tableName) {
  if (!missingTables.has(tableName)) return true;
  const checkedAt = missingTables.get(tableName);
  // Retry checking after 5 minutes
  if (Date.now() - checkedAt > 5 * 60 * 1000) {
    missingTables.delete(tableName);
    return true;
  }
  return false;
}

function handleSupabaseError(tableName, error) {
  if (
    error &&
    (error.code === "PGRST205" ||
      error.message?.includes("schema cache") ||
      error.message?.includes("Could not find the table") ||
      error.code === "42P01")
  ) {
    missingTables.set(tableName, Date.now());
  }
}

// Proactive background cache warmup on boot to eliminate cold query lag
if (isSupabaseConfigured) {
  setTimeout(async () => {
    const tables = ["users", "sessions", "events", "shifts", "staffing_requests"];
    await Promise.all(
      tables.map(async (table) => {
        try {
          const { error } = await withTimeout(supabase.from(table).select("id").limit(1), 800);
          if (error) handleSupabaseError(table, error);
        } catch {
          missingTables.set(table, Date.now());
        }
      })
    );
  }, 50);
}

// Database Access Methods
export async function getPublicEvents() {
  let list = [];
  if (isSupabaseConfigured && isTableAvailable("events")) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("events")
          .select("*")
          .eq("status", "Published")
          .order("date", { ascending: true }),
        1200
      );
      if (error) {
        handleSupabaseError("events", error);
        list = memoryStore.events.filter((e) => e.status === "Published");
      } else if (data && data.length > 0) {
        list = data;
      } else {
        list = memoryStore.events.filter((e) => e.status === "Published");
      }
    } catch {
      list = memoryStore.events.filter((e) => e.status === "Published");
    }
  } else {
    list = memoryStore.events.filter((e) => e.status === "Published");
  }

  // Security & Privacy: Confidential attending crew briefings are protected
  // and strictly omitted from public browse listings. They are delivered exclusively
  // to confirmed attending crew through authenticated dashboard shifts.
  return list.map((e) => {
    const { crew_briefing: _privateBriefing, ...publicDetails } = e;
    return publicDetails;
  });
}

export async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();

  // 1. Check in-memory users first (instant: 0ms)
  const memUser = memoryStore.users.find((u) => u.email.toLowerCase() === normalized);
  if (memUser) return memUser;

  // 2. Query Supabase if table is available
  if (isSupabaseConfigured && isTableAvailable("users")) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("users")
          .select("*")
          .ilike("email", normalized)
          .maybeSingle(),
        1200
      );
      if (error) {
        handleSupabaseError("users", error);
      } else if (data) {
        if (!memoryStore.users.some((u) => u.id === data.id)) {
          memoryStore.users.push(data);
        }
        return data;
      }
    } catch {
      // Supabase timeout or network error fallback
    }
  }

  return null;
}

export async function findUserById(id) {
  // 1. Check in-memory users first
  const memUser = memoryStore.users.find((u) => u.id === id);
  if (memUser) return memUser;

  // 2. Query Supabase if table is available
  if (isSupabaseConfigured && isTableAvailable("users")) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        1200
      );
      if (error) {
        handleSupabaseError("users", error);
      } else if (data) {
        if (!memoryStore.users.some((u) => u.id === data.id)) {
          memoryStore.users.push(data);
        }
        return data;
      }
    } catch {
      // Timeout fallback
    }
  }

  return null;
}

export async function createUser(userData) {
  const normalizedEmail = userData.email.toLowerCase();
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: userData.name,
    email: normalizedEmail,
    role: userData.role,
    password_salt: userData.password_salt,
    password_hash: userData.password_hash,
    available: false,
    available_dates: [],
  };

  // Add to memory immediately so the session and user are ready without delay
  memoryStore.users.push(user);

  if (isSupabaseConfigured && isTableAvailable("users")) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("users")
          .insert({
            id: user.id,
            name: userData.name,
            email: normalizedEmail,
            role: userData.role,
            password_salt: userData.password_salt,
            password_hash: userData.password_hash,
            available: false,
            available_dates: [],
          })
          .select()
          .single(),
        1500
      );
      if (error) {
        handleSupabaseError("users", error);
      } else if (data) {
        const idx = memoryStore.users.findIndex((u) => u.email === normalizedEmail);
        if (idx !== -1) memoryStore.users[idx] = data;
        return data;
      }
    } catch {
      // Fall back to memory user
    }
  }

  return user;
}

export async function createSession(tokenHash, userId, expiresAt) {
  memoryStore.sessions.push({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
  });

  // Non-blocking background persistence so login HTTP response is never stalled
  if (isSupabaseConfigured && isTableAvailable("sessions")) {
    supabase
      .from("sessions")
      .insert({
        token_hash: tokenHash,
        user_id: userId,
        expires_at: expiresAt,
      })
      .then(({ error }) => {
        if (error) handleSupabaseError("sessions", error);
      })
      .catch(() => {});
  }
}

export async function getUserBySession(tokenHash) {
  const now = Math.floor(Date.now() / 1000);
  
  // 1. Check in-memory active sessions first (instant: 0ms)
  const sess = memoryStore.sessions.find(
    (s) => s.token_hash === tokenHash && s.expires_at > now
  );
  if (sess) {
    const memUser = memoryStore.users.find((u) => u.id === sess.user_id);
    if (memUser) return memUser;
  }

  // 2. Check Supabase if table is available
  if (isSupabaseConfigured && isTableAvailable("sessions")) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("sessions")
          .select("user_id, expires_at, users(*)")
          .eq("token_hash", tokenHash)
          .gt("expires_at", now)
          .maybeSingle(),
        1200
      );
      if (error) {
        handleSupabaseError("sessions", error);
      } else if (data?.users) {
        if (!memoryStore.users.some((u) => u.id === data.users.id)) {
          memoryStore.users.push(data.users);
        }
        return data.users;
      }
    } catch {
      // Supabase timeout or fallback
    }
  }

  return null;
}

export async function deleteSession(tokenHash) {
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.token_hash !== tokenHash);
  if (isSupabaseConfigured && isTableAvailable("sessions")) {
    supabase
      .from("sessions")
      .delete()
      .eq("token_hash", tokenHash)
      .then(({ error }) => {
        if (error) handleSupabaseError("sessions", error);
      })
      .catch(() => {});
  }
}

export async function getDashboardState(user) {
  const role = user.role;

  let users = [];
  let events = [];
  let requests = [];
  let shifts = [];

  const canQuerySupabase = isSupabaseConfigured && isTableAvailable("events") && isTableAvailable("shifts");

  if (canQuerySupabase) {
    try {
      if (role === "admin") {
        const [uRes, eRes, rRes, sRes] = await withTimeout(
          Promise.all([
            isTableAvailable("users")
              ? supabase.from("users").select("id, name, email, role").order("name")
              : Promise.resolve({ data: [] }),
            supabase.from("events").select("*").order("date"),
            isTableAvailable("staffing_requests")
              ? supabase.from("staffing_requests").select("*").order("created_at", { ascending: false })
              : Promise.resolve({ data: [] }),
            supabase.from("shifts").select("*").order("date"),
          ]),
          1500
        );
        if (uRes.error) handleSupabaseError("users", uRes.error);
        if (eRes.error) handleSupabaseError("events", eRes.error);
        if (rRes.error) handleSupabaseError("staffing_requests", rRes.error);
        if (sRes.error) handleSupabaseError("shifts", sRes.error);
        users = uRes.data || [];
        events = eRes.data || [];
        requests = rRes.data || [];
        shifts = sRes.data || [];
      } else if (role === "organizer") {
        const [uRes, eRes, rRes, sRes] = await withTimeout(
          Promise.all([
            isTableAvailable("users")
              ? supabase.from("users").select("id, name, email, role, available, available_dates").eq("role", "worker").order("name")
              : Promise.resolve({ data: [] }),
            supabase.from("events").select("*").or(`owner_id.eq.${user.id},owner_id.is.null`).order("date"),
            isTableAvailable("staffing_requests")
              ? supabase.from("staffing_requests").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false })
              : Promise.resolve({ data: [] }),
            supabase.from("shifts").select("*").order("date"),
          ]),
          1500
        );
        if (uRes.error) handleSupabaseError("users", uRes.error);
        if (eRes.error) handleSupabaseError("events", eRes.error);
        if (rRes.error) handleSupabaseError("staffing_requests", rRes.error);
        if (sRes.error) handleSupabaseError("shifts", sRes.error);
        users = (uRes.data || []).map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          available: Boolean(u.available),
          availableDates: Array.isArray(u.available_dates)
            ? u.available_dates
            : typeof u.available_dates === "string"
              ? JSON.parse(u.available_dates || "[]")
              : [],
        }));
        events = eRes.data || [];
        requests = rRes.data || [];
        const eventIds = new Set(events.map((e) => e.id));
        shifts = (sRes.data || []).filter((s) => eventIds.has(s.event_id));
      } else {
        // worker
        const [eRes, sRes] = await withTimeout(
          Promise.all([
            supabase.from("events").select("*").eq("status", "Published").order("date"),
            supabase.from("shifts").select("*").or(`worker_id.eq.${user.id},worker_id.is.null`).order("date"),
          ]),
          1500
        );
        if (eRes.error) handleSupabaseError("events", eRes.error);
        if (sRes.error) handleSupabaseError("shifts", sRes.error);
        events = eRes.data || [];
        shifts = sRes.data || [];
      }
    } catch (err) {
      console.warn("Supabase dashboard query failed or timed out, using memory fallback");
    }
  }

  // Fallback to memory store if Supabase not used or empty
  if (!isSupabaseConfigured || events.length === 0) {
    if (role === "admin") {
      users = memoryStore.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      events = memoryStore.events;
      requests = memoryStore.requests;
      shifts = memoryStore.shifts;
    } else if (role === "organizer") {
      users = memoryStore.users
        .filter((u) => u.role === "worker")
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          available: Boolean(u.available),
          availableDates: Array.isArray(u.available_dates)
            ? u.available_dates
            : typeof u.available_dates === "string"
              ? JSON.parse(u.available_dates || "[]")
              : [],
        }));
      events = memoryStore.events.filter((e) => e.owner_id === user.id || !e.owner_id);
      requests = memoryStore.requests.filter((r) => r.organizer_id === user.id);
      const eventIds = new Set(events.map((e) => e.id));
      shifts = memoryStore.shifts.filter((s) => eventIds.has(s.event_id));
    } else {
      events = memoryStore.events.filter((e) => e.status === "Published");
      shifts = memoryStore.shifts.filter((s) => s.worker_id === user.id || !s.worker_id);
    }
  }

  const rawDates = user.available_dates;
  const availableDates = Array.isArray(rawDates)
    ? rawDates
    : typeof rawDates === "string"
      ? JSON.parse(rawDates || "[]")
      : [];

  const normalizedShifts = shifts.map((s) => ({
    ...s,
    endTime: s.endTime || s.end_time || "05:00 PM",
    end_time: s.end_time || s.endTime || "05:00 PM",
    attended: s.attended !== undefined ? s.attended : s.status === "Completed" ? true : null,
    paymentDelayed: Boolean(s.payment_delayed || s.paymentDelayed),
    payment_delayed: Boolean(s.payment_delayed || s.paymentDelayed),
    payoutStatus: s.payout_status || s.payoutStatus || (s.status === "Completed" ? "Credited" : s.status === "Did Not Attend" ? "Delayed / Under Review" : "Expected"),
    payout_status: s.payout_status || s.payoutStatus || (s.status === "Completed" ? "Credited" : s.status === "Did Not Attend" ? "Delayed / Under Review" : "Expected"),
  }));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      warnings: user.warnings || 0,
      warningReason: user.warning_reason || null,
      suspendedUntil: user.suspended_until || null,
    },
    data: {
      users,
      events,
      requests,
      shifts: normalizedShifts,
      available: Boolean(user.available),
      availableDates,
    },
  };
}

export async function createEvent(eventData, ownerId) {
  const newEvent = {
    id: `event-${Date.now()}`,
    title: eventData.title,
    venue: eventData.venue,
    address: eventData.address || `${eventData.venue}, Bengaluru, Karnataka`,
    date: eventData.date,
    time: eventData.time,
    duty: eventData.duty,
    required: Number(eventData.required),
    assigned: 0,
    status: "Pending approval",
    owner_id: ownerId,
    images: Array.isArray(eventData.images) ? eventData.images.slice(0, 2) : [],
    crew_briefing: eventData.crew_briefing || "",
    description: eventData.description || "",
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("events")
      .insert(newEvent)
      .select()
      .single();
    if (!error && data) return data;
  }

  memoryStore.events.unshift(newEvent);
  return newEvent;
}

export async function createStaffingRequest(reqData, organizerId) {
  const newReq = {
    id: `req-${Date.now()}`,
    event_id: reqData.eventId,
    organizer_id: organizerId,
    quantity: Number(reqData.quantity),
    duty: reqData.duty,
    status: "Pending",
    created_at: new Date().toISOString().split("T")[0],
  };

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("staffing_requests")
      .insert(newReq)
      .select()
      .single();
    if (!error && data) return data;
  }

  memoryStore.requests.unshift(newReq);
  return newReq;
}

export async function cancelStaffingRequest(requestId, organizerId) {
  const req = memoryStore.requests.find((r) => r.id === requestId);
  if (req) req.status = "Cancelled";

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from("staffing_requests")
        .update({ status: "Cancelled" })
        .eq("id", requestId);
    } catch {
      // Supabase fallback
    }
  }
}

export async function updateShiftStatus(shiftId, status) {
  const shift = memoryStore.shifts.find((s) => s.id === shiftId);
  if (shift) shift.status = status;

  if (isSupabaseConfigured) {
    try {
      await supabase.from("shifts").update({ status }).eq("id", shiftId);
    } catch {
      // Supabase fallback
    }
  }
}

export async function updateWorkerAvailability(userId, { available, availableDates }) {
  const updates = {};
  if (available !== undefined) updates.available = available;
  if (availableDates !== undefined) updates.available_dates = availableDates;

  const u = memoryStore.users.find((user) => user.id === userId);
  if (u) {
    if (available !== undefined) u.available = available;
    if (availableDates !== undefined) u.available_dates = availableDates;
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from("users").update(updates).eq("id", userId);
    } catch {
      // Supabase fallback
    }
  }
}

// Admin Methods
export async function updateAdminEvent(id, changes) {
  const event = memoryStore.events.find((e) => e.id === id);
  if (event) Object.assign(event, changes);

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("events")
        .update(changes)
        .eq("id", id)
        .select()
        .single();
      if (data) return data;
    } catch {
      // Supabase fallback
    }
  }
  return event;
}

export async function deleteAdminEvent(id) {
  memoryStore.events = memoryStore.events.filter((e) => e.id !== id);
  if (isSupabaseConfigured) {
    try {
      await supabase.from("events").delete().eq("id", id);
    } catch {
      // Supabase fallback
    }
  }
}

export async function updateAdminRequest(id, status) {
  const req = memoryStore.requests.find((r) => r.id === id);
  if (req) req.status = status;

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("staffing_requests")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (data) return data;
    } catch {
      // Supabase fallback
    }
  }
  return req;
}

export async function deleteAdminRequest(id) {
  memoryStore.requests = memoryStore.requests.filter((r) => r.id !== id);
  if (isSupabaseConfigured) {
    try {
      await supabase.from("staffing_requests").delete().eq("id", id);
    } catch {
      // Supabase fallback
    }
  }
}

export async function deleteAdminUser(id) {
  memoryStore.users = memoryStore.users.filter((u) => u.id !== id);
  if (isSupabaseConfigured) {
    try {
      await supabase.from("users").delete().eq("id", id);
    } catch {
      // Supabase fallback
    }
  }
}

export async function applyForEvent(workerId, eventId, duty) {
  const event = memoryStore.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");

  if (event.assigned >= event.required) {
    throw new Error(`This event is full (${event.assigned}/${event.required} positions filled). No slots available.`);
  }

  const worker = memoryStore.users.find((u) => u.id === workerId);
  if (worker?.suspended_until && new Date(worker.suspended_until) > new Date()) {
    const untilStr = new Date(worker.suspended_until).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    throw new Error(`Your account is temporarily suspended until ${untilStr} due to repeated unattended shifts. You cannot accept new shifts at this time.`);
  }

  const newShift = {
    id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    worker_id: workerId,
    event_id: eventId,
    title: event.title,
    venue: event.venue,
    address: event.address,
    date: event.date,
    reporting: event.time ? `${event.time}` : "09:00 AM",
    end_time: "06:00 PM",
    endTime: "06:00 PM",
    duty: duty || event.duty,
    supervisor: "Ananya Rao (Event Organizer) · +91 98450 11223",
    status: "Accepted",
    images: Array.isArray(event.images) ? event.images : [],
    crew_briefing: event.crew_briefing || "",
    attended: null,
    payment_delayed: false,
    payout_status: "Expected",
    created_at: new Date().toISOString(),
  };

  event.assigned = (event.assigned || 0) + 1;
  memoryStore.shifts.unshift(newShift);

  if (isSupabaseConfigured && isTableAvailable("shifts")) {
    supabase.from("shifts").insert(newShift).catch(() => {});
    supabase.from("events").update({ assigned: event.assigned }).eq("id", eventId).catch(() => {});
  }

  return newShift;
}

export async function cancelWorkerShift(workerId, shiftId) {
  const shift = memoryStore.shifts.find((s) => s.id === shiftId);
  if (!shift) throw new Error("Shift not found");

  if (shift.worker_id && shift.worker_id !== workerId) {
    throw new Error("You are not authorized to cancel this shift.");
  }

  // 4-Hour Cancellation Policy Check
  let hours = 9;
  let minutes = 0;
  if (shift.reporting && shift.reporting.includes(":")) {
    const raw = shift.reporting.replace(/[^0-9:]/g, "").split(":");
    hours = parseInt(raw[0], 10) || 9;
    minutes = parseInt(raw[1], 10) || 0;
    const isPM = shift.reporting.toLowerCase().includes("pm");
    const isAM = shift.reporting.toLowerCase().includes("am");
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  const shiftDateTime = new Date(`${shift.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  const now = new Date();
  const diffHours = (shiftDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours > 0 && diffHours <= 4) {
    throw new Error(
      `Cancellation locked: Shift starts in ${diffHours.toFixed(1)} hours. The 4-hour cancellation window has expired. Mandatory attendance policy is active.`
    );
  }

  shift.status = "Cancelled";
  shift.cancelled_at = new Date().toISOString();

  // Release the event staffing slot in real-time
  if (shift.event_id) {
    const event = memoryStore.events.find((e) => e.id === shift.event_id);
    if (event) {
      event.assigned = Math.max(0, (event.assigned || 1) - 1);
      if (isSupabaseConfigured && isTableAvailable("events")) {
        supabase.from("events").update({ assigned: event.assigned }).eq("id", event.id).catch(() => {});
      }
    }
  }

  if (isSupabaseConfigured && isTableAvailable("shifts")) {
    supabase.from("shifts").update({ status: "Cancelled" }).eq("id", shiftId).catch(() => {});
  }

  return { success: true, shiftId, status: "Cancelled", eventId: shift.event_id };
}

export async function verifyAttendance(shiftId, attended) {
  const shift = memoryStore.shifts.find((s) => s.id === shiftId);
  if (!shift) throw new Error("Shift not found");

  const worker = memoryStore.users.find((u) => u.id === shift.worker_id);

  if (attended) {
    shift.status = "Completed";
    shift.attended = true;
    shift.payment_delayed = false;
    shift.payout_status = "Credited";
  } else {
    shift.status = "Did Not Attend";
    shift.attended = false;
    shift.payment_delayed = true;
    shift.payout_status = "Delayed / Under Review";

    if (worker) {
      worker.warnings = (worker.warnings || 0) + 1;
      if (worker.warnings === 1) {
        worker.warning_reason = `1st Warning: Shift unattended for "${shift.title}". Payout delayed by 48 hours for review.`;
      } else if (worker.warnings >= 2) {
        const suspendUntil = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
        worker.suspended_until = suspendUntil;
        worker.warning_reason = `2nd Strike: Account suspended for 2 days until ${new Date(suspendUntil).toLocaleDateString("en-IN")}. Policy: 2 unattended shifts.`;
      }
    }
  }

  if (isSupabaseConfigured && isTableAvailable("shifts")) {
    supabase
      .from("shifts")
      .update({
        status: shift.status,
        attended: shift.attended,
        payment_delayed: shift.payment_delayed,
      })
      .eq("id", shiftId)
      .catch(() => {});
  }

  return {
    shift,
    worker: worker
      ? {
          id: worker.id,
          name: worker.name,
          email: worker.email,
          warnings: worker.warnings,
          warningReason: worker.warning_reason,
          suspendedUntil: worker.suspended_until,
        }
      : null,
  };
}
