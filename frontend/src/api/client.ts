import type { Account, AppData, Event, EventStatus, RequestStatus, Role, ShiftStatus, StaffingRequest } from "../types";

export interface AppState {
  user: Account;
  data: AppData;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "admin">;
}

export interface EventInput {
  title: string;
  venue: string;
  date: string;
  time: string;
  duty: string;
  required: number;
  images?: string[];
  crew_briefing?: string;
  description?: string;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body = await response.text();
      if (body) {
        try {
          const parsed: unknown = JSON.parse(body);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            "detail" in parsed &&
            typeof (parsed as { detail: unknown }).detail === "string"
          ) {
            message = (parsed as { detail: string }).detail;
          } else {
            message = body;
          }
        } catch {
          message = body;
        }
      }
    } catch (err) {
      console.error("Could not read API error response", err);
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  loadSession: () => request<AppState>("/api/auth/me"),
  loadEvents: () => request<Event[]>("/api/events/public"),
  login: (email: string, password: string) =>
    request<AppState>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  signup: (input: SignupInput) =>
    request<AppState>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  logout: () => request<void>("/api/auth/logout", { method: "POST" }),
  reloadState: () => request<AppState>("/api/state"),
  createEvent: (input: EventInput) =>
    request<Event>("/api/organizer/events", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createRequest: (input: { eventId: string; quantity: number; duty: string }) =>
    request<StaffingRequest>("/api/organizer/requests", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  cancelRequest: (id: string) =>
    request<StaffingRequest>(`/api/organizer/requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
    }),
  updateShift: (id: string, status: ShiftStatus) =>
    request<void>(`/api/worker/shifts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  updateAvailability: (input: { available?: boolean; availableDates?: string[] }) =>
    request<void>("/api/worker/availability", {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  applyForShift: (eventId: string, duty?: string) =>
    request<void>("/api/worker/apply", {
      method: "POST",
      body: JSON.stringify({ eventId, duty }),
    }),
  updateEvent: (id: string, changes: Partial<Event> & { status?: EventStatus }) =>
    request<Event>(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    }),
  deleteEvent: (id: string) =>
    request<void>(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  updateRequest: (id: string, status: RequestStatus) =>
    request<StaffingRequest>(`/api/admin/requests/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteRequest: (id: string) =>
    request<void>(`/api/admin/requests/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  deleteUser: (id: string) =>
    request<void>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
