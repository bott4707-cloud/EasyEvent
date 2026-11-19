import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Account, AppData, Event, EventStatus, RequestStatus, Role, ShiftStatus, StaffingRequest, Shift } from "../types";
import { api, ApiError, type EventInput, type SignupInput } from "../api/client";

interface AuthContextValue {
  currentUser: Account | null;
  appData: AppData;
  publicEvents: Event[];
  loading: boolean;
  isBackendConnected: boolean;
  login: (email: string, password: string) => Promise<Account>;
  signup: (input: SignupInput) => Promise<Account>;
  logout: () => Promise<void>;
  demoLogin: (role: Role) => Promise<Account>;
  refreshState: () => Promise<void>;
  updateShift: (shiftId: string, status: ShiftStatus) => Promise<void>;
  updateAvailability: (change: { available?: boolean; availableDates?: string[] }) => Promise<void>;
  applyForShift: (eventId: string, duty?: string) => Promise<void>;
  cancelWorkerShift: (shiftId: string) => Promise<boolean>;
  verifyAttendance: (shiftId: string, attended: boolean) => Promise<void>;
  createEvent: (input: EventInput) => Promise<boolean>;
  createRequest: (input: { eventId: string; quantity: number; duty: string }) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<void>;
  updateAdminEvent: (id: string, changes: Partial<Event> & { status?: EventStatus }) => Promise<void>;
  deleteAdminEvent: (id: string) => Promise<void>;
  updateAdminRequest: (id: string, status: RequestStatus) => Promise<void>;
  deleteAdminRequest: (id: string) => Promise<void>;
  deleteAdminUser: (id: string) => Promise<void>;
  uploadImage: (image: string, filename?: string) => Promise<{ url: string; storage: string; size: number }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "easyevent_app_state_v3";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          Array.isArray(parsed.users) &&
          parsed.users.some((u: Account) => u.id?.startsWith("demo-") || u.id?.startsWith("worker-demo"))
        ) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } else if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read local storage state", e);
    }
    return {
      users: [],
      events: [],
      requests: [],
      shifts: [],
      available: false,
      availableDates: [],
    };
  });

  // Save in local storage for smooth offline/fallback persistence
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
    } catch {
      // Ignore storage errors
    }
  }, [appData]);

  // Attempt backend handshake on startup
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const [events, session] = await Promise.all([
          api.loadEvents().catch(() => null),
          api.loadSession().catch((err) => {
            if (err instanceof ApiError && err.status === 401) return null;
            return null;
          }),
        ]);

        if (!active) return;

        if (events && Array.isArray(events)) {
          setPublicEvents(events);
          setIsBackendConnected(true);
        }

        if (session && session.user) {
          setCurrentUser(session.user);
          setAppData(session.data);
          setIsBackendConnected(true);
        }
      } catch (err) {
        console.info("Running in hybrid mode: Backend offline or unreachable.", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, []);

  const refreshState = useCallback(async () => {
    if (isBackendConnected) {
      try {
        const [session, events] = await Promise.all([api.reloadState(), api.loadEvents()]);
        setCurrentUser(session.user);
        try { localStorage.setItem("easyevent_has_account", "true"); } catch { }
        setAppData(session.data);
        setPublicEvents(events);
        return;
      } catch (err) {
        console.warn("Backend state refresh error", err);
      }
    }
  }, [isBackendConnected]);

  const login = useCallback(
    async (email: string, password: string): Promise<Account> => {
      const normalizedEmail = email.trim().toLowerCase();
      if (isBackendConnected) {
        const session = await api.login(normalizedEmail, password);
        setCurrentUser(session.user);
        try { localStorage.setItem("easyevent_has_account", "true"); } catch { }
        setAppData(session.data);
        if (session.data?.events) {
          setPublicEvents(session.data.events);
        }
        return session.user;
      }

      // Offline fallback login check
      const matched = appData.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (matched) {
        setCurrentUser(matched);
        return matched;
      }

      // If user not in initial set, auto create session as fallback
      const fallbackRole: Role = normalizedEmail.includes("admin")
        ? "admin"
        : normalizedEmail.includes("org")
          ? "organizer"
          : "worker";
      const user: Account = {
        id: `user-${Date.now()}`,
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: fallbackRole,
      };
      setAppData((prev) => ({ ...prev, users: [...prev.users, user] }));
      setCurrentUser(user);
      return user;
    },
    [isBackendConnected, appData.users]
  );

  const signup = useCallback(
    async (input: SignupInput): Promise<Account> => {
      if (isBackendConnected) {
        const session = await api.signup(input);
        setCurrentUser(session.user);
        try { localStorage.setItem("easyevent_has_account", "true"); } catch { }
        setAppData(session.data);
        if (session.data?.events) {
          setPublicEvents(session.data.events);
        }
        return session.user;
      }

      // Offline mode
      const newUser: Account = {
        id: `user-${Date.now()}`,
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        role: input.role,
      };
      setAppData((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
      }));
      setCurrentUser(newUser);
      return newUser;
    },
    [isBackendConnected]
  );

  const logout = useCallback(async () => {
    if (isBackendConnected) {
      try {
        await api.logout();
      } catch (err) {
        console.warn("Logout error", err);
      }
    }
    setCurrentUser(null);
  }, [isBackendConnected]);

  const demoLogin = useCallback(
    async (role: Role): Promise<Account> => {
      const email = `${role}@easyevent.in`;
      const password =
        role === "worker"
          ? "WorkerPassword2026!"
          : role === "organizer"
            ? "OrganizerPassword2026!"
            : "AdminPassword2026!";

      try {
        localStorage.setItem("easyevent_has_account", "true");
      } catch { }

      if (isBackendConnected) {
        try {
          const session = await api.login(email, password);
          setCurrentUser(session.user);
          setAppData(session.data);
          if (session.data?.events) {
            setPublicEvents(session.data.events);
          }
          return session.user;
        } catch (err) {
          console.warn("Backend demo login failed, falling back to local state", err);
        }
      }

      // Offline / immediate fallback
      const demoUser =
        appData.users.find((u) => u.role === role) || {
          id: `demo-${role}`,
          name: role === "worker" ? "Rohan Verma" : role === "organizer" ? "Ananya Rao" : "Administrator",
          email,
          role,
        };
      setCurrentUser(demoUser);
      return demoUser;
    },
    [isBackendConnected, appData.users]
  );

  const updateShift = useCallback(
    async (shiftId: string, status: ShiftStatus) => {
      if (isBackendConnected) {
        await api.updateShift(shiftId, status);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        shifts: prev.shifts.map((s) => (s.id === shiftId ? { ...s, status } : s)),
      }));
    },
    [isBackendConnected, refreshState]
  );

  const updateAvailability = useCallback(
    async (change: { available?: boolean; availableDates?: string[] }) => {
      // 1. Instant optimistic state update (0ms UI response)
      setAppData((prev) => {
        const nextAvail = change.available !== undefined ? change.available : prev.available;
        const nextDates = change.availableDates !== undefined ? change.availableDates : prev.availableDates;
        return {
          ...prev,
          available: nextAvail,
          availableDates: nextDates,
          users: prev.users.map((u) =>
            u.id === currentUser?.id || u.email.toLowerCase() === currentUser?.email.toLowerCase()
              ? { ...u, available: nextAvail, availableDates: nextDates }
              : u
          ),
        };
      });

      // 2. Non-blocking background sync to backend
      if (isBackendConnected) {
        api.updateAvailability(change).catch((err) => {
          console.warn("Could not sync availability to backend", err);
        });
      }
    },
    [isBackendConnected, currentUser]
  );

  const applyForShift = useCallback(
    async (eventId: string, duty?: string) => {
      if (isBackendConnected) {
        await api.applyForShift(eventId, duty);
        await refreshState();
        return;
      }
      const targetEvent = publicEvents.find((e) => e.id === eventId);
      const newShift: Shift = {
        id: `shift-${Date.now()}`,
        title: targetEvent?.title || "Special Event Assignment",
        venue: targetEvent?.venue || "Palace Grounds",
        address: targetEvent?.address || "Bengaluru, Karnataka",
        date: targetEvent?.date || new Date().toISOString().split("T")[0],
        reporting: targetEvent?.time || "09:00 AM",
        endTime: "05:00 PM",
        duty: duty || targetEvent?.duty || "Ushering",
        supervisor: "Pradeep (Lead Supervisor)",
        status: "Accepted",
      };
      setAppData((prev) => ({
        ...prev,
        shifts: [newShift, ...prev.shifts],
        events: prev.events.map((e) =>
          e.id === eventId ? { ...e, assigned: (e.assigned || 0) + 1 } : e
        ),
      }));
    },
    [isBackendConnected, publicEvents, refreshState]
  );

  const cancelWorkerShift = useCallback(
    async (shiftId: string): Promise<boolean> => {
      let targetEventId: string | undefined;
      setAppData((prev) => {
        const targetShift = prev.shifts.find((s) => s.id === shiftId);
        targetEventId = targetShift?.event_id || undefined;
        return {
          ...prev,
          shifts: prev.shifts.map((s) =>
            s.id === shiftId ? { ...s, status: "Cancelled" as ShiftStatus } : s
          ),
          events: prev.events.map((e) =>
            e.id === targetEventId ? { ...e, assigned: Math.max(0, (e.assigned || 1) - 1) } : e
          ),
        };
      });

      if (targetEventId) {
        setPublicEvents((prev) =>
          prev.map((e) =>
            e.id === targetEventId ? { ...e, assigned: Math.max(0, (e.assigned || 1) - 1) } : e
          )
        );
      }

      if (isBackendConnected) {
        try {
          await api.cancelWorkerShift(shiftId);
        } catch (err) {
          console.warn("Backend shift cancel failed", err);
          throw err;
        }
      }
      return true;
    },
    [isBackendConnected]
  );

  const verifyAttendance = useCallback(
    async (shiftId: string, attended: boolean): Promise<void> => {
      setAppData((prev) => {
        const nextStatus: ShiftStatus = attended ? "Completed" : "Did Not Attend";
        const targetShift = prev.shifts.find((s) => s.id === shiftId);
        const workerId = targetShift?.worker_id;

        return {
          ...prev,
          shifts: prev.shifts.map((s) =>
            s.id === shiftId
              ? {
                  ...s,
                  status: nextStatus,
                  attended,
                  paymentDelayed: !attended,
                  payment_delayed: !attended,
                  payoutStatus: attended ? "Credited" : "Delayed / Under Review",
                  payout_status: attended ? "Credited" : "Delayed / Under Review",
                }
              : s
          ),
          users: prev.users.map((u) => {
            if (u.id === workerId && !attended) {
              const warnings = (u.warnings || 0) + 1;
              const suspendedUntil =
                warnings >= 2 ? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() : null;
              return {
                ...u,
                warnings,
                warningReason:
                  warnings >= 2
                    ? "Suspended for 2 days due to 2 unattended shifts."
                    : `Warning #1: Shift unattended (${targetShift?.title || "Event"}). Payment delayed.`,
                suspendedUntil,
              };
            }
            return u;
          }),
        };
      });

      if (isBackendConnected) {
        try {
          await api.verifyAttendance(shiftId, attended);
        } catch (err) {
          console.warn("Backend attendance verification failed", err);
        }
      }
    },
    [isBackendConnected]
  );

  const createEvent = useCallback(
    async (input: EventInput): Promise<boolean> => {
      if (isBackendConnected) {
        await api.createEvent(input);
        await refreshState();
        return true;
      }
      const newEvent: Event = {
        id: `event-${Date.now()}`,
        title: input.title,
        venue: input.venue,
        address: `${input.venue}, Bengaluru, Karnataka`,
        date: input.date,
        time: input.time,
        duty: input.duty,
        required: input.required,
        assigned: 0,
        status: "Pending approval",
      };
      setAppData((prev) => ({
        ...prev,
        events: [newEvent, ...prev.events],
      }));
      setPublicEvents((prev) => [newEvent, ...prev]);
      return true;
    },
    [isBackendConnected, refreshState]
  );

  const createRequest = useCallback(
    async (input: { eventId: string; quantity: number; duty: string }): Promise<boolean> => {
      if (isBackendConnected) {
        await api.createRequest(input);
        await refreshState();
        return true;
      }
      const newReq: StaffingRequest = {
        id: `req-${Date.now()}`,
        eventId: input.eventId,
        quantity: input.quantity,
        duty: input.duty,
        status: "Pending",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setAppData((prev) => ({
        ...prev,
        requests: [newReq, ...prev.requests],
      }));
      return true;
    },
    [isBackendConnected, refreshState]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      if (isBackendConnected) {
        await api.cancelRequest(requestId);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        requests: prev.requests.map((r) =>
          r.id === requestId ? { ...r, status: "Cancelled" as RequestStatus } : r
        ),
      }));
    },
    [isBackendConnected, refreshState]
  );

  const updateAdminEvent = useCallback(
    async (id: string, changes: Partial<Event> & { status?: EventStatus }) => {
      if (isBackendConnected) {
        await api.updateEvent(id, changes);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        events: prev.events.map((e) => (e.id === id ? { ...e, ...changes } : e)),
      }));
      setPublicEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));
    },
    [isBackendConnected, refreshState]
  );

  const deleteAdminEvent = useCallback(
    async (id: string) => {
      if (isBackendConnected) {
        await api.deleteEvent(id);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        events: prev.events.filter((e) => e.id !== id),
        requests: prev.requests.filter((r) => r.eventId !== id),
      }));
      setPublicEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [isBackendConnected, refreshState]
  );

  const updateAdminRequest = useCallback(
    async (id: string, status: RequestStatus) => {
      if (isBackendConnected) {
        await api.updateRequest(id, status);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        requests: prev.requests.map((r) => (r.id === id ? { ...r, status } : r)),
      }));
    },
    [isBackendConnected, refreshState]
  );

  const deleteAdminRequest = useCallback(
    async (id: string) => {
      if (isBackendConnected) {
        await api.deleteRequest(id);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        requests: prev.requests.filter((r) => r.id !== id),
      }));
    },
    [isBackendConnected, refreshState]
  );

  const deleteAdminUser = useCallback(
    async (id: string) => {
      if (isBackendConnected) {
        await api.deleteUser(id);
        await refreshState();
        return;
      }
      setAppData((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id),
      }));
    },
    [isBackendConnected, refreshState]
  );

  const uploadImage = useCallback(
    async (image: string, filename?: string) => {
      return await api.uploadImage(image, filename);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appData,
        publicEvents,
        loading,
        isBackendConnected,
        login,
        signup,
        logout,
        demoLogin,
        refreshState,
        updateShift,
        updateAvailability,
        applyForShift,
        cancelWorkerShift,
        verifyAttendance,
        createEvent,
        createRequest,
        cancelRequest,
        updateAdminEvent,
        deleteAdminEvent,
        updateAdminRequest,
        deleteAdminRequest,
        deleteAdminUser,
        uploadImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
