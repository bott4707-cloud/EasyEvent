import type { Event, Shift, StaffingRequest, Account, Venue } from "../types";

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

export const PREVIEW_VENUES: Venue[] = [
  {
    name: "Palace Grounds",
    area: "Central Bengaluru",
    capacity: 5000,
    kind: "Outdoor & Heritage Grounds",
    features: ["VIP Pavilion", "Valet Parking", "Large Stage Space", "Power Backup"],
  },
  {
    name: "Garden Pavilion",
    area: "North Bengaluru",
    capacity: 500,
    kind: "Outdoor Lawn & Covered Canopy",
    features: ["Lush Greenery", "Catering Kitchen", "Ambient Lighting"],
  },
  {
    name: "The Assembly Hall",
    area: "Whitefield",
    capacity: 1200,
    kind: "Modern Convention Center",
    features: ["Acoustic Treatment", "High-speed Wi-Fi", "Green Rooms"],
  },
  {
    name: "Bengaluru Palace Courtyard",
    area: "Central Bengaluru",
    capacity: 850,
    kind: "Historic Royal Venue",
    features: ["Grand Architecture", "Heritage Ambience", "Dedicated Security Gate"],
  },
  {
    name: "BIEC Exhibition Centre",
    area: "Tumkur Road / North-West",
    capacity: 10000,
    kind: "Mega Convention & Exhibition Hall",
    features: ["Industrial Loading Docks", "Heavy AV Rigging", "Helipad Access"],
  },
  {
    name: "Cubbon Park Amphitheatre",
    area: "Kasturba Road",
    capacity: 600,
    kind: "Open-air Cultural Pavilion",
    features: ["Natural Canopy", "Central Metro Access", "Public Restrooms"],
  },
];

