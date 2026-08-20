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

// Smaller footprint + partial opacity than a typical corner sash — the original full-size,
// fully-opaque version sat directly over the "เลข HP" label in the header card underneath it,
// making the HP number unreadable. Shrinking the band and letting it read through keeps the
// corner-accent look without blocking real document data.
export function RibbonBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <div className="pointer-events-none absolute top-0 right-0 z-10 size-20 overflow-hidden">
      <div
        className={cn(
          "absolute top-[14px] right-[-32px] w-[150px] rotate-45 py-1 text-center text-[9px] font-bold whitespace-nowrap opacity-80 shadow-sm",
          toneClasses[tone],
        )}
      >
        {label}
      </div>
    </div>
  );
}
