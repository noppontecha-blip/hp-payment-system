import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warn" | "danger";

// Corner-folded ribbon accent — sits absolutely inside a `relative` ancestor, top-right corner.
// Reuses the same tone palette as status-badge.tsx's StatusBadge (the inline quick-glance badge
// stays where it is; this is the extra "professional document" corner accent the reference asked for).
const toneClasses: Record<Tone, string> = {
  success: "bg-success text-white",
  info: "bg-info text-white",
  warn: "bg-warn text-white",
  danger: "bg-danger text-white",
};

export function RibbonBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <div className="pointer-events-none absolute top-0 right-0 z-10 size-36 overflow-hidden">
      <div
        className={cn(
          "absolute top-[30px] right-[-46px] w-[220px] rotate-45 py-1.5 text-center text-[10px] font-bold whitespace-nowrap shadow-sm",
          toneClasses[tone],
        )}
      >
        {label}
      </div>
    </div>
  );
}
