import { useState, type FormEvent } from "react";
import type { Account, AppData } from "../data";
import type { EventInput } from "../api";
import { DUTIES } from "../data";
import { Button, Card, Field, Metric, SectionTitle, SelectField, dateKey, formatDate, formatTime } from "./common";

interface OrganizerDashboardProps {
  data: AppData;
  user: Account;
  onCreateEvent: (event: EventInput) => Promise<boolean>;
  onCreateRequest: (request: { eventId: string; quantity: number; duty: string }) => Promise<boolean>;
  onCancelRequest: (requestId: string) => Promise<void>;
  notify: (message: string, error?: boolean) => void;
}

export default function OrganizerDashboard({
  data,
  user,
  onCreateEvent,
  onCreateRequest,
  onCancelRequest,
  notify,
}: OrganizerDashboardProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duty, setDuty] = useState("");
  const [required, setRequired] = useState("");
  const [requestEvent, setRequestEvent] = useState(data.events[0]?.id ?? "");
  const [requestDuty, setRequestDuty] = useState("");
  const [quantity, setQuantity] = useState("");
  const totalRequired = data.events.reduce((sum, event) => sum + event.required, 0);
  const totalAssigned = data.events.reduce((sum, event) => sum + Math.min(event.assigned, event.required), 0);

  async function createEvent(event: FormEvent) {
    event.preventDefault();
    const parsedDate = new Date(`${date}T00:00:00`);
    const crew = Number(required);
    if (!title.trim() || !venue.trim()) {
      notify("Enter an event name and venue.", true);
      return;
    }
    if (Number.isNaN(parsedDate.getTime()) || !/^\d{2}:\d{2}$/.test(time) || !Number.isInteger(crew)) {
      notify("Enter a valid date, time, and whole crew count.", true);
      return;
    }
    if (parsedDate < new Date(`${dateKey(new Date())}T00:00:00`)) {
      notify("Choose today or a future event date.", true);
      return;
    }
    if (!duty || crew < 1 || crew > 5000) {
      notify("Choose a duty and enter between 1 and 5000 crew members.", true);
      return;
    }
    const saved = await onCreateEvent({ title: title.trim(), venue: venue.trim(), date, time, duty, required: crew });
    if (saved) {
      setTitle(""); setVenue(""); setDate(""); setTime(""); setDuty(""); setRequired(""); setShowCreate(false);
    }
  }

  async function createRequest(event: FormEvent) {
    event.preventDefault();
    const count = Number(quantity);
    if (!data.events.some((item) => item.id === requestEvent)) {
      notify("Choose an event before requesting extra crew.", true);
      return;
    }
    if (!requestDuty || !Number.isInteger(count) || count < 1 || count > 500) {
      notify("Choose a duty and enter between 1 and 500 additional workers.", true);
      return;
    }
    if (await onCreateRequest({ eventId: requestEvent, quantity: count, duty: requestDuty })) setQuantity("");
  }

  return (
    <div className="content dashboard">
      <SectionTitle eyebrow="Organizer workspace / Bengaluru" title={`Welcome, ${user.name}.`} subtitle="Plan event staffing and keep track of crew needs." />
      <div className="metric-grid">
        <Metric label="My events" value={String(data.events.length)} caption="Events you manage" />
        <Metric label="Crew required" value={String(totalRequired)} caption="Across your events" />
        <Metric label="Crew assigned" value={String(totalAssigned)} caption="Across your events" />
        <Metric label="Staffing shortage" value={String(Math.max(0, totalRequired - totalAssigned))} caption="Required minus assigned" />
      </div>
      <section className="section">
        <div className="section-action">
          <SectionTitle eyebrow="Your events" title="Manage event staffing." />
          <Button primary onClick={() => setShowCreate(!showCreate)}>{showCreate ? "Close form" : "Create event"}</Button>
        </div>
        {showCreate && (
          <Card><form className="form-grid" onSubmit={(event) => void createEvent(event)}>
            <Field label="Event name *" placeholder="e.g. Community Food Festival" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <Field label="Venue and area *" placeholder="e.g. Palace Grounds, Bengaluru" value={venue} onChange={(event) => setVenue(event.target.value)} required />
            <Field label="Event date *" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            <Field label="Reporting time *" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
            <SelectField label="Primary duty *" value={duty} onChange={(event) => setDuty(event.target.value)} options={["", ...DUTIES]} />
            <Field label="Crew required *" type="number" min="1" max="5000" value={required} onChange={(event) => setRequired(event.target.value)} required />
            <div className="full-width"><Button primary type="submit">Save event</Button></div>
          </form></Card>
        )}
        <div className="stack">
          {data.events.map((event) => {
            const shortage = Math.max(0, event.required - event.assigned);
            return (
              <Card key={event.id}>
                <div className="listing-heading">
                  <div><h3>{event.title}</h3><p className="muted">{formatDate(event.date)} · Reporting {formatTime(event.time)}</p><p className="muted">{event.venue} · Bengaluru</p></div>
                  <span className="status-tag">{event.status}</span>
                </div>
                <p>Required {event.required} · Assigned {event.assigned} · Shortage {shortage}</p>
                <progress value={Math.min(1, event.assigned / Math.max(1, event.required))} />
                <p className="muted small-text">Primary duty: {event.duty} · {event.address}</p>
                <Button onClick={() => { setRequestEvent(event.id); document.getElementById("staffing-request")?.scrollIntoView({ behavior: "smooth" }); }}>Request extra crew</Button>
              </Card>
            );
          })}
        </div>
      </section>
      <section className="section" id="staffing-request">
        <SectionTitle eyebrow="Staffing requests" title="Request additional crew." subtitle="Track requests shared with the EASYEVENT team." />
        <Card><form className="form-stack" onSubmit={(event) => void createRequest(event)}>
          <SelectField label="Event *" value={requestEvent} onChange={(event) => setRequestEvent(event.target.value)} disabled={!data.events.length}>
            {data.events.length ? data.events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>) : <option value="">Create an event first</option>}
          </SelectField>
          <SelectField label="Duty *" value={requestDuty} onChange={(event) => setRequestDuty(event.target.value)} options={["", ...DUTIES]} disabled={!data.events.length} />
          <Field label="Additional crew *" type="number" min="1" max="500" placeholder="Number of workers" value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={!data.events.length} required />
          <Button primary type="submit" disabled={!data.events.length}>Submit crew request</Button>
        </form></Card>
        <div className="stack">
          {data.requests.filter((item) => item.status !== "Cancelled").map((request) => {
            const event = data.events.find((item) => item.id === request.eventId);
            return (
              <Card key={request.id} className="request-card">
                <div><strong>{event?.title ?? "Event no longer available"}</strong><span className="status-tag">{request.status}</span></div>
                <p className="muted">{request.quantity} additional · {request.duty} · {formatDate(request.createdAt)}</p>
                {request.status === "Pending" && <Button onClick={() => void onCancelRequest(request.id)}>Withdraw request</Button>}
              </Card>
            );
          })}
          {data.requests.every((item) => item.status === "Cancelled") && <p className="muted">No extra crew requests yet.</p>}
        </div>
      </section>
    </div>
  );
}