export const INITIAL_EVENTS: Event[] = [
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
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Report to Gate 3 security booth by 3:30 PM sharp. Dress Code: All-black formal shirt & trousers. Collect your crew accreditation pass from On-Site Lead Priya Sharma. Dinner meal tokens provided.",
    description: "An evening cultural gala celebrating heritage, music, and performing arts with 3,000+ dignitaries and guests.",
  },
  {
    id: "makers-market",
    title: "The Makers Weekend Bengaluru",
    venue: "Whitefield Convention Centre",
    address: "Whitefield Main Road, Bengaluru, Karnataka 560066",
    date: "2026-11-28",
    time: "08:00",
    duty: "Guest relations",
    required: 18,
    assigned: 12,
    status: "Published",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Check in at North Entrance lobby desk by 7:30 AM. Briefing will be held by Floor Lead Arjun Nair at 7:45 AM. Ensure guest badges and welcome kits are arranged at the registration counter.",
    description: "Premier artisan and startup exhibition bringing together over 150 innovators, food curators, and designers.",
  },
  {
    id: "food-stories",
    title: "Food Stories Gourmet Festival",
    venue: "Jayamahal Palace Lawn",
    address: "Jayamahal Road, Bengaluru, Karnataka 560046",
    date: "2026-12-12",
    time: "11:00",
    duty: "Catering support",
    required: 22,
    assigned: 15,
    status: "Published",
    images: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Assemble at the Main Kitchen tent area at 10:15 AM. Wear hairnets, company apron (provided on-site), and comfortable closed-toe non-slip shoes. Coordinate with Chef Lead Rajesh.",
    description: "Three-day outdoor culinary festival featuring masterclasses, live counters, and acoustic evening sessions.",
  },
  {
    id: "design-meet",
    title: "Global Tech & Design Forum 2027",
    venue: "BIEC Convention Centre",
    address: "10th Mile, Tumkur Road, Madavara, Bengaluru 562123",
    date: "2027-01-09",
    time: "09:00",
    duty: "AV & technical support",
    required: 14,
    assigned: 8,
    status: "Published",
    images: [
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Arrive at Hall 2 Tech Console by 8:15 AM. Run mic checks with Stage Director Nikhil. Keep backup handheld wireless mics and HDMI splitters ready in the backstage rack.",
    description: "Enterprise technology forum featuring keynotes from Silicon Valley and Indian startup founders.",
  },
  {
    id: "community-run",
    title: "Good Morning Bengaluru Marathon",
    venue: "Cubbon Park Amphitheatre",
    address: "Kasturba Road, Bengaluru, Karnataka 560001",
    date: "2026-11-22",
    time: "05:30",
    duty: "Crowd guidance",
    required: 25,
    assigned: 20,
    status: "Published",
    images: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Reporting time: 5:00 AM sharp at Amphitheatre Main Flagoff point. High-visibility reflective vests and megaphones will be handed out by Race Director Vikram Sen.",
    description: "Annual 10K and Half Marathon around scenic Cubbon Park promoting urban wellness and green Bengaluru.",
  },
  {
    id: "winter-conference",
    title: "Bengaluru Enterprise Exchange",
    venue: "The Assembly Hall",
    address: "ITPL Main Road, Whitefield, Bengaluru 560066",
    date: "2026-12-19",
    time: "07:30",
    duty: "Registration & check-in",
    required: 32,
    assigned: 24,
    status: "Published",
    images: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Registration desks open at 7:30 AM. Collect QR scanner iPads from Level 1 Helpdesk. Business casual attire required (Navy/Black). Coffee and breakfast available for crew at 7:00 AM.",
    description: "High-level B2B summit bringing together CXOs, institutional investors, and enterprise leaders.",
  },
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: "shift-today-tech-summit",
    title: "Bengaluru Tech Summit 2026",
    venue: "Bengaluru Palace (Main Arena)",
    address: "Palace Road, Vasanth Nagar, Bengaluru, Karnataka 560052",
    date: "2026-11-12",
    reporting: "08:30 AM",
    endTime: "05:00 PM",
    duty: "Stage Support / AV",
    supervisor: "Suresh Gowda (+91 98450 11223)",
    status: "Completed",
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Main Arena Backstage Access Pass code: TECH-26. Report to Stage Ops desk behind Screen A. Wear company black crew tee. Shift completed and attendance verified by Suresh Gowda.",
  },
  {
    id: "shift-city-lights",
    title: "City Lights Cultural Night",
    venue: "Palace Grounds",
    address: "Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006",
    date: "2026-11-14",
    reporting: "4:00 PM",
    endTime: "10:30 PM",
    duty: "Ushering",
    supervisor: "Priya Sharma (+91 98450 12345)",
    status: "Assigned",
    images: [
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Report to Gate 3 security booth by 3:30 PM sharp. Dress Code: All-black formal shirt & trousers. Collect your crew accreditation pass from On-Site Lead Priya Sharma. Dinner meal tokens provided.",
  },
  {
    id: "shift-makers-market",
    title: "The Makers Weekend Bengaluru",
    venue: "Whitefield Convention Centre",
    address: "Whitefield Main Road, Bengaluru, Karnataka 560066",
    date: "2026-11-28",
    reporting: "8:00 AM",
    endTime: "3:30 PM",
    duty: "Guest relations",
    supervisor: "Arjun Nair (+91 97410 56789)",
    status: "Accepted",
    images: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Check in at North Entrance lobby desk by 7:30 AM. Briefing will be held by Floor Lead Arjun Nair at 7:45 AM. Ensure guest badges and welcome kits are arranged at the registration counter.",
  },
  {
    id: "shift-community-run",
    title: "Good Morning Bengaluru Marathon",
    venue: "Cubbon Park Amphitheatre",
    address: "Kasturba Road, Bengaluru, Karnataka 560001",
    date: "2026-10-18",
    reporting: "5:30 AM",
    endTime: "10:00 AM",
    duty: "Crowd guidance",
    supervisor: "Vikram Sen (+91 99000 88776)",
    status: "Completed",
    images: [
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
    ],
    crew_briefing: "Reporting time: 5:00 AM sharp at Amphitheatre Main Flagoff point. High-visibility reflective vests and megaphones will be handed out by Race Director Vikram Sen.",
  },
];

export const INITIAL_REQUESTS: StaffingRequest[] = [
  {
    id: "req-1",
    eventId: "city-lights",
    quantity: 6,
    duty: "Stagehand support",
    status: "Pending",
    createdAt: "2026-11-01",
  },
  {
    id: "req-2",
    eventId: "food-stories",
    quantity: 4,
    duty: "Cleanup",
    status: "Approved",
    createdAt: "2026-10-29",
  },
];

