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
    supervisor: "Suresh Gowda (Ops Manager)",
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
    supervisor: "Pradeep (Lead Supervisor)",
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
    supervisor: "Sarah (Floor Lead)",
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
    supervisor: "Karthik (Race Coordinator)",
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
      available_dates: ["2026-11-14", "2026-11-15", "2026-11-21"],
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

// Database Access Methods
export async function getPublicEvents() {
  let list = [];
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("status", "Published")
        .order("date", { ascending: true });
      if (!error && data && data.length > 0) {
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
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .ilike("email", normalized)
        .maybeSingle();
      if (!error && data) return data;
    } catch {
      // fallback
    }
  }
  return memoryStore.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) return data;
  }
  return memoryStore.users.find((u) => u.id === id) || null;
}

export async function createUser(userData) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: userData.name,
        email: userData.email.toLowerCase(),
        role: userData.role,
        password_salt: userData.password_salt,
        password_hash: userData.password_hash,
        available: false,
        available_dates: [],
      })
      .select()
      .single();
    if (!error && data) return data;
  }
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: userData.name,
    email: userData.email.toLowerCase(),
    role: userData.role,
    password_salt: userData.password_salt,
    password_hash: userData.password_hash,
    available: false,
    available_dates: [],
  };
  memoryStore.users.push(user);
  return user;
}

export async function createSession(tokenHash, userId, expiresAt) {
  if (isSupabaseConfigured) {
    await supabase.from("sessions").insert({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
    });
    return;
  }
  memoryStore.sessions.push({
    token_hash: tokenHash,
    user_id: userId,
    expires_at: expiresAt,
  });
}

export async function getUserBySession(tokenHash) {
  const now = Math.floor(Date.now() / 1000);
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("sessions")
      .select("user_id, expires_at, users(*)")
      .eq("token_hash", tokenHash)
      .gt("expires_at", now)
      .maybeSingle();
    if (!error && data?.users) return data.users;
  }
  const sess = memoryStore.sessions.find(
    (s) => s.token_hash === tokenHash && s.expires_at > now
  );
  if (!sess) return null;
  return memoryStore.users.find((u) => u.id === sess.user_id) || null;
}

export async function deleteSession(tokenHash) {
  if (isSupabaseConfigured) {
    await supabase.from("sessions").delete().eq("token_hash", tokenHash);
    return;
  }
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.token_hash !== tokenHash);
}

export async function getDashboardState(user) {
  const role = user.role;

  let users = [];
  let events = [];
  let requests = [];
  let shifts = [];

  if (isSupabaseConfigured) {
    try {
      if (role === "admin") {
        const [uRes, eRes, rRes, sRes] = await Promise.all([
          supabase.from("users").select("id, name, email, role").order("name"),
          supabase.from("events").select("*").order("date"),
          supabase.from("staffing_requests").select("*").order("created_at", { ascending: false }),
          supabase.from("shifts").select("*").order("date"),
        ]);
        users = uRes.data || [];
        events = eRes.data || [];
        requests = rRes.data || [];
        shifts = sRes.data || [];
      } else if (role === "organizer") {
        const [eRes, rRes, sRes] = await Promise.all([
          supabase.from("events").select("*").or(`owner_id.eq.${user.id},owner_id.is.null`).order("date"),
          supabase.from("staffing_requests").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false }),
          supabase.from("shifts").select("*").order("date"),
        ]);
        events = eRes.data || [];
        requests = rRes.data || [];
        const eventIds = new Set(events.map((e) => e.id));
        shifts = (sRes.data || []).filter((s) => eventIds.has(s.event_id));
      } else {
        // worker
        const [eRes, sRes] = await Promise.all([
          supabase.from("events").select("*").eq("status", "Published").order("date"),
          supabase.from("shifts").select("*").or(`worker_id.eq.${user.id},worker_id.is.null`).order("date"),
        ]);
        events = eRes.data || [];
        shifts = sRes.data || [];
      }
    } catch (err) {
      console.warn("Supabase dashboard query failed, using memory fallback", err);
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
  }));

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
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
  if (isSupabaseConfigured) {
    await supabase
      .from("staffing_requests")
      .update({ status: "Cancelled" })
      .eq("id", requestId);
    return;
  }
  const req = memoryStore.requests.find((r) => r.id === requestId);
  if (req) req.status = "Cancelled";
}

export async function updateShiftStatus(shiftId, status) {
  if (isSupabaseConfigured) {
    await supabase.from("shifts").update({ status }).eq("id", shiftId);
    return;
  }
  const shift = memoryStore.shifts.find((s) => s.id === shiftId);
  if (shift) shift.status = status;
}

export async function updateWorkerAvailability(userId, { available, availableDates }) {
  const updates = {};
  if (available !== undefined) updates.available = available;
  if (availableDates !== undefined) updates.available_dates = availableDates;

  if (isSupabaseConfigured) {
    await supabase.from("users").update(updates).eq("id", userId);
    return;
  }
  const u = memoryStore.users.find((user) => user.id === userId);
  if (u) {
    if (available !== undefined) u.available = available;
    if (availableDates !== undefined) u.available_dates = availableDates;
  }
}

// Admin Methods
export async function updateAdminEvent(id, changes) {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("events")
      .update(changes)
      .eq("id", id)
      .select()
      .single();
    return data;
  }
  const event = memoryStore.events.find((e) => e.id === id);
  if (event) Object.assign(event, changes);
  return event;
}

export async function deleteAdminEvent(id) {
  if (isSupabaseConfigured) {
    await supabase.from("events").delete().eq("id", id);
    return;
  }
  memoryStore.events = memoryStore.events.filter((e) => e.id !== id);
}

export async function updateAdminRequest(id, status) {
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from("staffing_requests")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    return data;
  }
  const req = memoryStore.requests.find((r) => r.id === id);
  if (req) req.status = status;
  return req;
}

export async function deleteAdminRequest(id) {
  if (isSupabaseConfigured) {
    await supabase.from("staffing_requests").delete().eq("id", id);
    return;
  }
  memoryStore.requests = memoryStore.requests.filter((r) => r.id !== id);
}

export async function deleteAdminUser(id) {
  if (isSupabaseConfigured) {
    await supabase.from("users").delete().eq("id", id);
    return;
  }
  memoryStore.users = memoryStore.users.filter((u) => u.id !== id);
}

export async function applyForEvent(workerId, eventId, duty) {
  const event = memoryStore.events.find((e) => e.id === eventId);
  if (!event) throw new Error("Event not found");

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
    supervisor: "Pradeep (Lead Supervisor)",
    status: "Accepted",
    images: Array.isArray(event.images) ? event.images : [],
    crew_briefing: event.crew_briefing || "",
    created_at: new Date().toISOString(),
  };

  event.assigned = (event.assigned || 0) + 1;
  memoryStore.shifts.unshift(newShift);

  if (isSupabaseConfigured) {
    await supabase.from("shifts").insert(newShift);
    await supabase.from("events").update({ assigned: event.assigned }).eq("id", eventId);
  }

  return newShift;
}
