import { useState, type FormEvent } from "react";
import type { Account, AppData, Event, EventStatus, RequestStatus } from "../data";
import { DUTIES } from "../data";
import { Button, Card, Field, Metric, SectionTitle, SelectField, formatDate } from "./common";

interface AdminDashboardProps {
  data: AppData;
  user: Account;
  onDeleteUser: (id: string) => Promise<void>;
  onUpdateEvent: (id: string, changes: Partial<Event> & { status?: EventStatus }) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onUpdateRequest: (id: string, status: RequestStatus) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
}

export default function AdminDashboard({
  data,
  user,
  onDeleteUser,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateRequest,
  onDeleteRequest,
}: AdminDashboardProps) {
  const requestsByEvent = new Map(data.events.map((event) => [event.id, event.title]));
  const workers = data.users.filter((account) => account.role === "worker");
  const organizers = data.users.filter((account) => account.role === "organizer");

  async function confirmAction(message: string, action: () => Promise<void>) {
    if (window.confirm(message)) await action();
  }

  return (
    <div className="content dashboard">
      <SectionTitle
        eyebrow="Admin workspace"
        title={`Welcome, ${user.name}.`}
        subtitle="Manage accounts, events, and staffing requests. Changes are saved on the server."
      />
      <div className="metric-grid">
        <Metric label="Accounts" value={String(data.users.length)} caption={`${workers.length} workers · ${organizers.length} organizers`} />
        <Metric label="Events" value={String(data.events.length)} caption="Across all organizers" />
        <Metric label="Pending events" value={String(data.events.filter((event) => event.status === "Pending approval").length)} caption="Awaiting review" />
        <Metric label="Pending requests" value={String(data.requests.filter((request) => request.status === "Pending").length)} caption="Awaiting staffing review" />
      </div>

      <section className="section">
        <SectionTitle eyebrow="Accounts" title="Worker and Organizer accounts." subtitle="Admin accounts are provisioned on the server and cannot be removed here." />
        <div className="stack">
          {data.users.filter((account) => account.role !== "admin").map((account) => (
            <Card key={account.id}>
              <div className="listing-heading">
                <div><h3>{account.name}</h3><p className="muted">{account.email}</p></div>
                <span className="status-tag">{account.role}</span>
              </div>
              <Button onClick={() => confirmAction(
                `Remove ${account.name}'s account and their associated shifts, events, requests, and sessions?`,
                () => onDeleteUser(account.id),
              )}>Remove account</Button>
            </Card>
          ))}
          {data.users.filter((account) => account.role !== "admin").length === 0 && <Card><p className="muted">No Worker or Organizer accounts yet.</p></Card>}
        </div>
      </section>

      <section className="section">
        <SectionTitle eyebrow="Events" title="Review and manage events." />
        <div className="stack">
          {data.events.map((event) => (
            <Card key={event.id}>
              <div className="listing-heading">
                <div><h3>{event.title}</h3><p className="muted">{formatDate(event.date)} · {event.venue}</p></div>
                <span className="status-tag">{event.status}</span>
              </div>
              <p>{event.required} required · {event.assigned} assigned · {event.duty}</p>
              <EventEditor event={event} onSave={(changes) => onUpdateEvent(event.id, changes)} />
              <div className="admin-row">
                <SelectField
                  label={`Status for ${event.title}`}
                  value={event.status}
                  onChange={(change) => void onUpdateEvent(event.id, { status: change.target.value as EventStatus })}
                  options={["Pending approval", "Published", "Rejected"]}
                />
                <Button onClick={() => confirmAction(`Delete "${event.title}" and its staffing requests?`, () => onDeleteEvent(event.id))}>
                  Delete event
                </Button>
              </div>
            </Card>
          ))}
          {data.events.length === 0 && <Card><p className="muted">No events to manage.</p></Card>}
        </div>
      </section>

      <section className="section">
        <SectionTitle eyebrow="Staffing requests" title="Review and manage crew requests." />
        <div className="stack">
          {data.requests.map((staffingRequest) => (
            <Card key={staffingRequest.id}>
              <div className="listing-heading">
                <div><h3>{requestsByEvent.get(staffingRequest.eventId) ?? "Event unavailable"}</h3>
                  <p className="muted">{staffingRequest.quantity} additional · {staffingRequest.duty} · {formatDate(staffingRequest.createdAt)}</p>
                </div>
                <span className="status-tag">{staffingRequest.status}</span>
              </div>
              <div className="admin-row">
                <SelectField
                  label="Request status"
                  value={staffingRequest.status}
                  onChange={(change) => void onUpdateRequest(staffingRequest.id, change.target.value as RequestStatus)}
                  options={["Pending", "Approved", "Rejected", "Cancelled"]}
                />
                <Button onClick={() => confirmAction("Delete this staffing request?", () => onDeleteRequest(staffingRequest.id))}>
                  Delete request
                </Button>
              </div>
            </Card>
          ))}
          {data.requests.length === 0 && <Card><p className="muted">No staffing requests yet.</p></Card>}
        </div>
      </section>
    </div>
  );
}

function EventEditor({
  event,
  onSave,
}: {
  event: Event;
  onSave: (changes: Partial<Event>) => Promise<void>;
}) {
  const [title, setTitle] = useState(event.title);
  const [venue, setVenue] = useState(event.venue);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [duty, setDuty] = useState(event.duty);
  const [required, setRequired] = useState(String(event.required));
  const [assigned, setAssigned] = useState(String(event.assigned));

  async function submit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const requiredCount = Number(required);
    const assignedCount = Number(assigned);
    if (!Number.isInteger(requiredCount) || !Number.isInteger(assignedCount)) return;
    await onSave({
      title: title.trim(),
      venue: venue.trim(),
      date,
      time,
      duty,
      required: requiredCount,
      assigned: assignedCount,
    });
  }

  return (
    <details className="event-editor">
      <summary>Edit event details</summary>
      <form className="form-grid" onSubmit={(formEvent) => void submit(formEvent)}>
        <Field label="Event name" value={title} onChange={(change) => setTitle(change.target.value)} required />
        <Field label="Venue" value={venue} onChange={(change) => setVenue(change.target.value)} required />
        <Field label="Date" type="date" value={date} onChange={(change) => setDate(change.target.value)} required />
        <Field label="Time" type="time" value={time} onChange={(change) => setTime(change.target.value)} required />
        <SelectField label="Primary duty" value={duty} onChange={(change) => setDuty(change.target.value)} options={[...DUTIES]} />
        <Field label="Crew required" type="number" min="1" max="5000" value={required} onChange={(change) => setRequired(change.target.value)} required />
        <Field label="Crew assigned" type="number" min="0" max="5000" value={assigned} onChange={(change) => setAssigned(change.target.value)} required />
        <div className="full-width"><Button primary type="submit">Save event details</Button></div>
      </form>
    </details>
  );
}