export const INITIAL_USERS: Account[] = [
  {
    id: "worker-demo",
    name: "Rohan Verma",
    email: "worker@easyevent.in",
    role: "worker",
    available: true,
    availableDates: ["2026-11-15", "2026-11-16", "2026-11-21", "2026-11-22"],
  },
  {
    id: "worker-pooja",
    name: "Pooja Hegde",
    email: "pooja.crew@easyevent.in",
    role: "worker",
    available: true,
    availableDates: ["2026-11-15", "2026-11-17", "2026-11-18", "2026-11-19"],
  },
  {
    id: "worker-vikram",
    name: "Vikram Sen",
    email: "vikram.crew@easyevent.in",
    role: "worker",
    available: false,
    availableDates: [],
  },
  { id: "organizer-demo", name: "Ananya Rao", email: "organizer@easyevent.in", role: "organizer" },
  { id: "admin-demo", name: "Mehul Admin", email: "admin@easyevent.in", role: "admin" },
];

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function getShiftCancellationEligibility(shiftDate: string, reportingTime: string): {
  canCancel: boolean;
  hoursRemaining: number;
  message: string;
} {
  let hours = 9;
  let minutes = 0;
  if (reportingTime && reportingTime.includes(":")) {
    const raw = reportingTime.replace(/[^0-9:]/g, "").split(":");
    hours = parseInt(raw[0], 10) || 9;
    minutes = parseInt(raw[1], 10) || 0;
    const isPM = reportingTime.toLowerCase().includes("pm");
    const isAM = reportingTime.toLowerCase().includes("am");
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  }

  const shiftDateTime = new Date(`${shiftDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  const now = new Date();
  const diffHours = (shiftDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours > 4) {
    return {
      canCancel: true,
      hoursRemaining: diffHours,
      message: `Free cancellation allowed (${diffHours.toFixed(1)}h remaining). You can cancel up to 4 hours before.`,
    };
  } else if (diffHours > 0) {
    return {
      canCancel: false,
      hoursRemaining: diffHours,
      message: `Cancellation locked (${diffHours.toFixed(1)}h remaining). Shifts cannot be cancelled within 4 hours of reporting time.`,
    };
  } else {
    return {
      canCancel: false,
      hoursRemaining: 0,
      message: `Event is on-site or completed. Cancellation is closed.`,
    };
  }
}

export function formatTime(value: string): string {
  if (!value) return "";
  if (value.includes("AM") || value.includes("PM")) return value;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, hours, minutes),
  );
}

// Bengaluru Event Crew Standard Hourly Rates (INR)
export const DUTY_HOURLY_RATES: Record<string, number> = {
  "Usher / Registration": 200,
  "Ushering": 200,
  "Registration & check-in": 200,
  "Stagehand support": 220,
  "Stage Support / AV": 250,
  "AV & technical support": 250,
  "Guest relations": 220,
  "Crowd guidance": 200,
  "Crowd Management": 200,
  "Hospitality Crew": 220,
  "Hospitality": 220,
  "Technical Production": 280,
  "Brand Ambassador": 240,
  "Logistics & Setup": 210,
  "Cleanup": 180,
};

export function getDutyHourlyRate(duty: string): number {
  if (DUTY_HOURLY_RATES[duty]) return DUTY_HOURLY_RATES[duty];
  const lower = duty.toLowerCase();
  for (const [key, rate] of Object.entries(DUTY_HOURLY_RATES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return rate;
    }
  }
  return 200; // default ₹200/hr
}

export function parseShiftHours(reporting: string, endTime: string): number {
  const parseMinutes = (timeStr: string) => {
    if (!timeStr) return null;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(match[2]);
  };
  const start = parseMinutes(reporting);
  const end = parseMinutes(endTime);
  if (start === null || end === null) return 8; // default 8h shift
  const diffMinutes = (end - start + 1440) % 1440;
  return Math.max(1, Math.round((diffMinutes / 60) * 10) / 10);
}
