import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  ExternalLink,
  Phone,
  Briefcase,
  ShieldAlert,
  IndianRupee,
  ArrowRight,
  FileText,
  CheckCircle,
  Lock,
  Camera,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { LanguageSelector } from "../components/common/LanguageSelector";
import {
  dateKey,
  formatDate,
  formatTime,
  getDutyHourlyRate,
  parseShiftHours,
} from "../data/mockData";
import type { Shift, ShiftStatus } from "../types";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";

type ShiftFilter = "all" | "upcoming" | "completed";

function parseSupervisor(rawSupervisor?: string) {
  const defaultPhone = "+91 98450 11223";
  if (!rawSupervisor) {
    return { name: "Ananya Rao (Event Organizer)", phone: defaultPhone };
  }
  const match = rawSupervisor.match(/(\+91[\s\d-]{9,14}|\b\d{10}\b)/);
  if (match) {
    const phone = match[0].trim();
    let name = rawSupervisor.replace(match[0], "").replace(/[()·,📞]/g, "").trim();
    if (!name.toLowerCase().includes("organizer")) {
      name = `${name} (Organizer)`;
    }
    return { name, phone };
  }
  let cleanName = rawSupervisor.replace(/[()·,📞]/g, "").trim();
  if (!cleanName.toLowerCase().includes("organizer")) {
    cleanName = `${cleanName} (Organizer)`;
  }
  return { name: cleanName, phone: defaultPhone };
}

