import { CalendarDays } from "lucide-react";

export function LoadingFallback({ message = "Loading EasyEvent..." }: { message?: string }) {
  return (
    <div className="route-loading-wrapper" role="status" aria-live="polite">
      <div className="route-loading-card">
        <div className="route-loading-icon-pulse">
          <CalendarDays size={28} />
        </div>
        <div className="route-loading-spinner" />
        <span className="route-loading-text">{message}</span>
      </div>
    </div>
  );
}
