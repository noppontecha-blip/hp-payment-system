import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warn" | "danger";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[11px] py-[3px] text-[11.5px] font-bold",
        toneClasses[tone],
      )}
    >
      {label}
    </span>
  );
}

export function docStatusTone(documentType: string): Tone {
  return documentType === "ยังไม่มีเอกสาร" ? "warn" : "success";
}
