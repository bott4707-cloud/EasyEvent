import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  DUTIES,
  PREVIEW_VENUES,
  type Account,
  type AppData,
  type Event,
  type Role,
  type PreviewEvent,
} from "./data";
import { api, ApiError } from "./api";
import AdminDashboard from "./components/AdminDashboard";
import OrganizerDashboard from "./components/OrganizerDashboard";
import WorkerDashboard from "./components/WorkerDashboard";

const EMAIL = "hello@easyevent.in";
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
type Notice = { message: string; error?: boolean };
type AuthMode = "signin" | "signup";

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, hours, minutes),
  );
}

function Button({
  children,
  primary = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button className={`button ${primary ? "button-primary" : ""} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  );
}

function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function SelectField({
  label,
  options = [],
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options?: string[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <select {...props}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        {children}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

function App() {
  const [data, setData] = useState<AppData>({
    users: [],
    events: [],
    requests: [],
    shifts: [],
    available: false,
    availableDates: [],
  });
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const [enquiryDraft, setEnquiryDraft] = useState({ subject: "", message: "" });
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const [events, session] = await Promise.all([
          api.loadEvents(),
          api.loadSession().catch((error: unknown) => {
            if (error instanceof ApiError && error.status === 401) return null;
            throw error;
          }),
        ]);
        if (!active) return;
        setPublicEvents(events);
        if (session) {
          setCurrentUser(session.user);
          setData(session.data);
        }
      } catch (error) {
        console.error("Could not load EASYEVENT from the backend.", error);
        if (active) notify(error instanceof Error ? error.message : "Could not connect to the EASYEVENT backend.", true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const navigate = useCallback((route: string) => {
    if (window.location.pathname !== route) window.history.pushState({}, "", route);
    setPath(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function openEnquiry(subject = "", message = "") {
    setEnquiryDraft({ subject, message });
    navigate("/enquiry");
  }

  function notify(message: string, error = false) {
    setNotice({ message, error });
  }

  async function refreshBackendState() {
    const [session, events] = await Promise.all([api.reloadState(), api.loadEvents()]);
    setCurrentUser(session.user);
    setData(session.data);
    setPublicEvents(events);
  }

  async function performAction(action: () => Promise<unknown>, successMessage: string): Promise<boolean> {
    try {
      await action();
      await refreshBackendState();
      notify(successMessage);
      return true;
    } catch (error) {
      console.error("EASYEVENT backend action failed.", error);
      notify(error instanceof Error ? error.message : "The change could not be saved.", true);
      return false;
    }
  }

  async function submitAuth(
    mode: AuthMode,
    name: string,
    email: string,
    password: string,
    confirm: string,
    role: Role,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || !EMAIL_PATTERN.test(normalizedEmail)) {
      notify("Enter a valid email address.", true);
      return;
    }
    if (mode === "signin") {
      try {
        const session = await api.login(normalizedEmail, password);
        setCurrentUser(session.user);
        setData(session.data);
        setPublicEvents(await api.loadEvents());
        navigate(`/${session.user.role}`);
      } catch (error) {
        notify(error instanceof Error ? error.message : "Sign in could not be completed.", true);
      }
      return;
    }
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 100) {
      notify("Enter your full name.", true);
      return;
    }
    if (password.length < 8 || password.length > 128) {
      notify("Choose a password between 8 and 128 characters.", true);
      return;
    }
    if (password !== confirm) {
      notify("The passwords do not match.", true);
      return;
    }
    if (role === "admin") {
      notify("Admin accounts are created by the server administrator.", true);
      return;
    }
    try {
      const session = await api.signup({ name: cleanName, email: normalizedEmail, password, role });
      setCurrentUser(session.user);
      setData(session.data);
      setPublicEvents(await api.loadEvents());
      navigate(`/${session.user.role}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Account creation could not be completed.", true);
    }
  }

  function openEmail(subject: string, fields: [string, string][]) {
    const body = fields.map(([key, value]) => `${key}: ${value.trim() || "Not provided"}`).join("\n");
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    notify("Email draft opened. Review it and send it from your email app.");
  }

  async function signOut() {
    try {
      await api.logout();
      setCurrentUser(null);
      setData({ users: [], events: [], requests: [], shifts: [], available: false, availableDates: [] });
      navigate("/");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Sign out could not be completed.", true);
    }
  }

  const requestedRole: Role = path.includes("organizer") ? "organizer" : path.includes("admin") ? "admin" : "worker";
  const isAuth = path.startsWith("/auth");

  let page: ReactNode;
  if (loading) {
    page = <div className="content"><p className="muted">Connecting to EASYEVENT…</p></div>;
  } else if (path === "/enquiry") {
    page = (
      <EnquiryPage
        initialDraft={enquiryDraft}
        openEmail={openEmail}
        notify={notify}
        navigate={navigate}
      />
    );
  } else if (isAuth) {
    page = currentUser ? (
      <RoleRedirect role={currentUser.role} currentUser={currentUser} navigate={navigate} />
    ) : (
      <AuthPage
        role={requestedRole}
        onSubmit={submitAuth}
        navigate={navigate}
        notify={notify}
      />
    );
  } else if (path === "/worker") {
    page = currentUser?.role === "worker" ? (
      <WorkerDashboard
        data={data}
        user={currentUser}
        onUpdateShift={(shiftId, status) => performAction(
          () => api.updateShift(shiftId, status),
          `Shift status updated to ${status}.`,
        ).then(() => undefined)}
        onUpdateAvailability={(change) => performAction(
          () => api.updateAvailability(change),
          "Availability updated.",
        ).then(() => undefined)}
      />
    ) : (
      <RoleRedirect role="worker" currentUser={currentUser} navigate={navigate} />
    );
  } else if (path === "/organizer") {
    page = currentUser?.role === "organizer" ? (
      <OrganizerDashboard
        data={data}
        user={currentUser}
        onCreateEvent={(event) => performAction(
          () => api.createEvent(event),
          "Event saved and sent for Admin review.",
        )}
        onCreateRequest={(request) => performAction(
          () => api.createRequest(request),
          "Staffing request saved.",
        )}
        onCancelRequest={(requestId) => performAction(
          () => api.cancelRequest(requestId),
          "Staffing request withdrawn.",
        ).then(() => undefined)}
        notify={notify}
      />
    ) : (
      <RoleRedirect role="organizer" currentUser={currentUser} navigate={navigate} />
    );
  } else if (path === "/admin") {
    page = currentUser?.role === "admin" ? (
      <AdminDashboard
        data={data}
        user={currentUser}
        onDeleteUser={async (id) => { await performAction(() => api.deleteUser(id), "Account removed."); }}
        onUpdateEvent={async (id, changes) => { await performAction(() => api.updateEvent(id, changes), "Event updated."); }}
        onDeleteEvent={async (id) => { await performAction(() => api.deleteEvent(id), "Event deleted."); }}
        onUpdateRequest={async (id, status) => { await performAction(() => api.updateRequest(id, status), "Staffing request updated."); }}
        onDeleteRequest={async (id) => { await performAction(() => api.deleteRequest(id), "Staffing request deleted."); }}
      />
    ) : (
      <RoleRedirect role="admin" currentUser={currentUser} navigate={navigate} />
    );
  } else {
    page = (
      <HomePage
        navigate={navigate}
        notify={notify}
        openEmail={openEmail}
        events={publicEvents.map((event) => ({
          ...event,
          city: "Bengaluru",
          roles: [event.duty],
          description: `${event.title} is recruiting ${event.duty.toLowerCase()} staff in Bengaluru.`,
        }))}
      />
    );
  }

  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => navigate("/")} aria-label="EASYEVENT home">
          <span className="brand-mark">E</span>
          <span>EASYEVENT</span>
        </button>
        <nav className="site-nav" aria-label="Main navigation">
          <button className="nav-link" onClick={() => navigate("/")}>Browse events</button>
          {currentUser ? (
            <>
              <button className="nav-link" onClick={() => navigate(`/${currentUser.role}`)}>
                {currentUser.role === "organizer" ? "Organizer" : currentUser.role === "admin" ? "Admin" : "Worker"} dashboard
              </button>
              <button className="nav-link" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => navigate("/auth/worker")}>Worker sign in</button>
              <button className="nav-link" onClick={() => navigate("/auth/organizer")}>Organizer sign in</button>
              <button className="nav-link" onClick={() => navigate("/auth/admin")}>Admin sign in</button>
            </>
          )}
          <button className="nav-link nav-enquiry" onClick={() => openEnquiry()}>Enquiry</button>
        </nav>
      </header>
      <main>{page}</main>
      {notice && (
        <div className={`toast ${notice.error ? "toast-error" : ""}`} role="status">
          {notice.message}
          <button aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button>
        </div>
      )}
      <footer className="site-footer">EASYEVENT · Bengaluru · <a href={`mailto:${EMAIL}`}>{EMAIL}</a></footer>
    </>
  );
}

