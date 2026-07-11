import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "success" | "danger" | "warn" | "info";

const accentIconBg: Record<Accent, string> = {
  success: "bg-success-bg text-success",
  danger: "bg-danger-bg text-danger",
  warn: "bg-warn-bg text-warn",
  info: "bg-info-bg text-info",
};

export function KpiCard({
  label,
  value,
  icon,
  accent = "info",
  trend,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: Accent;
  trend?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(20,25,40,.03)]">
      {icon && (
        <div
          className={cn(
            "flex size-[30px] items-center justify-center rounded-full",
            accentIconBg[accent],
          )}
        >
          {icon}
        </div>
      )}
      <p className="mt-2.5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
      {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
    </div>
  );
}
