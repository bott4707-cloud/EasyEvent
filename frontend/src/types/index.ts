export type Role = "worker" | "organizer" | "admin";

export type ShiftStatus = "Assigned" | "Accepted" | "Reporting" | "Completed" | "Cancelled";
export type EventStatus = "Pending approval" | "Published" | "Rejected";
export type RequestStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface Account {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Event {
  id: string;
  title: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  duty: string;
  required: number;
  assigned: number;
  status: EventStatus;
  owner_id?: string | null;
  images?: string[];
  crew_briefing?: string;
  description?: string;
}

export interface StaffingRequest {
  id: string;
  eventId: string;
  quantity: number;
  duty: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Shift {
  id: string;
  worker_id?: string | null;
  event_id?: string | null;
  title: string;
  venue: string;
  address: string;
  date: string;
  reporting: string;
  endTime: string;
  end_time?: string;
  duty: string;
  supervisor: string;
  status: ShiftStatus;
  images?: string[];
  crew_briefing?: string;
}

export interface AppData {
  users: Account[];
  events: Event[];
  requests: StaffingRequest[];
  shifts: Shift[];
  available: boolean;
  availableDates: string[];
}

export interface PreviewEvent extends Event {
  city: string;
  roles: string[];
  description: string;
}

export interface Venue {
  name: string;
  area: string;
  capacity: number;
  kind: string;
  image?: string;
  features?: string[];
}
