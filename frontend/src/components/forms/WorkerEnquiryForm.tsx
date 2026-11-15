import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { DUTIES } from "../../data/mockData";
import { Button } from "../common/Button";
import { Input, Textarea } from "../common/Input";
import { Select } from "../common/Select";
import { useToast } from "../../context/ToastContext";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function WorkerEnquiryForm({ initialEventTitle = "" }: { initialEventTitle?: string }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [duty, setDuty] = useState("Choose a duty");
  const [experience, setExperience] = useState("New to events");
  const [skills, setSkills] = useState("");
  const [available, setAvailable] = useState("");
  const [notes, setNotes] = useState(
    initialEventTitle ? `I am interested in working at: ${initialEventTitle}` : ""
  );
  const [consent, setConsent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !EMAIL_PATTERN.test(email.trim())) {
      showToast("Please provide your name, phone number, and a valid email address.", "error");
      return;
    }
    if (duty === "Choose a duty") {
      showToast("Please select your preferred event duty.", "error");
      return;
    }
    if (!consent) {
      showToast("Please confirm consent to share your details.", "error");
      return;
    }

    const fields: [string, string][] = [
      ["Full Name", name],
      ["Phone", phone],
      ["Email", email],
      ["Preferred Duty", duty],
      ["Event Experience", experience],
      ["Skills / Languages", skills || "Not specified"],
      ["Available From", available || "Immediate"],
      ["Notes / Target Event", notes || "None"],
    ];

    const body = fields.map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:hello@easyevent.in?subject=${encodeURIComponent(
      `EASYEVENT Worker Interest: ${name}`
    )}&body=${encodeURIComponent(body)}`;

    showToast("Email draft prepared in your email app. Review and hit send!");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <Input
        label="Full Name *"
        placeholder="e.g. Rahul Sharma"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Phone Number *"
        type="tel"
        placeholder="+91 98765 43210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      <Input
        label="Email Address *"
        type="email"
        placeholder="rahul@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Select
        label="Preferred Duty *"
        value={duty}
        onChange={(e) => setDuty(e.target.value)}
        options={["Choose a duty", ...DUTIES, "Open to any role"]}
      />
      <Select
        label="Event Experience"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
        options={["New to events", "Less than 1 year", "1-3 years", "3+ years"]}
      />
      <Input
        label="Skills & Languages"
        placeholder="English, Kannada, Hindi, First Aid, etc."
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
      />
      <Input
        label="Available From"
        type="date"
        value={available}
        onChange={(e) => setAvailable(e.target.value)}
      />
      <Textarea
        label="Notes & Specific Interests"
        className="full-width"
        placeholder="Tell us about specific shifts or events you want to join..."
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
          I agree to share these details with EASYEVENT for event staffing opportunities in Bengaluru.
        </span>
      </label>

      <div className="full-width form-actions">
        <Button variant="primary" type="submit" icon={<Send size={16} />}>
          Prepare Application Email
        </Button>
      </div>
    </form>
  );
}
