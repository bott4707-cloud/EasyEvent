import { useState, type FormEvent } from "react";
import {
  Shield,
  ShieldAlert,
  Users,
  Calendar,
  Layers,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { DUTIES, formatDate } from "../data/mockData";
import { Button } from "../components/common/Button";
import { Card } from "../components/common/Card";
import { Badge } from "../components/common/Badge";
import { StatCard } from "../components/common/StatCard";
import { Modal } from "../components/common/Modal";
import { Input } from "../components/common/Input";
import { Select } from "../components/common/Select";
import { LanguageSelector } from "../components/common/LanguageSelector";

export function AdminDashboard({ navigate }: { navigate: (route: string) => void }) {
  const {
    currentUser,
    appData,
    createEvent,
    updateAdminEvent,
    deleteAdminEvent,
    updateAdminRequest,
    deleteAdminRequest,
    deleteAdminUser,
    updateShift,
  } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"events" | "requests" | "users" | "shifts">("events");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Add event form states
  const [newTitle, setNewTitle] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuty, setNewDuty] = useState<string>(DUTIES[0]);
  const [newRequired, setNewRequired] = useState("20");

  // STRICT ACCESS ISOLATION:
  // If not authenticated, require Admin sign in
  if (!currentUser) {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <Shield size={36} />
          </div>
          <h2 className="restriction-title">Admin Console Restricted</h2>
          <p className="restriction-text">
            You must be logged in with Administrator credentials to view platform audits and manage event workflows.
          </p>
          <div className="button-row justify-center">
            <Button variant="primary" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // If signed in with a non-admin role (worker or organizer), STRICTLY BLOCK access:
  // Workers and Organizers cannot view the Admin Console.
  if (currentUser.role !== "admin") {
    return (
      <div className="dashboard-page-container">
        <Card variant="elevated" className="access-restricted-card">
          <div className="restriction-icon-bubble">
            <ShieldAlert size={36} />
          </div>
          <h2 className="restriction-title">Access Restricted · Admin Console Only</h2>
          <p className="restriction-text">
            You are signed in as <strong>{currentUser.name}</strong> with the{" "}
            <span className="restriction-role-pill">{currentUser.role.toUpperCase()}</span> role.
            For platform integrity and data isolation, only administrators can access this console.
          </p>
          <div className="button-row justify-center">
            <Button
              variant="primary"
              onClick={() => navigate(`/${currentUser.role}`)}
            >
              Return to Your {currentUser.role === "worker" ? "Worker Dashboard" : "Organizer Studio"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleApproveEvent = async (id: string) => {
    try {
      await updateAdminEvent(id, { status: "Published" });
      showToast("Event approved and published!");
    } catch {
      showToast("Could not approve event.", "error");
    }
  };

  const handleRejectEvent = async (id: string) => {
    try {
      await updateAdminEvent(id, { status: "Rejected" });
      showToast("Event marked as rejected.");
    } catch {
      showToast("Could not reject event.", "error");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event permanently?")) return;
    try {
      await deleteAdminEvent(id);
      showToast("Event deleted.");
    } catch {
      showToast("Could not delete event.", "error");
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await updateAdminRequest(id, "Approved");
      showToast("Staffing request approved!");
    } catch {
      showToast("Could not approve request.", "error");
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await updateAdminRequest(id, "Rejected");
      showToast("Staffing request rejected.");
    } catch {
      showToast("Could not reject request.", "error");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await deleteAdminRequest(id);
      showToast("Request removed.");
    } catch {
      showToast("Could not delete request.", "error");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Remove this user account?")) return;
    try {
      await deleteAdminUser(id);
      showToast("User account removed.");
    } catch {
      showToast("Could not remove user.", "error");
    }
  };

  const handleShiftStatusChange = async (shiftId: string, newStatus: any) => {
    try {
      await updateShift(shiftId, newStatus);
      showToast(`Shift updated to ${newStatus}.`);
    } catch {
      showToast("Could not update shift.", "error");
    }
  };

  const handleCreatePlatformEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVenue.trim()) {
      showToast("Please provide event title and venue.", "error");
      return;
    }
    const crew = Number(newRequired);
    if (!crew || crew < 1) {
      showToast("Enter a valid crew count.", "error");
      return;
    }

    try {
      await createEvent({
        title: newTitle.trim(),
        venue: newVenue.trim(),
        date: newDate,
        time: newTime,
        duty: newDuty,
        required: crew,
      });
      showToast("Platform event added!");
      setIsAddEventModalOpen(false);
      setNewTitle("");
      setNewVenue("");
    } catch {
      showToast("Failed to create event.", "error");
    }
  };

  const filteredUsers = appData.users.filter((u) => {
    if (userRoleFilter === "all") return true;
    return u.role === userRoleFilter;
  });

  return (
    <div className="dashboard-page-container">
      {/* Top Banner */}
      <div className="dashboard-header-block">
        <div>
          <span className="dashboard-eyebrow">{t("admin_eyebrow")}</span>
          <h1 className="dashboard-title">{t("admin_title")}</h1>
          <p className="dashboard-subtitle">
            {t("admin_subtitle")}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <LanguageSelector variant="header" />
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsAddEventModalOpen(true)}
          >
            Add Platform Event
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Registered Users"
          value={appData.users.length}
          caption="Crew's & Event Organizers"
          color="blue"
          icon={<Users size={20} />}
        />
        <StatCard
          label="Total Platform Events"
          value={appData.events.length}
          caption="Published & Pending"
          color="emerald"
          icon={<Calendar size={20} />}
        />
        <StatCard
          label="Staffing Requests"
          value={appData.requests.length}
          caption="Pending coordinator action"
          color="purple"
          icon={<FileText size={20} />}
        />
        <StatCard
          label="Active Shifts"
          value={appData.shifts.length}
          caption="Assigned crew shifts"
          color="amber"
          icon={<Layers size={20} />}
        />
      </div>

      {/* Tab Selectors */}
      <div className="admin-tabs-row">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "events" ? "active" : ""}`}
          onClick={() => setActiveTab("events")}
        >
          <Calendar size={16} />
          <span>{t("admin_tab_events")} ({appData.events.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <FileText size={16} />
          <span>{t("admin_tab_requests")} ({appData.requests.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} />
          <span>{t("admin_tab_users")} ({appData.users.length})</span>
        </button>
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "shifts" ? "active" : ""}`}
          onClick={() => setActiveTab("shifts")}
        >
          <Layers size={16} />
          <span>{t("admin_tab_shifts")} ({appData.shifts.length})</span>
        </button>
      </div>

      {/* Tab Content: Events */}
      {activeTab === "events" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title & Venue</th>
                <th>Date & Duty</th>
                <th>Crew Status</th>
                <th>State</th>
                <th className="text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {appData.events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <strong>{event.title}</strong>
                    <div className="table-subtext">{event.venue}</div>
                  </td>
                  <td>
                    <div>{formatDate(event.date)}</div>
                    <div className="table-subtext">{event.duty}</div>
                  </td>
                  <td>
                    {event.assigned} / {event.required} assigned
                  </td>
                  <td>
                    <Badge status={event.status} />
                  </td>
                  <td className="text-right">
                    <div className="table-actions-row">
                      {event.status !== "Published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<CheckCircle size={14} className="text-emerald" />}
                          onClick={() => handleApproveEvent(event.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {event.status !== "Rejected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<XCircle size={14} className="text-amber" />}
                          onClick={() => handleRejectEvent(event.id)}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} className="text-danger" />}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Requests */}
      {activeTab === "requests" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Quantity & Duty</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appData.requests.map((req) => {
                const event = appData.events.find((e) => e.id === req.eventId);
                return (
                  <tr key={req.id}>
                    <td>
                      <strong>{event?.title || req.eventId}</strong>
                    </td>
                    <td>
                      +{req.quantity} ({req.duty})
                    </td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td>
                      <Badge status={req.status} />
                    </td>
                    <td className="text-right">
                      <div className="table-actions-row">
                        {req.status === "Pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<CheckCircle size={14} className="text-emerald" />}
                              onClick={() => handleApproveRequest(req.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<XCircle size={14} className="text-amber" />}
                              onClick={() => handleRejectRequest(req.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} className="text-danger" />}
                          onClick={() => handleDeleteRequest(req.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {appData.requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 muted-text">
                    No staffing requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Users */}
      {activeTab === "users" && (
        <div className="admin-users-block">
          <div className="user-role-filters">
            <span className="filter-label">Filter Role:</span>
            {["all", "worker", "organizer", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                className={`filter-role-chip ${userRoleFilter === r ? "active" : ""}`}
                onClick={() => setUserRoleFilter(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Badge status={user.role} />
                    </td>
                    <td className="text-right">
                      {user.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} className="text-danger" />}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Shifts Audit */}
      {activeTab === "shifts" && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Shift / Event</th>
                <th>Venue & Address</th>
                <th>Date & Reporting</th>
                <th>Duty & Lead</th>
                <th>Status</th>
                <th className="text-right">Quick Status</th>
              </tr>
            </thead>
            <tbody>
              {appData.shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <strong>{shift.title}</strong>
                    <div className="table-subtext">{shift.id}</div>
                  </td>
                  <td>
                    <div>{shift.venue}</div>
                    <div className="table-subtext">{shift.address}</div>
                  </td>
                  <td>
                    <div>{formatDate(shift.date)}</div>
                    <div className="table-subtext">{shift.reporting} - {shift.endTime}</div>
                  </td>
                  <td>
                    <div>{shift.duty}</div>
                    <div className="table-subtext">Supervisor: {shift.supervisor}</div>
                  </td>
                  <td>
                    <Badge status={shift.status} />
                  </td>
                  <td className="text-right">
                    <select
                      className="shift-status-select"
                      value={shift.status}
                      onChange={(e) => handleShiftStatusChange(shift.id, e.target.value)}
                    >
                      <option value="Assigned">Assigned</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Reporting">Reporting</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Platform Event */}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        title="Add Platform Event"
        description="Create a verified platform event listing directly in EASYEVENT."
      >
        <form onSubmit={handleCreatePlatformEvent} className="form-stack">
          <Input
            label="Event Name *"
            placeholder="e.g. Bengaluru Innovation Expo 2026"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <Input
            label="Venue & Area *"
            placeholder="e.g. BIEC, Tumkur Road, Bengaluru"
            value={newVenue}
            onChange={(e) => setNewVenue(e.target.value)}
            required
          />
          <div className="form-grid-2">
            <Input
              label="Date *"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <Input
              label="Reporting Time *"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              required
            />
          </div>
          <div className="form-grid-2">
            <Select
              label="Primary Duty *"
              value={newDuty}
              onChange={(e) => setNewDuty(e.target.value)}
              options={DUTIES}
            />
            <Input
              label="Crew Required *"
              type="number"
              min="1"
              value={newRequired}
              onChange={(e) => setNewRequired(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions-row">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsAddEventModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
