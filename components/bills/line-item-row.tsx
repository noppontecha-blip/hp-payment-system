"use client";

import { Controller, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
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
import { formatCurrency } from "@/lib/utils/format";
import type { HpBillFormValues } from "@/lib/validations/hp-line";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];

const NONE = "__none__";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// One row of the compact line-items table: รหัสบัญชี / รายละเอียด / รหัสรถ / จำนวนหน่วย ×
// ราคาต่อหน่วย = รวม, plus a slim second row for this line's own หมวดรายจ่าย (each line can now
// be a different category — a single document may mix ต้นทุนรายคัน, ค่าใช้จ่ายขายและบริหาร, and
// สินทรัพย์ lines). VAT and หัก ณ ที่จ่าย stay one decision for the whole bill, set in BillForm.
export function LineItemRow({
  index,
  control,
  setValue,
  accounts,
  vehicles,
  assetCategories,
  onRemove,
  removable,
}: {
  index: number;
  control: Control<HpBillFormValues>;
  setValue: UseFormSetValue<HpBillFormValues>;
  accounts: Account[];
  vehicles: Vehicle[];
  assetCategories: AssetCategory[];
  onRemove: () => void;
  removable: boolean;
}) {
  const path = `lines.${index}` as const;
  const expenseGroup = useWatch({ control, name: `${path}.expense_group` });
  const costSubtype = useWatch({ control, name: `${path}.cost_subtype` });
  const quantity = useWatch({ control, name: `${path}.quantity` });
  const unitPrice = useWatch({ control, name: `${path}.unit_price` });
  const total = useWatch({ control, name: `${path}.amount_before_vat` });
  const vehicleRequired = expenseGroup === "ต้นทุนรายคัน" && costSubtype === "อะไหล่ซ่อม/สต๊อก";

  function recomputeTotal(nextQuantity: number, nextUnitPrice: number) {
    setValue(`${path}.amount_before_vat`, round2(nextQuantity * nextUnitPrice));
  }

  return (
    <>
      <tr className="border-b border-border/60">
        <td className="p-2 align-top text-center text-muted-foreground">{index + 1}</td>
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
            name={`${path}.vehicle_id`}
            render={({ field, fieldState }) => (
              <div>
              <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={vehicleRequired ? "เลือกรถ (จำเป็น)" : "เลือกรถ"}>
                    {(value: string) => {
                      if (value === NONE) return "ไม่ระบุ";
                      const vehicle = vehicles.find((v) => v.id === value);
                      return vehicle ? (vehicle.short_name || vehicle.code) : undefined;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.short_name || v.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            name={`${path}.quantity`}
            render={({ field }) => (
              <Input
                type="number"
                step="0.01"
                min="0"
                className="text-right"
                value={field.value ?? ""}
                onChange={(e) => {
                  const next = e.target.value === "" ? 0 : Number(e.target.value);
                  field.onChange(next);
                  recomputeTotal(next, unitPrice || 0);
                }}
              />
            )}
          />
        </td>
        <td className="p-2 align-top">
          <Controller
            control={control}
            name={`${path}.unit_price`}
            render={({ field }) => (
              <CurrencyInput
                value={field.value ?? 0}
                onChange={(next) => {
                  field.onChange(next);
                  recomputeTotal(quantity || 0, next);
                }}
              />
            )}
          />
        </td>
        <td className="p-2 align-top">
          <div className="flex h-8 items-center justify-end rounded-lg bg-muted px-2.5 font-mono text-sm">
            {formatCurrency(total || 0)}
          </div>
        </td>
        <td className="p-2 align-top">
          {removable && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="ลบรายการ">
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </td>
      </tr>
      <tr className="border-b border-border last:border-0">
        <td colSpan={8} className="px-2 pb-2">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Controller
              control={control}
              name={`${path}.expense_group`}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                  }}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[9rem] bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ต้นทุนรายคัน">ต้นทุนรายคัน</SelectItem>
                    <SelectItem value="ค่าใช้จ่ายขายและบริหาร">ค่าใช้จ่ายขายและบริหาร</SelectItem>
                    <SelectItem value="สินทรัพย์">สินทรัพย์</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {expenseGroup === "ต้นทุนรายคัน" && (
              <Controller
                control={control}
                name={`${path}.cost_subtype`}
                render={({ field }) => (
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger className="h-7 w-auto min-w-[11rem] bg-background text-xs">
                      <SelectValue placeholder="เลือกประเภทต้นทุน">
                        {(value: string) => (value === NONE ? "เลือกประเภทต้นทุน" : value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="อะไหล่ซ่อม/สต๊อก">อะไหล่ซ่อม/สต๊อก (ระบุรถ/เครนได้)</SelectItem>
                      <SelectItem value="วัสดุสิ้นเปลือง">วัสดุสิ้นเปลือง (แยกรายคันไม่ได้)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            )}

            {expenseGroup === "สินทรัพย์" && (
              <>
                <Controller
                  control={control}
                  name={`${path}.asset_category_id`}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => {
                        if (v === NONE) {
                          field.onChange(null);
                          return;
                        }
                        field.onChange(v);
                        const category = assetCategories.find((c) => c.id === v);
                        setValue(
                          `${path}.asset_useful_life_years`,
                          category?.default_useful_life_years ?? null,
                        );
                      }}
                    >
                      <SelectTrigger className="h-7 w-auto min-w-[11rem] bg-background text-xs">
                        <SelectValue placeholder="เลือกหมวดสินทรัพย์">
                          {(value: string) => {
                            if (value === NONE) return "เลือกหมวดสินทรัพย์";
                            return assetCategories.find((c) => c.id === value)?.name;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>เลือกหมวดสินทรัพย์</SelectItem>
                        {assetCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Controller
                  control={control}
                  name={`${path}.asset_useful_life_years`}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="อายุการใช้งาน (ปี)"
                      className="h-7 w-36 bg-background text-xs"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? null : e.target.value)}
                    />
                  )}
                />
              </>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}