export function WorkerDashboard({ navigate }: { navigate: (route: string) => void }) {
  const { currentUser, appData, publicEvents, updateShift, updateAvailability, applyForShift } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<ShiftFilter>("all");
  const [mapShiftId, setMapShiftId] = useState<string | null>(null);
  const [applyingEventId, setApplyingEventId] = useState<string | null>(null);

  const today = new Date();
  const todayKey = dateKey(today);

  // STRICT ACCESS ISOLATION:
  // If not authenticated, require Crew's sign in
  if (!currentUser) {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <Briefcase size={36} />
          </div>
          <h2 className="restriction-title">Crew's Sign In Required</h2>
          <p className="restriction-text">
            Please sign in with your Crew's account to access your assigned shifts,
            on-site organizer briefings, availability schedule, and daily earnings ledger.
          </p>
          <div className="button-row justify-center">
            <Button
              variant="primary"
              icon={<Briefcase size={16} />}
              onClick={() => navigate("/auth/worker")}
            >
              Sign In as Crew's
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If signed in with a non-worker role (e.g. Organizer or Admin), STRICTLY BLOCK access.
  if (currentUser.role !== "worker") {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <ShieldAlert size={36} />
          </div>
          <h2 className="restriction-title">Access Restricted · Crew's Hub Only</h2>
          <p className="restriction-text">
            You are signed in as <strong>{currentUser.name}</strong> with the{" "}
            <span className="restriction-role-pill">{currentUser.role === "organizer" ? "EVENT ORGANIZER" : currentUser.role.toUpperCase()}</span> role.
            For privacy, data protection, and operational security, each role is strictly isolated.
            Crew's and event organizers cannot view each other's dashboards.
          </p>
          <div className="button-row justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(`/${currentUser.role}`)}
            >
              Return to Your {currentUser.role === "organizer" ? "Event Organizer Studio" : "Admin Console"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isUpcoming = (shift: Shift) =>
    shift.date >= todayKey && shift.status !== "Completed" && shift.status !== "Cancelled";

  const visibleShifts = appData.shifts
    .filter((s) => {
      if (filter === "upcoming") return isUpcoming(s);
      if (filter === "completed") return s.status === "Completed";
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const completedShifts = appData.shifts.filter((s) => s.status === "Completed");
  const upcomingCount = appData.shifts.filter(isUpcoming).length;
  const completedCount = completedShifts.length;

  // Calculate hours worked this month
  const hoursThisMonth = appData.shifts.reduce((total, shift) => {
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    if (!shift.date.startsWith(currentMonthPrefix) || shift.status === "Cancelled") return total;
    return total + parseShiftHours(shift.reporting, shift.endTime || shift.end_time || "05:00 PM");
  }, 0);

  // Shifts attended today
  const attendedTodayShifts = appData.shifts.filter(
    (s) => s.date === todayKey && (s.status === "Completed" || s.status === "Reporting")
  );

  const todayDailyEarnings = attendedTodayShifts.reduce((acc, shift) => {
    const hours = parseShiftHours(shift.reporting, shift.endTime || shift.end_time || "05:00 PM");
    const rate = getDutyHourlyRate(shift.duty);
    return acc + Math.round(hours * rate);
  }, 0);

  // Total earnings from all attended and completed events
  const totalEarnings = completedShifts.reduce((acc, shift) => {
    const hours = parseShiftHours(shift.reporting, shift.endTime || shift.end_time || "05:00 PM");
    const rate = getDutyHourlyRate(shift.duty);
    return acc + Math.round(hours * rate);
  }, 0);

  // All attended events for the Ledger
  const attendedLedgerShifts = appData.shifts
    .filter((s) => s.status === "Completed" || s.status === "Reporting")
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleToggleDate = async (key: string) => {
    const current = appData.availableDates || [];
    const updated = current.includes(key)
      ? current.filter((d) => d !== key)
      : [...current, key];

    await updateAvailability({ availableDates: updated });
    showToast("Weekly availability dates updated.");
  };

  const handleStatusProgression = async (shift: Shift, nextStatus: ShiftStatus) => {
    try {
      await updateShift(shift.id, nextStatus);
      showToast(`Shift status updated to "${nextStatus}".`);
    } catch {
      showToast("Could not update shift status.", "error");
    }
  };

  const handleApply = async (eventId: string, duty: string) => {
    setApplyingEventId(eventId);
    try {
      await applyForShift(eventId, duty);
      showToast("Shift accepted! Check your assigned schedule below.");
    } catch {
      showToast("Could not apply for shift.", "error");
    } finally {
      setApplyingEventId(null);
    }
  };

  const getActionForStatus = (status: ShiftStatus): { label: string; next: ShiftStatus } | null => {
    switch (status) {
      case "Assigned":
        return { label: t("btn_accept"), next: "Accepted" };
      case "Accepted":
        return { label: t("btn_report"), next: "Reporting" };
      case "Reporting":
        return { label: t("btn_complete"), next: "Completed" };
      default:
        return null;
    }
  };

  const openEvents = publicEvents.filter(
    (e) => !appData.shifts.some((s) => s.event_id === e.id || s.title === e.title)
  );

  return (
    <div className="dashboard-page-container">
      {/* Top Banner with Indian Language Selector on Upper Right */}
      <div className="dashboard-header-block">
        <div>
          <span className="dashboard-eyebrow">{t("crew_eyebrow")}</span>
          <h1 className="dashboard-title">
            {t("crew_title", { name: currentUser?.name || "Crew Member" })}
          </h1>
          <p className="dashboard-subtitle">{t("crew_subtitle")}</p>
        </div>

        <div className="dashboard-header-actions">
          {/* Upper Right Indian Language Selector */}
          <LanguageSelector variant="header" />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stat-cards-grid">
        <StatCard
          label={t("stat_today_earning")}
          value={`₹${todayDailyEarnings.toLocaleString("en-IN")}`}
          caption={
            attendedTodayShifts.length > 0
              ? t("stat_today_caption", { count: attendedTodayShifts.length })
              : t("stat_today_none")
          }
          color="emerald"
          icon={<IndianRupee size={22} />}
        />
        <StatCard
          label={t("stat_total_earning")}
          value={`₹${totalEarnings.toLocaleString("en-IN")}`}
          caption={t("stat_total_caption", { count: completedCount })}
          color="purple"
          icon={<CheckCircle size={22} />}
        />
        <StatCard
          label={t("stat_upcoming_shifts")}
          value={upcomingCount}
          caption="Confirmed & assigned"
          color="blue"
          icon={<CalendarCheck size={22} />}
        />
        <StatCard
          label={t("stat_monthly_hours")}
          value={`${hoursThisMonth.toFixed(1)}h`}
          caption="Logged this month"
          color="amber"
          icon={<Clock size={22} />}
        />
      </div>

      {/* Attended Events & Daily Earnings Ledger */}
      <section className="earnings-ledger-section">
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">{t("ledger_title")}</h2>
            <p className="muted-text">{t("ledger_subtitle")}</p>
          </div>
          <div className="payout-summary-pill">
            <span className="payout-status-chip">
              <CheckCircle2 size={13} /> {t("ledger_payout_active")}
            </span>
          </div>
        </div>

        <Card variant="default" className="ledger-table-card">
          {attendedLedgerShifts.length > 0 ? (
            <div className="ledger-table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>{t("col_event")}</th>
                    <th>{t("col_date")}</th>
                    <th>{t("col_duty")}</th>
                    <th>{t("col_hours")}</th>
                    <th>{t("col_payout")}</th>
                    <th>{t("col_status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendedLedgerShifts.map((shift) => {
                    const hours = parseShiftHours(shift.reporting, shift.endTime || shift.end_time || "05:00 PM");
                    const rate = getDutyHourlyRate(shift.duty);
                    const payout = Math.round(hours * rate);
                    const isToday = shift.date === todayKey;
                    const isReporting = shift.status === "Reporting";

                    return (
                      <tr key={shift.id}>
                        <td>
                          <div className="ledger-event-cell">
                            <span className="ledger-event-name">{shift.title}</span>
                            <span className="ledger-event-venue">
                              <MapPin size={12} /> {shift.venue}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span>{formatDate(shift.date)}</span>
                          {isToday && (
                            <span className="payout-status-chip" style={{ marginLeft: 6, fontSize: "0.68rem" }}>
                              Today
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="shift-duty-pill">{shift.duty}</span>
                        </td>
                        <td>
                          <strong>{hours.toFixed(1)} hrs</strong>
                          <div style={{ fontSize: "0.74rem", color: "var(--ink-muted)" }}>
                            {shift.reporting} - {shift.endTime || shift.end_time || "05:00 PM"}
                          </div>
                        </td>
                        <td>
                          <span className="ledger-payout-cell">
                            ₹{payout.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          {isReporting ? (
                            <span className="payout-status-chip reporting">
                              <Clock size={12} /> {t("status_in_progress")}
                            </span>
                          ) : (
                            <span className="payout-status-chip">
                              <CheckCircle2 size={12} /> {t("status_credited")}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: "36px 24px", textAlign: "center" }}>
              <FileText size={36} style={{ color: "var(--ink-muted)", margin: "0 auto 12px" }} />
              <h4>No attended events recorded yet</h4>
              <p className="muted-text" style={{ maxWidth: 440, margin: "0 auto" }}>
                When you check in and complete shifts from your schedule below, your verified daily earnings will appear here with hourly breakdowns.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* 7-Day Availability Card */}
      <Card variant="elevated" className="availability-card">
        <div className="availability-header">
          <div>
            <h3 className="section-title-sm">{t("avail_title")}</h3>
            <p className="muted-text">{t("avail_subtitle")}</p>
          </div>
          <label className="toggle-switch-wrapper">
            <input
              type="checkbox"
              checked={appData.available}
              onChange={(e) => {
                void updateAvailability({ available: e.target.checked });
                showToast(
                  e.target.checked ? "You are now marked Available!" : "Marked as Off-duty."
                );
              }}
            />
            <span className="toggle-switch-slider" />
            <span className="toggle-label-text">
              {appData.available ? t("avail_open") : t("avail_off")}
            </span>
          </label>
        </div>

        <div className="date-chips-row">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const key = dateKey(date);
            const isSelected = appData.availableDates?.includes(key);

            return (
              <button
                key={key}
                type="button"
                className={`date-select-chip ${isSelected ? "selected" : ""}`}
                onClick={() => handleToggleDate(key)}
              >
                <span className="chip-day">
                  {new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)}
                </span>
                <span className="chip-date">{date.getDate()}</span>
                <span className="chip-indicator" />
              </button>
            );
          })}
        </div>
      </Card>

      {/* Assigned Shifts Section */}
      <section className="shifts-section" style={{ marginTop: 36 }}>
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">{t("shifts_title")}</h2>
            <p className="muted-text">{t("shifts_subtitle")}</p>
          </div>

          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              {t("filter_all")} ({appData.shifts.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              {t("filter_upcoming")} ({upcomingCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              {t("filter_completed")} ({completedCount})
            </button>
          </div>
        </div>

        <div className="shifts-list-stack">
          {visibleShifts.map((shift) => {
            const action = getActionForStatus(shift.status);
            const isMapOpen = mapShiftId === shift.id;
            const hours = parseShiftHours(shift.reporting, shift.endTime || shift.end_time || "05:00 PM");
            const rate = getDutyHourlyRate(shift.duty);
            const payout = Math.round(hours * rate);

            // Match place photos (1 or 2)
            const matchedEvent = publicEvents.find((e) => e.id === shift.event_id || e.title === shift.title);
            const images = shift.images && shift.images.length > 0
              ? shift.images
              : matchedEvent?.images && matchedEvent.images.length > 0
                ? matchedEvent.images
                : null;

            // Match private briefing from event organizer (Strictly for attending crew only)
            const privateBriefing = shift.crew_briefing || matchedEvent?.crew_briefing;
            const sup = parseSupervisor(shift.supervisor);
            const cleanPhone = sup.phone.replace(/[\s-]/g, "");
            const mapDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${shift.venue}, ${shift.address}`
            )}&travelmode=driving`;

            return (
              <Card key={shift.id} variant="default" className="shift-item-card">
                {/* Venue Place Photos Banner (1 or 2 images) */}
                {images && images.length > 0 && (
                  <div
                    className={`venue-place-photos-banner ${images.length === 2 ? "dual" : "single"
                      }`}
                  >
                    {images.slice(0, 2).map((imgUrl, idx) => (
                      <div key={idx} style={{ position: "relative", height: "100%" }}>
                        <img
                          src={imgUrl}
                          alt={`${shift.venue} view ${idx + 1}`}
                          className="place-photo-img-item"
                          loading="lazy"
                        />
                        <span className="photo-counter-tag">
                          <Camera size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                          Venue Entrance Photo {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="shift-card-top">
                  <div className="shift-main-info">
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                      <span className="shift-duty-pill">{shift.duty}</span>
                      {shift.status === "Completed" ? (
                        <span className="shift-card-payout-badge">
                          <CheckCircle2 size={13} /> ₹{payout.toLocaleString("en-IN")} Credited
                        </span>
                      ) : shift.status === "Reporting" ? (
                        <span className="shift-card-payout-badge in-progress">
                          <Clock size={13} /> ₹{payout.toLocaleString("en-IN")} In Progress
                        </span>
                      ) : (
                        <span className="shift-card-payout-badge estimated">
                          <IndianRupee size={12} /> Expected: ₹{payout.toLocaleString("en-IN")} ({hours}h)
                        </span>
                      )}
                    </div>

                    <h3 className="shift-title">{shift.title}</h3>

                    <div className="shift-date-time-row">
                      <span>
                        <Calendar size={14} /> {formatDate(shift.date)}
                      </span>
                      <span>
                        <Clock size={14} /> Reporting: {shift.reporting} (Until {shift.endTime || shift.end_time || "05:00 PM"})
                      </span>
                    </div>
                  </div>
                  <Badge status={shift.status} />
                </div>

                <div className="shift-details-grid">
                  <div className="shift-detail-item">
                    <span className="detail-label">Venue & Location</span>
                    <span className="detail-value">{shift.venue}</span>
                    <span className="detail-sub">{shift.address}</span>
                  </div>
                  <div className="shift-detail-item">
                    <span className="detail-label">Supervisor (Event Organizer)</span>
                    <div className="supervisor-row-box">
                      <span className="supervisor-name-title">{sup.name}</span>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="supervisor-phone-pill"
                        title={`Call Supervisor ${sup.name}`}
                      >
                        <Phone size={13} />
                        <span>{sup.phone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Exclusive Private Briefing Notice from Event Organizer */}
                {privateBriefing && (
                  <div className="crew-private-briefing-box">
                    <div className="briefing-box-header">
                      <span className="briefing-title-group">
                        <Megaphone size={15} /> {t("briefing_title")}
                      </span>
                      <span className="briefing-lock-badge">
                        <Lock size={10} style={{ marginRight: 3 }} /> {t("briefing_tag")}
                      </span>
                    </div>
                    <p className="briefing-text-content">{privateBriefing}</p>
                    <span className="briefing-footer-note">
                      🔒 {t("briefing_confidential")}
                    </span>
                  </div>
                )}

                <div className="shift-actions-row">
                  {action && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<CheckCircle2 size={16} />}
                      onClick={() => handleStatusProgression(shift, action.next)}
                    >
                      {action.label}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    icon={<MapPin size={16} />}
                    onClick={() => setMapShiftId(isMapOpen ? null : shift.id)}
                  >
                    {isMapOpen ? t("btn_hide_map") : t("btn_show_map")}
                  </Button>

                  <a
                    className="btn btn-primary btn-sm start-nav-action-btn"
                    href={mapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Start live GPS navigation to venue in Google Maps"
                  >
                    <Navigation size={14} />
                    <span>Start Navigation</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {isMapOpen && (
                  <div className="shift-map-container animate-fade-in">
                    <div className="map-quick-start-bar">
                      <div className="map-venue-tag">
                        <MapPin size={15} style={{ color: "var(--primary)" }} />
                        <span><strong>{shift.venue}</strong> · {shift.address}</span>
                      </div>
                      <a
                        className="btn btn-primary btn-sm map-start-button"
                        href={mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Start live navigation in Google Maps"
                      >
                        <Navigation size={14} />
                        <span>Start</span>
                      </a>
                    </div>
                    <iframe
                      title={`Venue map for ${shift.venue}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        `${shift.venue}, ${shift.address}`
                      )}&output=embed`}
                      loading="lazy"
                    />
                  </div>
                )}
              </Card>
            );
          })}

          {visibleShifts.length === 0 && (
            <Card className="empty-shifts-card">
              <AlertCircle size={36} className="empty-shifts-icon" />
              <h3>No shifts in this filter</h3>
              <p>You have no {filter} shifts at this time.</p>
              <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                Find Open Opportunities
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* Available Shift Opportunities Section */}
      <section className="open-shifts-section" style={{ marginTop: 40 }}>
        <div className="section-filter-bar">
          <div>
            <h2 className="section-title-md">{t("opp_title")}</h2>
            <p className="muted-text">{t("opp_subtitle")}</p>
          </div>
        </div>

        <div className="events-cards-grid">
          {openEvents.slice(0, 3).map((evt) => {
            const isApp = applyingEventId === evt.id;
            const rate = getDutyHourlyRate(evt.duty);
            const hours = parseShiftHours(evt.time || "09:00 AM", "05:00 PM");
            const estPayout = Math.round(rate * hours);
            const images = evt.images && evt.images.length > 0 ? evt.images : [
              "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80"
            ];

            return (
              <div key={evt.id} className="event-opportunity-card">
                <div className="event-card-media">
                  <img src={images[0]} alt={evt.venue} className="event-card-img" loading="lazy" />
                  {images.length > 1 && (
                    <span className="photo-counter-tag">
                      <Camera size={11} style={{ marginRight: 3, verticalAlign: "middle" }} /> 2 Photos
                    </span>
                  )}
                </div>

                <div className="event-card-body">
                  <div className="event-card-badges-row">
                    <span className="event-duty-tag">{evt.duty}</span>
                    <span className="event-payout-rate-badge">
                      ~₹{estPayout.toLocaleString("en-IN")} payout
                    </span>
                  </div>

                  <h3 className="event-card-title">{evt.title}</h3>

                  <div className="event-card-meta-list">
                    <span>
                      <Calendar size={13} /> {formatDate(evt.date)}
                    </span>
                    <span>
                      <Clock size={13} /> Reporting: {formatTime(evt.time)}
                    </span>
                    <span>
                      <MapPin size={13} /> {evt.venue}, Bengaluru
                    </span>
                  </div>

                  <div className="event-card-footer-btns">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      loading={isApp}
                      icon={<ArrowRight size={14} />}
                      onClick={() => handleApply(evt.id, evt.duty)}
                    >
                      {t("btn_apply")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
