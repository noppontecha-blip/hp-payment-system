import { cn } from "@/lib/utils";

// Outline pill — deliberately styled differently from StatusBadge (filled tint) so users don't
// confuse "ประเภทงาน" with document/WHT status (spec 6.4).
export function CategoryTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-navy-text/30 px-2.5 py-0.5 text-xs font-medium text-navy-text",
        className,
      )}
    >
      {label}
    </span>
  );
}
