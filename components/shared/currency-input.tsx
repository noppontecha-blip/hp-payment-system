"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function CurrencyInput({
  value,
  onChange,
  className,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  return (
    <Input
      inputMode="decimal"
      disabled={disabled}
      value={focused ? text : formatNumber(value)}
      onFocus={() => {
        setFocused(true);
        setText(value === 0 ? "" : String(value));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (/^\d*\.?\d*$/.test(raw)) {
          setText(raw);
          const parsed = parseFloat(raw);
          onChange(Number.isNaN(parsed) ? 0 : parsed);
        }
      }}
      onBlur={() => setFocused(false)}
      className={cn("text-right", className)}
    />
  );
}