function RoleRedirect({
  role,
  currentUser,
  navigate,
}: {
  role: Role;
  currentUser: Account | null;
  navigate: (route: string) => void;
}) {
  useEffect(() => {
    navigate(currentUser ? `/${currentUser.role}` : `/auth/${role}`);
  }, [currentUser, navigate, role]);
  return null;
}

function AuthPage({
  role,
  onSubmit,
  navigate,
  notify,
}: {
  role: Role;
  onSubmit: (mode: AuthMode, name: string, email: string, password: string, confirm: string, role: Role) => Promise<void>;
  navigate: (route: string) => void;
  notify: (message: string, error?: boolean) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const [busy, setBusy] = useState(false);
  const canSignUp = role !== "admin";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSubmit(mode, name, email, password, confirm, selectedRole);
    } catch (error) {
      console.error("Authentication could not be completed.", error);
      notify("Authentication could not be completed. Check browser support and try again.", true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-intro">
        <span className="eyebrow">WELCOME TO EASYEVENT</span>
        <h1>The right event work starts here.</h1>
        <p>Sign in securely to your Worker, Organizer, or Admin workspace.</p>
      </div>
      <Card className="auth-card">
        <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">
          {mode === "signin"
            ? `Sign in to continue to your ${role === "admin" ? "Admin" : role} dashboard.`
            : "Choose your role to open the right workspace."}
        </p>
        <form onSubmit={submit} className="form-stack">
          {mode === "signup" && (
            <>
              <Field label="Full name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
              <SelectField
                label="I am joining as"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as Role)}
                options={["worker", "organizer"]}
              />
            </>
          )}
          <Field label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Field
            label="Password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={mode === "signup" ? 8 : undefined}
            maxLength={128}
            required
          />
          {mode === "signup" && (
            <Field label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
          )}
          <Button primary type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </form>
        {canSignUp && (
          <button className="text-button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "New to EASYEVENT? Create an account" : "Already have an account? Sign in"}
          </button>
        )}
        <p className="fine-print">
          Accounts and dashboard changes are stored securely by the EASYEVENT backend.
        </p>
        <Button onClick={() => navigate("/")}>Back to browse events</Button>
      </Card>
    </div>
  );
}

