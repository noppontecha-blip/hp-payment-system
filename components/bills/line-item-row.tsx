"use client";

import { Controller, type Control } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import type { HpBillFormValues } from "@/lib/validations/hp-line";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const NONE = "__none__";

// One row of the compact line-items table: รายละเอียด / รหัสบัญชี / รหัสรถ / ค่าใช้จ่าย.
// VAT and หัก ณ ที่จ่าย are decided once for the whole bill in BillForm, not per row.
export function LineItemRow({
  index,
  control,
  accounts,
  vehicles,
  onRemove,
  removable,
}: {
  index: number;
  control: Control<HpBillFormValues>;
  accounts: Account[];
  vehicles: Vehicle[];
  onRemove: () => void;
  removable: boolean;
}) {
  const path = `lines.${index}` as const;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-2 align-top">
        <Controller
          control={control}
          name={`${path}.description`}
          render={({ field, fieldState }) => (
            <div>
              <Input {...field} placeholder="เช่น ค่าซ่อมเครนเบอร์ C04" />
              {fieldState.error && (
                <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </td>
      <td className="p-2 align-top">
        <Controller
          control={control}
          name={`${path}.account_code_id`}
          render={({ field }) => (
            <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกรหัสบัญชี">
                  {(value: string) => {
                    if (value === NONE) return "ไม่ระบุ";
                    const account = accounts.find((a) => a.id === value);
                    return account ? `${account.code} — ${account.name}` : undefined;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </td>
      <td className="p-2 align-top">
        <Controller
          control={control}
          name={`${path}.vehicle_id`}
          render={({ field }) => (
            <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกรถ/เครน">
                  {(value: string) => {
                    if (value === NONE) return "ไม่ระบุ";
                    const vehicle = vehicles.find((v) => v.id === value);
                    return vehicle
                      ? `${vehicle.code}${vehicle.nickname ? ` (${vehicle.nickname})` : ""}`
                      : undefined;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.code} {v.nickname ? `(${v.nickname})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </td>
      <td className="p-2 align-top">
        <Controller
          control={control}
          name={`${path}.amount_before_vat`}
          render={({ field }) => <CurrencyInput value={field.value} onChange={field.onChange} />}
        />
      </td>
      <td className="p-2 align-top">
        {removable && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="ลบรายการ">
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </td>
    </tr>
  );
}
