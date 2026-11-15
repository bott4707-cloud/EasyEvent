import { type ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  color?: "emerald" | "amber" | "blue" | "purple";
}

export function StatCard({
  label,
  value,
  caption,
  icon,
  trend,
  color = "emerald",
}: StatCardProps) {
  return (
    <div className={`stat-card stat-color-${color}`}>
      <div className="stat-card-main">
        <div className="stat-card-top">
          <span className="stat-card-label">{label}</span>
          {icon && <div className={`stat-card-icon-wrapper ${color}`}>{icon}</div>}
        </div>
        <div className="stat-card-value">{value}</div>
      </div>
      {(caption || trend) && (
        <div className="stat-card-bottom">
          {trend && (
            <span className={`stat-trend ${trend.positive ? "trend-up" : "trend-down"}`}>
              {trend.value}
            </span>
          )}
          {caption && <span className="stat-caption">{caption}</span>}
        </div>
      )}
    </div>
  );
}
