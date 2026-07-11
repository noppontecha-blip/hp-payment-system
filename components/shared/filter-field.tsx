import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export const filterTriggerClassName =
  "h-auto rounded-[8px] border-border bg-card px-2.5 py-[6px] text-[12.5px] font-semibold text-ink";
