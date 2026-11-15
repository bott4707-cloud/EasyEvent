import type { EventStatus, RequestStatus, Role, ShiftStatus } from "../../types";

export type BadgeVariant =
  | ShiftStatus
  | EventStatus
  | RequestStatus
  | Role
  | "default"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export function Badge({
  status,
  label,
  className = "",
}: {
  status: BadgeVariant;
  label?: string;
  className?: string;
}) {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`badge badge-${normalized} ${className}`}>
      <span className="badge-dot" />
      {label || status}
    </span>
  );
}
