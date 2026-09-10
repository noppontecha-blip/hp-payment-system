import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success border-l-success",
  info: "bg-info-bg text-info border-l-info",
  warn: "bg-warn-bg text-warn border-l-warn",
  danger: "bg-danger-bg text-danger border-l-danger",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border-l-[3px] px-[9px] py-[3px] text-[11px] font-bold",
        toneClasses[tone],
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}

export function docStatusTone(documentType: string): Tone {
  return documentType === "ยังไม่มีเอกสาร" ? "warn" : "success";
}
