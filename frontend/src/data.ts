export const DUTIES = [
  "Registration & check-in",
  "Ushering",
  "Guest relations",
  "Setup & teardown",
  "Catering support",
  "AV & technical support",
  "Stagehand support",
  "Crowd guidance",
  "Cleanup",
] as const;

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
  title: string;
  venue: string;
  address: string;
  date: string;
  reporting: string;
  endTime: string;
  duty: string;
  supervisor: string;
  status: ShiftStatus;
}

export interface AppData {
  users: Account[];
  events: Event[];
  requests: StaffingRequest[];
  shifts: Shift[];
  available: boolean;
  availableDates: string[];
}

export interface PreviewEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string;
  time: string;
  roles: string[];
  required: number;
  assigned: number;
  description: string;
}

export const PREVIEW_VENUES = [
  { name: "Garden Pavilion", area: "North Bengaluru", capacity: 500, kind: "Outdoor & indoor" },
  { name: "The Assembly Hall", area: "Whitefield", capacity: 1200, kind: "Convention hall" },
  { name: "Bengaluru Palace Courtyard", area: "Central Bengaluru", capacity: 350, kind: "Heritage venue" },
  { name: "Bengaluru Convention Centre", area: "North Bengaluru", capacity: 900, kind: "Convention hall" },
];
