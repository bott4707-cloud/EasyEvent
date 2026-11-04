import { useState } from "react";
import type { Account, AppData, Shift, ShiftStatus } from "../data";
import { Button, Card, Metric, SectionTitle, dateKey, formatDate } from "./common";

type ShiftFilter = "all" | "upcoming" | "completed";

interface WorkerDashboardProps {
  data: AppData;
  user: Account;
  onUpdateShift: (shiftId: string, status: ShiftStatus) => Promise<void>;
  onUpdateAvailability: (change: { available?: boolean; availableDates?: string[] }) => Promise<void>;
}

export default function WorkerDashboard({
  data,
  user,
  onUpdateShift,
  onUpdateAvailability,
}: WorkerDashboardProps) {
  const [filter, setFilter] = useState<ShiftFilter>("all");
  const [mapShiftId, setMapShiftId] = useState<string | null>(null);
  const today = new Date();
  const upcoming = (shift: Shift) => shift.date >= dateKey(today) &&
    shift.status !== "Completed" && shift.status !== "Cancelled";
  const visibleShifts = data.shifts.filter((shift) =>
    filter === "all" || (filter === "upcoming" && upcoming(shift)) ||
    (filter === "completed" && shift.status === "Completed"),
  ).sort((left, right) => left.date.localeCompare(right.date));
  const completed = data.shifts.filter((shift) => shift.status === "Completed");
  const hoursThisMonth = data.shifts.reduce((total, shift) => {
    if (!shift.date.startsWith(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`) || shift.status === "Cancelled") return total;
    const parse = (value: string) => {
      const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return null;
      let hour = Number(match[1]) % 12;
      if (match[3].toUpperCase() === "PM") hour += 12;
      return hour * 60 + Number(match[2]);
    };
    const start = parse(shift.reporting);
    const end = parse(shift.endTime);
    if (start === null || end === null) return total;
    return total + ((end - start + 1440) % 1440) / 60;
  }, 0);

  function toggleDate(value: string) {
    const availableDates = data.availableDates.includes(value)
      ? data.availableDates.filter((item) => item !== value)
      : [...data.availableDates, value];
    void onUpdateAvailability({ availableDates });
  }

  return (
    <div className="content dashboard">
      <SectionTitle eyebrow="Worker workspace / Bengaluru" title={`Good day, ${user.name}.`} subtitle="Check upcoming shifts, update availability, and keep event details close at hand." />
      <div className="metric-grid">
        <Metric label="Upcoming shifts" value={String(data.shifts.filter(upcoming).length)} caption="Confirmed and assigned" />
        <Metric label="Hours this month" value={`${Number(hoursThisMonth.toFixed(1))}h`} caption="From shifts dated this month" />
        <Metric label="Completed shifts" value={String(completed.length)} caption="Your completed shifts" />
        <Metric label="Availability" value={data.available ? "Available" : "Off"} caption="For the next 7 days" />
      </div>
      <section className="section">
        <div className="availability-heading">
          <SectionTitle eyebrow="Availability" title="Choose the days you can work." />
          <label className="switch-label">
            <input
              type="checkbox"
              checked={data.available}
              onChange={(event) => void onUpdateAvailability({ available: event.target.checked })}
            />
            Available for work
          </label>
        </div>
        <p className="muted">{data.available ? "Available for work" : "Not available"}</p>
        <div className="date-chips">
          {Array.from({ length: 7 }, (_, offset) => {
            const date = new Date(today);
            date.setDate(today.getDate() + offset);
            const key = dateKey(date);
            return (
              <button key={key} className={`date-chip ${data.availableDates.includes(key) ? "date-chip-selected" : ""}`} onClick={() => toggleDate(key)}>
                {new Intl.DateTimeFormat("en", { weekday: "short" }).format(date)} {date.getDate()}
              </button>
            );
          })}
        </div>
      </section>
      <section className="section">
        <SectionTitle eyebrow="My shifts" title="Reporting time, venue, and duty for each assignment." />
        <div className="button-row">
          {(["all", "upcoming", "completed"] as ShiftFilter[]).map((value) => (
            <Button key={value} className={filter === value ? "filter-active" : ""} onClick={() => setFilter(value)}>
              {value === "all" ? "All shifts" : value === "upcoming" ? "Upcoming" : "Completed"}
            </Button>
          ))}
        </div>
        <div className="stack">
          {visibleShifts.map((shift) => {
            const nextStatus: Partial<Record<ShiftStatus, [string, ShiftStatus]>> = {
              Assigned: ["Accept shift", "Accepted"],
              Accepted: ["Mark as reporting", "Reporting"],
              Reporting: ["Complete shift", "Completed"],
            };
            const action = nextStatus[shift.status];
            return (
              <Card key={shift.id}>
                <div className="listing-heading">
                  <div><h3>{shift.title}</h3><p className="muted">{formatDate(shift.date)} · {shift.duty}</p></div>
                  <span className="status-tag">{shift.status}</span>
                </div>
                <p>Venue: {shift.venue}</p>
                <p>Reporting time: {shift.reporting}</p>
                <p className="muted">Full address: {shift.address}</p>
                <p className="muted">Supervisor: {shift.supervisor}</p>
                <div className="button-row">
                  {action && <Button primary onClick={() => void onUpdateShift(shift.id, action[1])}>{action[0]}</Button>}
                  <Button aria-expanded={mapShiftId === shift.id} onClick={() => setMapShiftId(mapShiftId === shift.id ? null : shift.id)}>
                    {mapShiftId === shift.id ? "Hide map" : "Show map"}
                  </Button>
                </div>
                {mapShiftId === shift.id && (
                  <div className="map-panel">
                    <iframe
                      title={`Map to ${shift.venue}`}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${shift.venue}, ${shift.address}`)}&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                    <div className="map-actions">
                      <a
                        className="button button-primary"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shift.venue}, ${shift.address}`)}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Start turn-by-turn directions"
                      >
                        Start <span aria-hidden="true">↗</span>
                      </a>
                      <span className="muted small-text">Opens turn-by-turn directions in Google Maps.</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {visibleShifts.length === 0 && <Card><p className="muted">No shifts in this view. Browse current opportunities on EASYEVENT.</p></Card>}
        </div>
      </section>
    </div>
  );
}
