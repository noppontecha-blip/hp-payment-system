"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Drag-and-drop wrapper around the hidden-<input type="file"> pattern already used for slip
// uploads — same onFile callback shape as a plain <input onChange>, just presented as a dropzone
// (matching the reference's "ลากไฟล์มาวาง" style) instead of a single small button.
export function FileDropzone({
  accept,
  disabled,
  onFile,
  label = "ลากไฟล์มาวาง หรือ",
  hint = "เพิ่มไฟล์ใหม่",
  attachedHint,
}: {
  accept?: string;
  disabled?: boolean;
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
  attachedHint?: string;
}) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors",
        dragging ? "border-info bg-info-bg" : "border-border bg-muted/40 hover:bg-muted",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      {disabled ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : (
        <Upload className="size-5 text-muted-foreground" />
      )}
      <span className="text-sm text-muted-foreground">
        {label} <span className="font-medium text-info">{hint}</span>
      </span>
      {attachedHint && <span className="text-xs text-muted-foreground">{attachedHint}</span>}
    </label>
  );
}
