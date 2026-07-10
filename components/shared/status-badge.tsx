import { cn } from "@/lib/utils";

type Tone = "success" | "warning";

const toneClasses: Record<Tone, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}

export function docStatusTone(status: string): Tone {
  return status === "ครบถ้วน" ? "success" : "warning";
}