function EnquiryPage({
  initialDraft,
  openEmail,
  notify,
  navigate,
}: {
  initialDraft: { subject: string; message: string };
  openEmail: (subject: string, fields: [string, string][]) => void;
  notify: (message: string, error?: boolean) => void;
  navigate: (route: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(initialDraft.subject);
  const [message, setMessage] = useState(initialDraft.message);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !EMAIL_PATTERN.test(email.trim())) {
      notify("Enter your name and a valid email address.", true);
      return;
    }
    if (!subject.trim() || !message.trim()) {
      notify("Add a subject and your question so we can help.", true);
      return;
    }
    openEmail(`EASYEVENT enquiry: ${subject.trim()}`, [
      ["name", name],
      ["email", email],
      ["question", message],
    ]);
  }

  return (
    <div className="content">
      <SectionTitle eyebrow="We're here to help" title="Send us an enquiry." subtitle="Your email app will open with a draft for you to review and send." />
      <Card>
        <form className="form-grid" onSubmit={submit}>
          <Field label="Your name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Field label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Field className="full-width" label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
          <TextAreaField className="full-width" label="Your question" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} required />
          <div className="full-width button-row">
            <Button primary type="submit">Continue by email</Button>
            <Button type="button" onClick={() => navigate("/")}>Back to events</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function HomePage({
  navigate,
  notify,
  openEmail,
  events: previewEvents,
}: {
  navigate: (route: string) => void;
  notify: (message: string, error?: boolean) => void;
  openEmail: (subject: string, fields: [string, string][]) => void;
  events: PreviewEvent[];
}) {
  const [eventQuery, setEventQuery] = useState("");
  const [dutyFilter, setDutyFilter] = useState("All duties");
  const [monthFilter, setMonthFilter] = useState("Any date");
  const [venueQuery, setVenueQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<PreviewEvent | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<(typeof PREVIEW_VENUES)[number] | null>(null);
  const [workerForm, setWorkerForm] = useState({
    name: "", phone: "", email: "", duty: "Choose a duty", experience: "New to events",
    skills: "", available: "", notes: "", consent: false,
  });
  const [orgForm, setOrgForm] = useState({
    name: "", company: "", email: "", phone: "", gstin: "", title: "", venue: "",
    duty: "Choose a duty", start: "", end: "", attendees: "", crew: "", notes: "", consent: false,
  });
  const [generalForm, setGeneralForm] = useState({
    name: "", email: "", subject: "", message: "",
  });

  const events = useMemo(() => previewEvents.filter((event) => {
    const queryMatch = !eventQuery.trim() || [event.title, event.venue, event.city, ...event.roles]
      .join(" ").toLowerCase().includes(eventQuery.trim().toLowerCase());
    const monthPrefix = ({
      "November 2026": "2026-11",
      "December 2026": "2026-12",
      "January 2027": "2027-01",
    } as Record<string, string>)[monthFilter];
    return queryMatch && (dutyFilter === "All duties" || event.roles.includes(dutyFilter)) &&
      (!monthPrefix || event.date.startsWith(monthPrefix));
  }), [dutyFilter, eventQuery, monthFilter, previewEvents]);

  const venues = useMemo(() => PREVIEW_VENUES.filter((venue) => !venueQuery.trim() ||
    `${venue.name} Bengaluru ${venue.area} ${venue.kind} ${venue.capacity}`.toLowerCase()
      .includes(venueQuery.trim().toLowerCase())), [venueQuery]);

  function submitWorker(event: FormEvent) {
    event.preventDefault();
    if (!workerForm.name.trim() || !workerForm.phone.trim() || !EMAIL_PATTERN.test(workerForm.email.trim())) {
      notify("Enter your name, phone number, and a valid email address.", true);
      return;
    }
    if (workerForm.duty === "Choose a duty") {
      notify("Choose a preferred duty.", true);
      return;
    }
    if (!workerForm.consent) {
      notify("Consent is required before preparing the email.", true);
      return;
    }
    openEmail("EASYEVENT worker interest", [
      ["name", workerForm.name], ["phone", workerForm.phone], ["email", workerForm.email],
      ["preferred duty", workerForm.duty], ["experience", workerForm.experience],
      ["skills", workerForm.skills], ["available from", workerForm.available], ["notes", workerForm.notes],
    ]);
  }

  function submitGeneralEnquiry(event: FormEvent) {
    event.preventDefault();
    if (!generalForm.name.trim() || !EMAIL_PATTERN.test(generalForm.email.trim())) {
      notify("Enter your name and a valid email address.", true);
      return;
    }
    if (!generalForm.subject.trim() || !generalForm.message.trim()) {
      notify("Add a subject and your question so we can help.", true);
      return;
    }
    openEmail("EASYEVENT enquiry: " + generalForm.subject.trim(), [
      ["name", generalForm.name],
      ["email", generalForm.email],
      ["question", generalForm.message],
    ]);
  }

  function submitOrganizer(event: FormEvent) {
    event.preventDefault();
    const start = new Date(`${orgForm.start}T00:00:00`);
    const end = new Date(`${orgForm.end}T00:00:00`);
    const crew = Number(orgForm.crew);
    if (!orgForm.name.trim() || !orgForm.email.trim() || !EMAIL_PATTERN.test(orgForm.email.trim())) {
      notify("Enter your name and a valid email address.", true);
      return;
    }
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !Number.isInteger(crew)) {
      notify("Use valid dates and enter a whole number for crew required.", true);
      return;
    }
    if (end < start) {
      notify("Event end date must be the same as or later than the start date.", true);
      return;
    }
    if (crew < 1 || orgForm.duty === "Choose a duty") {
      notify("Choose a primary duty and enter at least one crew member.", true);
      return;
    }
    if (!orgForm.consent) {
      notify("Consent is required before preparing the email.", true);
      return;
    }
    openEmail("EASYEVENT event staffing request", [
      ["name", orgForm.name], ["organisation", orgForm.company], ["email", orgForm.email],
      ["phone", orgForm.phone], ["gstin", orgForm.gstin], ["event", orgForm.title],
      ["venue", orgForm.venue], ["city", "Bengaluru"], ["start date", orgForm.start],
      ["end date", orgForm.end], ["expected attendees", orgForm.attendees],
      ["primary duty", orgForm.duty], ["crew required", orgForm.crew], ["notes", orgForm.notes],
    ]);
  }

  const setWorker = (field: keyof typeof workerForm, value: string | boolean) =>
    setWorkerForm((previous) => ({ ...previous, [field]: value }));
  const setOrg = (field: keyof typeof orgForm, value: string | boolean) =>
    setOrgForm((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="content home-content">
      <Card className="hero">
        <span className="eyebrow">EVENT STAFFING, MADE SIMPLE</span>
        <h1>The right crew. Every event.</h1>
        <p>Find dependable event staff, explore venues, and bring your next gathering to life - all in one easy place.</p>
        <div className="button-row">
          <Button primary onClick={() => navigate("/worker")}>Worker dashboard</Button>
          <Button onClick={() => navigate("/organizer")}>Organizer dashboard</Button>
        </div>
        <span className="muted">Bengaluru only · Clear shift details · People-powered events</span>
      </Card>

      <section className="section">
        <SectionTitle eyebrow="Find your next shift" title="Events worth showing up for." subtitle="Explore example event opportunities around Bengaluru." />
        <div className="filter-row">
          <Field label="Search events" placeholder="Search events, venues, or duties" value={eventQuery} onChange={(event) => setEventQuery(event.target.value)} />
          <SelectField label="Duty" value={dutyFilter} onChange={(event) => setDutyFilter(event.target.value)} options={["All duties", ...DUTIES]} />
          <SelectField label="Date" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} options={["Any date", "November 2026", "December 2026", "January 2027"]} />
        </div>
        <p className="muted result-count">{events.length} event opportunit{events.length === 1 ? "y" : "ies"}</p>
        <div className="listing-grid">
          {events.map((event) => (
            <Card key={event.id} className="listing-card">
              <div className="listing-heading">
                <div><h3>{event.title}</h3><p className="muted">{formatDate(event.date)} · {event.venue} · Bengaluru</p></div>
              </div>
              <p>{formatTime(event.time)} reporting · {event.roles.length} duties · {Math.max(0, event.required - event.assigned)} crew still needed*</p>
              <progress value={Math.min(1, event.assigned / event.required)} />
              <p className="muted small-text">{event.roles.join(" · ")}</p>
              <div className="button-row">
                <Button onClick={() => { setSelectedEvent(event); setSelectedVenue(null); }}>View details</Button>
                <Button primary onClick={() => {
                  setWorker("notes", `I'm interested in: ${event.title}`);
                  const enquiry = document.getElementById("worker-enquiry");
                  if (enquiry instanceof HTMLDetailsElement) enquiry.open = true;
                  window.setTimeout(() => enquiry?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                  notify("Added this event to your crew interest note. Complete the form below.");
                }}>I'm interested</Button>
              </div>
            </Card>
          ))}
          {events.length === 0 && <p className="muted">No matching opportunities. Try a different search or duty.</p>}
        </div>
        {(selectedEvent || selectedVenue) && (
          <Card className="detail-card">
            {selectedEvent ? (
              <>
                <h3>{selectedEvent.title}</h3>
                <p>{selectedEvent.description}</p>
                <p>{formatDate(selectedEvent.date)} · Bengaluru · {selectedEvent.venue}<br />
                  Reporting {formatTime(selectedEvent.time)} · Duties: {selectedEvent.roles.join(", ")}<br />
                  Example staffing: {selectedEvent.assigned} of {selectedEvent.required} assigned.</p>
                <Button primary onClick={() => {
                  setOrg("title", selectedEvent.title);
                  const enquiry = document.getElementById("organizer-enquiry");
                  if (enquiry instanceof HTMLDetailsElement) enquiry.open = true;
                  window.setTimeout(() => enquiry?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                  notify("Event name added to the Organizer enquiry form below.");
                }}>Ask about this event</Button>
              </>
            ) : selectedVenue ? (
              <>
                <h3>{selectedVenue.name}</h3>
                <p>{selectedVenue.kind} example profile in {selectedVenue.area}, Bengaluru. Name, location, and capacity are illustrative and should be confirmed.</p>
                <p>Example capacity: up to {selectedVenue.capacity.toLocaleString("en-IN")} guests</p>
                <Button primary onClick={() => {
                  setOrg("venue", selectedVenue.name);
                  const enquiry = document.getElementById("organizer-enquiry");
                  if (enquiry instanceof HTMLDetailsElement) enquiry.open = true;
                  window.setTimeout(() => enquiry?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                  notify("Venue name added to the Organizer enquiry form below.");
                }}>Ask about this venue</Button>
              </>
            ) : null}
          </Card>
        )}
      </section>

      <section className="section">
        <SectionTitle eyebrow="Spaces with potential" title="Find a place for your people." subtitle="Example profiles only; venue availability and details are not verified." />
        <Field label="Search venues" placeholder="Search venue, area, or capacity" value={venueQuery} onChange={(event) => setVenueQuery(event.target.value)} />
        <p className="muted result-count">{venues.length} venue{venues.length === 1 ? "" : "s"}</p>
        <div className="listing-grid">
          {venues.map((venue) => (
            <Card key={venue.name}>
              <h3>{venue.name}</h3>
              <p className="muted">{venue.kind} · {venue.area}, Bengaluru</p>
              <p>Example capacity: up to {venue.capacity.toLocaleString("en-IN")} guests</p>
              <Button onClick={() => { setSelectedVenue(venue); setSelectedEvent(null); }}>View venue details</Button>
            </Card>
          ))}
          {venues.length === 0 && <p className="muted">No matching venues. Try another search term.</p>}
        </div>
      </section>

      <section className="section enquiry-section" id="general-enquiry">
        <SectionTitle eyebrow="We're here to help" title="What can we help you with?" subtitle="Ask us anything. Your email app will open with a draft for you to review and send." />
        <Card>
          <form className="form-grid enquiry-form" onSubmit={submitGeneralEnquiry}>
            <Field label="Your name" autoComplete="name" value={generalForm.name} onChange={(event) => setGeneralForm((previous) => ({ ...previous, name: event.target.value }))} required />
            <Field label="Email address" type="email" autoComplete="email" value={generalForm.email} onChange={(event) => setGeneralForm((previous) => ({ ...previous, email: event.target.value }))} required />
            <Field className="full-width" label="Subject" value={generalForm.subject} onChange={(event) => setGeneralForm((previous) => ({ ...previous, subject: event.target.value }))} required />
            <TextAreaField className="full-width" label="Your question" placeholder="Tell us how we can help…" rows={5} value={generalForm.message} onChange={(event) => setGeneralForm((previous) => ({ ...previous, message: event.target.value }))} required />
            <div className="full-width"><Button primary type="submit">Send an enquiry</Button></div>
          </form>
        </Card>
        <div className="specialist-enquiries">
          <details className="specialist-enquiry" id="worker-enquiry">
            <summary>Looking for event work? Send us your details</summary>
            <div className="specialist-content">
              <p className="muted">Share your experience and preferred shifts.</p>
              <form className="form-grid" onSubmit={submitWorker}>
                <Field label="Full name *" autoComplete="name" value={workerForm.name} onChange={(event) => setWorker("name", event.target.value)} required />
                <Field label="Phone number *" type="tel" placeholder="+91 98765 43210" autoComplete="tel" value={workerForm.phone} onChange={(event) => setWorker("phone", event.target.value)} required />
                <Field label="Email address *" type="email" autoComplete="email" placeholder="you@example.com" value={workerForm.email} onChange={(event) => setWorker("email", event.target.value)} required />
                <SelectField label="Preferred duty *" value={workerForm.duty} onChange={(event) => setWorker("duty", event.target.value)} options={["Choose a duty", ...DUTIES, "Open to different roles"]} />
                <SelectField label="Event experience" value={workerForm.experience} onChange={(event) => setWorker("experience", event.target.value)} options={["New to events", "Less than 1 year", "1-3 years", "3+ years"]} />
                <Field label="Skills" placeholder="Languages, first aid, service" value={workerForm.skills} onChange={(event) => setWorker("skills", event.target.value)} />
                <Field label="Available from" type="date" value={workerForm.available} onChange={(event) => setWorker("available", event.target.value)} />
                <TextAreaField className="full-width" label="Anything else?" placeholder="Availability, skills, or questions" value={workerForm.notes} onChange={(event) => setWorker("notes", event.target.value)} />
                <label className="consent full-width"><input type="checkbox" checked={workerForm.consent} onChange={(event) => setWorker("consent", event.target.checked)} /> I agree to share these details with EASYEVENT about event work.</label>
                <div className="full-width"><Button primary type="submit">Continue by email</Button></div>
              </form>
            </div>
          </details>
          <details className="specialist-enquiry" id="organizer-enquiry">
            <summary>Planning an event? Request staffing</summary>
            <div className="specialist-content">
              <p className="muted">Share the event details and crew you need.</p>
              <form className="form-grid" onSubmit={submitOrganizer}>
                <Field label="Your name *" autoComplete="name" value={orgForm.name} onChange={(event) => setOrg("name", event.target.value)} required />
                <Field label="Organisation" value={orgForm.company} onChange={(event) => setOrg("company", event.target.value)} />
                <Field label="Email address *" type="email" autoComplete="email" value={orgForm.email} onChange={(event) => setOrg("email", event.target.value)} required />
                <Field label="Phone number" type="tel" value={orgForm.phone} onChange={(event) => setOrg("phone", event.target.value)} />
                <Field label="Event name" value={orgForm.title} onChange={(event) => setOrg("title", event.target.value)} />
                <Field label="Venue and area" value={orgForm.venue} onChange={(event) => setOrg("venue", event.target.value)} />
                <SelectField label="Primary duty *" value={orgForm.duty} onChange={(event) => setOrg("duty", event.target.value)} options={["Choose a duty", ...DUTIES]} />
                <Field label="Start date *" type="date" value={orgForm.start} onChange={(event) => setOrg("start", event.target.value)} required />
                <Field label="End date *" type="date" value={orgForm.end} onChange={(event) => setOrg("end", event.target.value)} required />
                <Field label="Expected attendees" type="number" min="0" value={orgForm.attendees} onChange={(event) => setOrg("attendees", event.target.value)} />
                <Field label="Crew required *" type="number" min="1" value={orgForm.crew} onChange={(event) => setOrg("crew", event.target.value)} required />
                <TextAreaField className="full-width" label="Notes" value={orgForm.notes} onChange={(event) => setOrg("notes", event.target.value)} />
                <label className="consent full-width"><input type="checkbox" checked={orgForm.consent} onChange={(event) => setOrg("consent", event.target.checked)} /> I agree to share these details with EASYEVENT about staffing.</label>
                <div className="full-width"><Button primary type="submit">Prepare event enquiry</Button></div>
              </form>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}

export default App;
