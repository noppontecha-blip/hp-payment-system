import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "amber" | "success" | "info";

const accentBorder: Record<Accent, string> = {
  amber: "border-l-amber",
  success: "border-l-[#15803D]",
  info: "border-l-[#2563EB]",
};

const accentIconBg: Record<Accent, string> = {
  amber: "bg-amber/15 text-amber",
  success: "bg-success text-success-foreground",
  info: "bg-[#DBEAFE] text-[#2563EB]",
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
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-5 shadow-sm border-l-4",
        accentBorder[accent],
      )}
    >
      {icon && (
        <div
          className={cn(
            "absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg",
            accentIconBg[accent],
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy-text">{value}</p>
      {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
    </div>
  );
}
