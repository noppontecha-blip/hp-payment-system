"use client";

import { useMemo } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type VendorOption = { value: string; label: string };

// Search-select from vendor master, but also accepts free text for one-off payees not in the
// master list (spec section 5: ~25% of legacy rows are one-time payees / government agencies).
export function VendorCombobox({
  vendors,
  vendorId,
  vendorName,
  onChange,
}: {
  vendors: Vendor[];
  vendorId: string | null | undefined;
  vendorName: string;
  onChange: (next: { vendor_id: string | null; vendor_name_snapshot: string }) => void;
}) {
  const items = useMemo<VendorOption[]>(
    () => vendors.map((v) => ({ value: v.id, label: v.name })),
    [vendors],
  );
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  // Freeform names (no match in the vendor master) still get a real, joinable vendor_id —
  // this fixed "ทั่วไป" row instead of null — while vendor_name_snapshot keeps the actual
  // typed name for display.
  const genericVendor = vendors.find((v) => v.code === "V9999");

  return (
    <div className="space-y-1">
      <Combobox
        items={items}
        // Base UI calls this with either the full {value,label} item (while filtering the open
        // list) or with just the plain id string (e.g. resolving the currently selected value) —
        // confirmed empirically, since the docs only describe the {value,label}-item case. The
        // declared type says this is always a string, but that doesn't match runtime behavior.
        itemToStringLabel={(item: string) => {
          const raw = item as unknown as string | VendorOption;
          return typeof raw === "string" ? (vendors.find((v) => v.id === raw)?.name ?? "") : raw.label;
        }}
        value={vendorId ?? null}
        onValueChange={(value) => {
          const match = vendors.find((v) => v.id === value);
          onChange({ vendor_id: value, vendor_name_snapshot: match?.name ?? vendorName });
        }}
        inputValue={vendorName}
        onInputValueChange={(text, eventDetails) => {
          // Selecting an item (or closing/blurring the popup) also fires this callback with the
          // item's label — skip those so we don't immediately null out the vendor_id we just set
          // in onValueChange. Base UI's Combobox reports genuine keystrokes with reason
          // "input-change" (confirmed against node_modules/@base-ui/react's reason-parts.js —
          // the previous "none" check here never matched a real keystroke, silently breaking
          // freeform entry entirely).
          if (eventDetails.reason !== "input-change") {
            return;
          }
          onChange({ vendor_id: genericVendor?.id ?? null, vendor_name_snapshot: text });
        }}
      >
        <ComboboxInput placeholder="ค้นหาหรือพิมพ์ชื่อผู้จำหน่าย" className="w-full" />
        <ComboboxContent>
          <ComboboxEmpty>ไม่พบในฐานข้อมูล — จะบันทึกเป็นชื่อที่พิมพ์</ComboboxEmpty>
          <ComboboxList>
            {(item: VendorOption) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {selectedVendor?.bank_account && (
        <p className="text-xs text-muted-foreground">บัญชีธนาคาร: {selectedVendor.bank_account}</p>
      )}
    </div>
  );
}
