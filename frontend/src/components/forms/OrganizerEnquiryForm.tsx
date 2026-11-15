import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { DUTIES } from "../../data/mockData";
import { Button } from "../common/Button";
import { Input, Textarea } from "../common/Input";
import { Select } from "../common/Select";
import { useToast } from "../../context/ToastContext";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function OrganizerEnquiryForm({
  initialEventTitle = "",
  initialVenue = "",
}: {
  initialEventTitle?: string;
  initialVenue?: string;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [title, setTitle] = useState(initialEventTitle);
  const [venue, setVenue] = useState(initialVenue);
  const [duty, setDuty] = useState("Choose a duty");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [attendees, setAttendees] = useState("");
  const [crew, setCrew] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !EMAIL_PATTERN.test(email.trim())) {
      showToast("Please enter your name and a valid email address.", "error");
      return;
    }

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    const crewNum = Number(crew);

    if (start && end && endDate < startDate) {
      showToast("End date must be the same as or after start date.", "error");
      return;
    }

    if (!Number.isInteger(crewNum) || crewNum < 1) {
      showToast("Please enter a valid crew requirement (at least 1 crew member).", "error");
      return;
    }

    if (!consent) {
      showToast("Please agree to the consent terms before submitting.", "error");
      return;
    }

    const fields: [string, string][] = [
      ["Contact Name", name],
      ["Company / Organization", company || "Independent Organizer"],
      ["Email", email],
      ["Phone", phone || "Not provided"],
      ["GSTIN", gstin || "N/A"],
      ["Event Name", title || "TBD"],
      ["Venue", venue || "Bengaluru"],
      ["Start Date", start],
      ["End Date", end],
      ["Expected Attendees", attendees || "N/A"],
      ["Primary Duty Required", duty],
      ["Crew Members Needed", crew],
      ["Additional Requirements", notes || "None"],
    ];

    const body = fields.map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:hello@easyevent.in?subject=${encodeURIComponent(
      `EASYEVENT Staffing Request: ${title || name}`
    )}&body=${encodeURIComponent(body)}`;

    showToast("Staffing request email prepared in your email client!");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <Input
        label="Organizer Name *"
        placeholder="e.g. Priya Iyer"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Organization / Agency"
        placeholder="e.g. Peak Events LLP"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />
      <Input
        label="Email Address *"
        type="email"
        placeholder="priya@peakevents.in"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Phone Number"
        type="tel"
        placeholder="+91 98450 11223"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        label="Event Name *"
        placeholder="e.g. South India Tech Summit 2026"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Input
        label="Venue / Area *"
        placeholder="e.g. BIEC, Whitefield or Palace Grounds"
        value={venue}
        onChange={(e) => setVenue(e.target.value)}
        required
      />
      <Select
        label="Primary Crew Duty *"
        value={duty}
        onChange={(e) => setDuty(e.target.value)}
        options={["Choose a duty", ...DUTIES]}
      />
      <Input
        label="Crew Required (Number) *"
        type="number"
        min="1"
        max="1000"
        placeholder="e.g. 15"
        value={crew}
        onChange={(e) => setCrew(e.target.value)}
        required
      />
      <Input
        label="Start Date *"
        type="date"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        required
      />
      <Input
        label="End Date *"
        type="date"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        required
      />
      <Input
        label="Expected Attendees"
        type="number"
        placeholder="e.g. 1500"
        value={attendees}
        onChange={(e) => setAttendees(e.target.value)}
      />
      <Input
        label="GSTIN (Optional)"
        placeholder="29AAAAA0000A1Z5"
        value={gstin}
        onChange={(e) => setGstin(e.target.value)}
      />
      <Textarea
        label="Staffing Notes & Brief"
        className="full-width"
        placeholder="Dress code, shift timings, special skills, briefing instructions..."
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <label className="checkbox-consent full-width">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          I confirm that I am authorized to request staffing for this event and agree to EASYEVENT's terms.
        </span>
      </label>

      <div className="full-width form-actions">
        <Button variant="primary" type="submit" icon={<Send size={16} />}>
          Prepare Staffing Request Email
        </Button>
      </div>
    </form>
  );
}
