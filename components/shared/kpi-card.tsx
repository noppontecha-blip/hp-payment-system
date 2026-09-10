import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "success" | "danger" | "warn" | "info";

// Status color reads as a left-edge stripe, never a filled background — the
// accent hue itself stays reserved for the rust tag/highlight, not for KPI state.
const accentTone: Record<Accent, { icon: string; border: string }> = {
  success: { icon: "bg-success-bg text-success", border: "border-l-success" },
  danger: { icon: "bg-danger-bg text-danger", border: "border-l-danger" },
  warn: { icon: "bg-warn-bg text-warn", border: "border-l-warn" },
  info: { icon: "bg-info-bg text-info", border: "border-l-info" },
};

export function KpiCard({
  label,
  value,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: Accent;
  trend?: string;
}) {
  const tone = accent ? accentTone[accent] : null;
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3.5 shadow-[0_1px_2px_rgba(35,24,12,.05)]",
        tone && cn("border-l-4", tone.border),
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex size-[30px] items-center justify-center rounded-md",
            tone ? tone.icon : "bg-secondary text-navy",
          )}
        >
          {icon}
        </div>
      )}
      <p className="mt-2.5 text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
      {trend && <p className="mt-1 text-xs text-muted-2">{trend}</p>}
    </div>
  );
}
