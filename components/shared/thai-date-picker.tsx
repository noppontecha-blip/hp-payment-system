"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatThaiDate, parseISODate, toADYear, toISODateString } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";

function formatThaiCaption(date: Date): string {
  const month = date.toLocaleDateString("th-TH", { month: "long" });
  return `${month} ${date.getFullYear() + 543}`;
}

const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

// dd/mm/yyyy in the Buddhist Era, e.g. "24/07/2569" — the same format formatThaiDate displays.
function parseTypedThaiDate(text: string): string | null {
  const match = text.trim().match(DATE_PATTERN);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const adYear = toADYear(Number(match[3]));
  const date = new Date(adYear, month - 1, day);
  // Date() silently rolls invalid days into the next month (e.g. 31/02) — reject those instead.
  if (date.getFullYear() !== adYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toISODateString(date);
}

export function ThaiDatePicker({
  value,
  onChange,
  className,
  disabled,
}: {
  value: string | null | undefined;
  onChange: (isoDate: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // null = not actively typing — display derives straight from `value`. Non-null only while the
  // input is focused/edited, so there's no prop-to-state sync effect to fight with React on.
  const [draftText, setDraftText] = useState<string | null>(null);
  const selected = value ? parseISODate(value) : undefined;
  const displayValue = draftText ?? (value ? formatThaiDate(value) : "");

  function commitTypedText(raw: string) {
    const trimmed = raw.trim();
    if (trimmed !== "") {
      const iso = parseTypedThaiDate(trimmed);
      // Invalid text is simply discarded — displayValue falls back to the last valid `value`
      // once draftText clears below, with no separate "revert" step needed.
      if (iso) onChange(iso);
    }
    setDraftText(null);
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={displayValue}
        placeholder="dd/mm/yyyy"
        disabled={disabled}
        className={cn("w-full", className)}
        onChange={(e) => setDraftText(e.target.value)}
        onBlur={(e) => commitTypedText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commitTypedText(e.currentTarget.value);
          }
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label="เลือกวันที่จากปฏิทิน"
              className="shrink-0"
            />
          }
        >
          <CalendarIcon className="size-4" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(toISODateString(date));
                setOpen(false);
              }
            }}
            formatters={{
              formatCaption: (date) => formatThaiCaption(date),
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
