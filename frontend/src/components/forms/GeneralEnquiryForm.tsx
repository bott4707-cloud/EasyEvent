import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "../common/Button";
import { Input, Textarea } from "../common/Input";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;

export function GeneralEnquiryForm({
  initialSubject = "",
  initialMessage = "",
}: {
  initialSubject?: string;
  initialMessage?: string;
}) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !EMAIL_PATTERN.test(email.trim())) {
      showToast("Please enter your name and a valid email address.", "error");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showToast("Please write a subject and your question.", "error");
      return;
    }

    const fields: [string, string][] = [
      ["From", name],
      ["Email", email],
      ["Subject", subject],
      ["Message", message],
    ];

    const body = fields.map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href = `mailto:hello@easyevent.in?subject=${encodeURIComponent(
      `EASYEVENT Enquiry: ${subject}`
    )}&body=${encodeURIComponent(body)}`;

    showToast("Email draft prepared in your email app. Review and send!");
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <Input
        label={t("label_your_name")}
        placeholder="e.g. Priya Sharma"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label={t("label_email")}
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label={t("label_subject")}
        className="full-width"
        placeholder="e.g. Question regarding crew booking in Whitefield"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
      />
      <Textarea
        label={t("label_message")}
        className="full-width"
        placeholder="Tell us what you need or what question you have..."
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <div className="full-width form-actions">
        <Button variant="primary" type="submit" icon={<Send size={16} />}>
          {t("btn_send_email")}
        </Button>
      </div>
    </form>
  );
}
