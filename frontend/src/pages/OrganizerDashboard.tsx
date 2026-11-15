import { useState, type FormEvent, type ChangeEvent } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Sparkles,
  Building2,
  Briefcase,
  ShieldAlert,
  X,
  Phone,
  Camera,
  Lock,
  Edit3,
  UserCheck,
  UserX,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { LanguageSelector } from "../components/common/LanguageSelector";
import { DUTIES, formatDate, formatTime, getDutyHourlyRate, dateKey } from "../data/mockData";
import { type Event } from "../types";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import { Modal } from "../components/common/Modal";

const VENUE_PRESETS = [
  {
    name: "Palace Grounds",
    url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "BIEC Convention",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "KTPO Whitefield",
    url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Jayamahal Palace",
    url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&auto=format&fit=crop&q=80",
  },
  {
    name: "Cubbon Park",
    url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
  },
];

export function OrganizerDashboard({ navigate }: { navigate: (route: string) => void }) {
  const { currentUser, appData, createEvent, createRequest, cancelRequest, updateAdminEvent } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form states for creating event
  const [eventTitle, setEventTitle] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuty, setEventDuty] = useState<string>(DUTIES[0]);
  const [eventRequired, setEventRequired] = useState("15");
  const [eventImages, setEventImages] = useState<string[]>([]);
  const [eventCrewBriefing, setEventCrewBriefing] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Modal state for editing briefing
  const [editingBriefingEvent, setEditingBriefingEvent] = useState<Event | null>(null);
  const [updatedBriefingText, setUpdatedBriefingText] = useState("");

  // Form states for staffing request
  const [selectedEventId, setSelectedEventId] = useState("");
  const [requestDuty, setRequestDuty] = useState<string>(DUTIES[0]);
  const [requestQty, setRequestQty] = useState("5");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Filter for events
  const [eventFilter, setEventFilter] = useState<"all" | "active" | "shortage">("all");

  // STRICT ACCESS ISOLATION:
  if (!currentUser) {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <Sparkles size={36} />
          </div>
          <h2 className="restriction-title">Event Organizer Sign In Required</h2>
          <p className="restriction-text">
            Please sign in with your Event Organizer credentials to publish events,
            upload venue photos, broadcast briefings, and manage crew staffing.
          </p>
          <div className="button-row justify-center">
            <Button
              variant="primary"
              icon={<Sparkles size={16} />}
              onClick={() => navigate("/auth/organizer")}
            >
              Sign In as Event Organizer
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If signed in as non-organizer (worker or admin), STRICTLY BLOCK access:
  if (currentUser.role !== "organizer") {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <ShieldAlert size={36} />
          </div>
          <h2 className="restriction-title">Access Restricted · Event Organizer Studio Only</h2>
          <p className="restriction-text">
            You are signed in as <strong>{currentUser.name}</strong> with the{" "}
            <span className="restriction-role-pill">{currentUser.role === "worker" ? "CREW'S" : currentUser.role.toUpperCase()}</span> role.
            For privacy, data protection, and operational security, each role is strictly isolated.
            Crew's and event organizers cannot view each other's dashboards.
          </p>
          <div className="button-row justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(`/${currentUser.role}`)}
            >
              Return to Your {currentUser.role === "worker" ? "Crew's Dashboard" : "Admin Console"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Metrics
  const myEvents = appData.events.filter(
    (e) => !currentUser || e.owner_id === currentUser.id || !e.owner_id
  );

  const totalRequired = myEvents.reduce((acc, e) => acc + (e.required || 0), 0);
  const totalAssigned = myEvents.reduce((acc, e) => acc + Math.min(e.assigned || 0, e.required || 0), 0);
  const totalShortage = Math.max(0, totalRequired - totalAssigned);

  const myRequests = appData.requests.filter((r) => r.status !== "Cancelled");

  // Crew assigned to organizer's events
  const eventTitles = new Set(myEvents.map((e) => e.title));
  const assignedCrewShifts = appData.shifts.filter(
    (s) => (s.event_id && myEvents.some((e) => e.id === s.event_id)) || eventTitles.has(s.title)
  );

  const registeredWorkers = appData.users.filter((u) => u.role === "worker");
  const today = new Date();

  // Handle local image file upload (1 or 2 images)
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (eventImages.length >= 2) {
      showToast("Maximum 2 place photos allowed per event.", "error");
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEventImages((prev) => (prev.length < 2 ? [...prev, dataUrl] : prev));
        showToast("Place photo added! (Max 2 photos)");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddPresetPhoto = (url: string) => {
    if (eventImages.length >= 2) {
      showToast("Maximum 2 place photos allowed.", "error");
      return;
    }
    if (eventImages.includes(url)) {
      showToast("Photo already added.", "error");
      return;
    }
    setEventImages((prev) => [...prev, url]);
    showToast("Venue photo attached!");
  };

  const handleRemovePhoto = (index: number) => {
    setEventImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Event Creation
  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventVenue.trim()) {
      showToast("Please provide event title and venue.", "error");
      return;
    }
    const crew = Number(eventRequired);
    if (!crew || crew < 1 || crew > 5000) {
      showToast("Please specify required crew between 1 and 5000.", "error");
      return;
    }

    setIsSubmittingEvent(true);
    try {
      const ok = await createEvent({
        title: eventTitle.trim(),
        venue: eventVenue.trim(),
        date: eventDate,
        time: eventTime,
        duty: eventDuty,
        required: crew,
        images: eventImages.slice(0, 2),
        crew_briefing: eventCrewBriefing.trim(),
        description: eventDescription.trim(),
      });

      if (ok) {
        showToast("New event published with venue photos and crew briefing!");
        setIsCreateModalOpen(false);
        setEventTitle("");
        setEventVenue("");
        setEventDate("");
        setEventTime("");
        setEventImages([]);
        setEventCrewBriefing("");
        setEventDescription("");
      }
    } catch {
      showToast("Failed to create event. Please try again.", "error");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Handle Staffing Request Creation
  const handleCreateRequest = async (e: FormEvent) => {
    e.preventDefault();
    const eventId = selectedEventId || myEvents[0]?.id;
    if (!eventId) {
      showToast("Please select an event for the crew request.", "error");
      return;
    }
    const qty = Number(requestQty);
    if (!qty || qty < 1 || qty > 500) {
      showToast("Enter extra crew needed between 1 and 500.", "error");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const ok = await createRequest({
        eventId,
        quantity: qty,
        duty: requestDuty,
      });

      if (ok) {
        showToast("Crew staffing request dispatched!");
        setIsRequestModalOpen(false);
        setRequestQty("5");
      }
    } catch {
      showToast("Failed to submit request.", "error");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    try {
      await cancelRequest(reqId);
      showToast("Staffing request withdrawn.");
    } catch {
      showToast("Could not cancel request.", "error");
    }
  };

  const handleSaveBriefingUpdate = async () => {
    if (!editingBriefingEvent) return;
    try {
      await updateAdminEvent(editingBriefingEvent.id, {
        crew_briefing: updatedBriefingText.trim(),
      });
      showToast("Private briefing updated! Visible to attending crew members.");
      setEditingBriefingEvent(null);
    } catch {
      showToast("Could not update briefing.", "error");
    }
  };

  const visibleEvents = myEvents.filter((event) => {
    if (eventFilter === "active") return event.status === "Published";
    if (eventFilter === "shortage") return event.assigned < event.required;
    return true;
  });

  return (
    <div className="dashboard-page-container">
      {/* Top Banner with Language Selector on Upper Right */}
      <div className="dashboard-header-block">
        <div>
          <span className="dashboard-eyebrow">{t("org_eyebrow")}</span>
          <h1 className="dashboard-title">
            {t("org_title", { name: currentUser?.name || "Event Organizer" })}
          </h1>
          <p className="dashboard-subtitle">{t("org_subtitle")}</p>
        </div>

        <div className="dashboard-header-actions">
          {/* Upper Right Indian Language Selector */}
          <LanguageSelector variant="header" />

          <Button
            variant="outline"
            icon={<Users size={16} />}
            onClick={() => {
              if (myEvents.length > 0) setSelectedEventId(myEvents[0].id);
              setIsRequestModalOpen(true);
            }}
          >
            {t("btn_request_crew")}
          </Button>

          <Button
            variant="primary"
            style={{ background: "var(--organizer)" }}
            icon={<Plus size={16} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {t("btn_create_event")}
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-cards-grid">
        <StatCard
          label="Events Managed"
          value={myEvents.length}
          caption="Under your orchestration"
          color="blue"
          icon={<Building2 size={22} />}
        />
        <StatCard
          label="Total Crew Needed"
          value={totalRequired}
          caption="Total on-site positions"
          color="purple"
          icon={<Users size={22} />}
        />
        <StatCard
          label="Crew Assigned"
          value={totalAssigned}
          caption="Confirmed on duty"
          color="emerald"
          icon={<CheckCircle2 size={22} />}
        />
        <StatCard
          label="Staffing Shortage"
          value={totalShortage}
          caption={totalShortage > 0 ? "Extra crew members needed" : "All positions fully filled"}
          color={totalShortage > 0 ? "amber" : "emerald"}
          icon={<AlertTriangle size={22} />}
        />
      </div>

      {/* Managed Events Section */}
      <section className="events-manage-section">
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">Your Managed Events</h2>
            <p className="muted-text">
              Real-time staffing status, venue entrance photos (1-2), and private crew briefings.
            </p>
          </div>

          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${eventFilter === "all" ? "active" : ""}`}
              onClick={() => setEventFilter("all")}
            >
              All Events ({myEvents.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${eventFilter === "active" ? "active" : ""}`}
              onClick={() => setEventFilter("active")}
            >
              Active
            </button>
            <button
              type="button"
              className={`filter-pill ${eventFilter === "shortage" ? "active" : ""}`}
              onClick={() => setEventFilter("shortage")}
            >
              Shortage ({myEvents.filter((e) => e.assigned < e.required).length})
            </button>
          </div>
        </div>

        <div className="shifts-list-stack">
          {visibleEvents.map((event) => {
            const shortage = Math.max(0, event.required - event.assigned);
            const rate = getDutyHourlyRate(event.duty);
            const images = event.images && event.images.length > 0 ? event.images : null;

            return (
              <Card key={event.id} variant="default" className="shift-item-card">
                {/* 1 or 2 Venue Place Photos */}
                {images && images.length > 0 && (
                  <div
                    className={`venue-place-photos-banner ${images.length === 2 ? "dual" : "single"
                      }`}
                  >
                    {images.slice(0, 2).map((imgUrl, idx) => (
                      <div key={idx} style={{ position: "relative", height: "100%" }}>
                        <img
                          src={imgUrl}
                          alt={`${event.venue} view ${idx + 1}`}
                          className="place-photo-img-item"
                          loading="lazy"
                        />
                        <span className="photo-counter-tag">
                          <Camera size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                          Venue Photo {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="shift-card-top">
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span className="shift-duty-pill">{event.duty}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--emerald)" }}>
                        ₹{rate}/hr standard crew rate
                      </span>
                    </div>
                    <h3 className="shift-title">{event.title}</h3>
                    <div className="shift-date-time-row">
                      <span>
                        <Calendar size={14} /> {formatDate(event.date)}
                      </span>
                      <span>
                        <Clock size={14} /> Reporting: {formatTime(event.time)}
                      </span>
                      <span>
                        <MapPin size={14} /> {event.venue}
                      </span>
                    </div>
                  </div>
                  <Badge status={event.status} />
                </div>

                <div className="shift-details-grid">
                  <div className="shift-detail-item">
                    <span className="detail-label">Staffing Status</span>
                    <span className="detail-value">
                      {event.assigned} / {event.required} Crew Confirmed
                    </span>
                    <span className="detail-sub">
                      {shortage > 0 ? (
                        <span style={{ color: "var(--amber)", fontWeight: 700 }}>
                          ⚠️ {shortage} Crew Members Needed
                        </span>
                      ) : (
                        <span style={{ color: "var(--emerald)", fontWeight: 700 }}>
                          ✓ Full Crew Deployed
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="shift-detail-item">
                    <span className="detail-label">Location & Map Address</span>
                    <span className="detail-value">{event.venue}</span>
                    <span className="detail-sub">{event.address}</span>
                  </div>
                </div>

                {/* Confidential Briefing Notice from Organizer */}
                <div className="crew-private-briefing-box">
                  <div className="briefing-box-header">
                    <span className="briefing-title-group">
                      <Lock size={14} /> {t("label_crew_briefing")}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "2px 8px", fontSize: "0.75rem", height: "auto" }}
                      onClick={() => {
                        setEditingBriefingEvent(event);
                        setUpdatedBriefingText(event.crew_briefing || "");
                      }}
                    >
                      <Edit3 size={12} style={{ marginRight: 4 }} /> Edit Briefing
                    </button>
                  </div>
                  <p className="briefing-text-content">
                    {event.crew_briefing ||
                      "No confidential briefing added yet. Add instructions like dress code, supervisor phone, and back entrance access."}
                  </p>
                  <span className="briefing-footer-note">
                    🔒 {t("briefing_helper")}
                  </span>
                </div>

                <div className="shift-actions-row">
                  {shortage > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={14} />}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setRequestQty(String(shortage));
                        setIsRequestModalOpen(true);
                      }}
                    >
                      Request {shortage} Extra Crew
                    </Button>
                  )}
                  <a
                    className="btn btn-ghost btn-sm external-dir-link"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      `${event.venue}, ${event.address}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin size={14} />
                    <span>View Venue Map</span>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Staffing Requests Section */}
      <section className="staffing-requests-section" style={{ marginTop: 40 }}>
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">Active Staffing Requests</h2>
            <p className="muted-text">Live dispatch requests sent to the Crew's network.</p>
          </div>
        </div>

        <div className="shifts-list-stack">
          {myRequests.map((req) => (
            <Card key={req.id} variant="default" className="shift-item-card">
              <div className="shift-card-top">
                <div>
                  <span className="shift-duty-pill">{req.duty}</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "6px 0" }}>
                    Request #{req.id}: +{req.quantity} Extra Crew Members
                  </h4>
                  <div className="shift-date-time-row">
                    <span>
                      <Calendar size={13} /> Submitted: {formatDate(req.createdAt)}
                    </span>
                    <span>
                      <Briefcase size={13} /> Duty Role: {req.duty}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge status={req.status} />
                  {req.status === "Pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X size={14} />}
                      onClick={() => handleCancelRequest(req.id)}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {myRequests.length === 0 && (
            <Card className="empty-requests-card" style={{ padding: 24, textAlign: "center" }}>
              <p className="muted-text">No active crew staffing requests at this time.</p>
            </Card>
          )}
        </div>
      </section>

      {/* Live Crew Availability & Weekly Roster Feed */}
      <section className="crew-availability-roster-section" style={{ marginTop: 40 }}>
        <div className="section-filter-bar">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h2 className="section-title-md">Crew Availability & Weekly Roster</h2>
              <span className="live-roster-pill">
                <span className="pulse-indicator-dot" />
                {registeredWorkers.filter((w) => w.available).length} of {registeredWorkers.length} Available for Duty
              </span>
            </div>
            <p className="muted-text">
              Real-time crew availability status and 7-day schedule to staff upcoming events.
            </p>
          </div>
        </div>

        <div className="crew-roster-cards-grid">
          {registeredWorkers.map((worker) => {
            const isAvail = Boolean(worker.available);
            const workerDates = worker.availableDates || [];

            return (
              <Card key={worker.id} variant="default" className="crew-roster-worker-card">
                <div className="roster-worker-header">
                  <div className="roster-worker-profile">
                    <div className={`roster-avatar-bubble ${isAvail ? "active" : "off"}`}>
                      {isAvail ? <UserCheck size={18} /> : <UserX size={18} />}
                    </div>
                    <div>
                      <h4 className="roster-worker-name">{worker.name}</h4>
                      <span className="roster-worker-email">{worker.email}</span>
                    </div>
                  </div>
                  <span className={`roster-status-badge ${isAvail ? "available" : "unavailable"}`}>
                    <span className="status-indicator-dot" />
                    {isAvail ? "Available" : "Temporarily Unavailable"}
                  </span>
                </div>

                <div className="roster-weekly-calendar">
                  <span className="roster-calendar-label">
                    <CalendarDays size={13} /> 7-Day Schedule Roster:
                  </span>
                  <div className="roster-days-row">
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(today);
                      d.setDate(today.getDate() + i);
                      const key = dateKey(d);
                      const isSelected = workerDates.includes(key);

                      return (
                        <div
                          key={key}
                          className={`roster-day-cell ${isSelected && isAvail ? "on-duty" : "off-duty"}`}
                          title={`${worker.name}: ${isSelected && isAvail ? "Available" : "Off-duty"} on ${formatDate(key)}`}
                        >
                          <span className="cell-day-name">
                            {new Intl.DateTimeFormat("en", { weekday: "narrow" }).format(d)}
                          </span>
                          <span className="cell-day-num">{d.getDate()}</span>
                          <span className="cell-duty-dot" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}

          {registeredWorkers.length === 0 && (
            <Card className="empty-requests-card" style={{ padding: 24, textAlign: "center" }}>
              <p className="muted-text">No registered crew members in directory yet.</p>
            </Card>
          )}
        </div>
      </section>

      {/* On-Duty Crew Roster */}
      <section className="assigned-crew-section" style={{ marginTop: 40 }}>
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">On-Duty Crew Roster</h2>
            <p className="muted-text">
              Active crew assigned to shifts across your events in Bengaluru.
            </p>
          </div>
        </div>

        <div className="shifts-list-stack">
          {assignedCrewShifts.map((shift) => (
            <Card key={shift.id} variant="default" className="shift-item-card">
              <div className="shift-card-top">
                <div>
                  <span className="shift-duty-pill">{shift.duty}</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "6px 0" }}>{shift.title}</h4>
                  <div className="shift-date-time-row">
                    <span>
                      <Calendar size={13} /> {formatDate(shift.date)}
                    </span>
                    <span>
                      <Clock size={13} /> {shift.reporting} - {shift.endTime}
                    </span>
                    <span>
                      <MapPin size={13} /> {shift.venue}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.82rem", color: "var(--ink-secondary)" }}>
                    <Phone size={13} />
                    <span>Lead: {shift.supervisor}</span>
                  </div>
                  <Badge status={shift.status} />
                </div>
              </div>
            </Card>
          ))}
          {assignedCrewShifts.length === 0 && (
            <Card className="empty-requests-card" style={{ padding: 24, textAlign: "center" }}>
              <p className="muted-text">No crew shifts currently assigned to your events.</p>
            </Card>
          )}
        </div>
      </section>

      {/* Modal: Post New Event with 1 or 2 Place Photos & Private Crew Briefing */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post New Event · Crew Dispatch"
        description="Set up your event listing, attach venue entrance photos, and write private instructions for attending crew."
      >
        <form onSubmit={handleCreateEvent} className="form-stack">
          <Input
            label="Event Name *"
            placeholder="e.g. Bangalore Literature Gala 2026"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            required
          />

          <Input
            label="Venue & Area *"
            placeholder="e.g. Palace Grounds, Jayamahal"
            value={eventVenue}
            onChange={(e) => setEventVenue(e.target.value)}
            required
          />

          <div className="modal-form-grid-2">
            <Input
              label="Event Date *"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              label="Reporting Time *"
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-grid-2">
            <Select
              label="Primary Duty *"
              value={eventDuty}
              onChange={(e) => setEventDuty(e.target.value)}
              options={DUTIES}
            />
            <Input
              label="Crew Required (Count) *"
              type="number"
              min="1"
              max="5000"
              value={eventRequired}
              onChange={(e) => setEventRequired(e.target.value)}
              required
            />
          </div>

          {/* Place Photos Section: Exactly 1 or 2 Images */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">
                📷 {t("label_place_images")}
              </label>
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: eventImages.length === 2 ? "var(--amber)" : "var(--primary)" }}>
                {eventImages.length} / 2 Selected
              </span>
            </div>

            <div className="photo-uploader-box">
              <label
                className={`btn btn-outline btn-sm ${eventImages.length >= 2 ? "disabled" : ""}`}
                style={{ cursor: eventImages.length >= 2 ? "not-allowed" : "pointer" }}
              >
                <Camera size={14} />
                <span>Upload Venue Photo (File)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={eventImages.length >= 2}
                  style={{ display: "none" }}
                />
              </label>

              <div style={{ margin: "8px 0 4px", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                Or select from iconic Bengaluru venue photo presets:
              </div>

              <div className="venue-preset-chips-row">
                {VENUE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="preset-chip-btn"
                    disabled={eventImages.length >= 2}
                    onClick={() => handleAddPresetPhoto(preset.url)}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>

              {/* Previews of Selected 1 or 2 Photos */}
              {eventImages.length > 0 && (
                <div className="selected-place-photos-preview">
                  {eventImages.map((imgUrl, idx) => (
                    <div key={idx} className="photo-preview-card">
                      <img src={imgUrl} alt={`Selected venue ${idx + 1}`} />
                      <button
                        type="button"
                        className="photo-remove-btn"
                        onClick={() => handleRemovePhoto(idx)}
                        title="Remove photo"
                      >
                        <X size={12} />
                      </button>
                      <span className="photo-counter-tag" style={{ left: 6, right: "auto", bottom: 6 }}>
                        Photo {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Private Crew Briefing Description */}
          <div className="form-group">
            <label className="form-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Lock size={14} className="text-amber" />
              <span>{t("label_crew_briefing")}</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Dress code: Black formal shirt & trousers. Report to Gate 4 back entrance by 3:30 PM. Lead supervisor Pradeep (+91 98450 12345) will distribute entry badges."
              value={eventCrewBriefing}
              onChange={(e) => setEventCrewBriefing(e.target.value)}
            />
            <span style={{ fontSize: "0.74rem", color: "var(--ink-muted)", marginTop: 4 }}>
              🔒 <strong>Confidential:</strong> {t("briefing_helper")}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Public Event Description (Optional)</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Brief overview of the gathering visible to all viewers..."
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions-row" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ background: "var(--organizer)" }}
              type="submit"
              loading={isSubmittingEvent}
              icon={<Sparkles size={16} />}
            >
              Save & Publish Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Confidential Crew Briefing */}
      {editingBriefingEvent && (
        <Modal
          isOpen={true}
          onClose={() => setEditingBriefingEvent(null)}
          title={`Update Attending Crew Briefing · ${editingBriefingEvent.title}`}
          description="Update instructions, arrival desks, and supervisor contacts for attending crew members."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="crew-private-briefing-box" style={{ margin: 0 }}>
              <div className="briefing-box-header">
                <span className="briefing-title-group">
                  <Lock size={14} /> Confidential Dispatch
                </span>
                <span className="briefing-lock-badge">Attending Crew Only</span>
              </div>
              <p className="briefing-text-content">
                Only workers who have accepted or are assigned to this shift will see these updated instructions.
              </p>
            </div>

            <textarea
              className="form-textarea"
              rows={4}
              value={updatedBriefingText}
              onChange={(e) => setUpdatedBriefingText(e.target.value)}
              placeholder="Enter instructions, dress code, gate numbers, and supervisor phone..."
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setEditingBriefingEvent(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                style={{ background: "var(--organizer)" }}
                icon={<Send size={15} />}
                onClick={handleSaveBriefingUpdate}
              >
                Broadcast to Attending Crew
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Staffing Request */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Dispatch Staffing Request"
        description="Request extra crew specialists from the Crew's network."
      >
        <form onSubmit={handleCreateRequest} className="form-stack">
          <Select
            label="Target Event *"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            options={myEvents.map((e) => e.title)}
          />

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select
              label="Duty Role *"
              value={requestDuty}
              onChange={(e) => setRequestDuty(e.target.value)}
              options={DUTIES}
            />
            <Input
              label="Extra Crew Needed *"
              type="number"
              min="1"
              max="500"
              value={requestQty}
              onChange={(e) => setRequestQty(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions-row" style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ background: "var(--organizer)" }}
              type="submit"
              loading={isSubmittingRequest}
              icon={<Send size={16} />}
            >
              Dispatch Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
