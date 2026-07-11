"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatThaiDate, parseISODate, toISODateString } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";

function formatThaiCaption(date: Date): string {
  const month = date.toLocaleDateString("th-TH", { month: "long" });
  return `${month} ${date.getFullYear() + 543}`;
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
  const selected = value ? parseISODate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {value ? formatThaiDate(value) : "dd/mm/yyyy"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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
  );
}
