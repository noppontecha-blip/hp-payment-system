"use client";

import { useState } from "react";
import {
  Controller,
  useWatch,
  type Control,
  type UseFormSetValue,
  type UseFormGetValues,
} from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/currency-input";
import { FormField } from "@/components/shared/form-field";
import { formatCurrency } from "@/lib/utils/format";
import type { HpBillFormValues } from "@/lib/validations/hp-line";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

const NONE = "__none__";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function LineItemRow({
  index,
  control,
  setValue,
  getValues,
  accounts,
  vehicles,
  whtCategories,
  onRemove,
  removable,
}: {
  index: number;
  control: Control<HpBillFormValues>;
  setValue: UseFormSetValue<HpBillFormValues>;
  getValues: UseFormGetValues<HpBillFormValues>;
  accounts: Account[];
  vehicles: Vehicle[];
  whtCategories: WhtCategory[];
  onRemove: () => void;
  removable: boolean;
}) {
  const path = `lines.${index}` as const;

  // No DB column for "VAT applies" — inferred client-side: existing lines with a saved VAT
  // amount keep the toggle on when reopened, new lines default to on (the common case).
  const [vatEnabled, setVatEnabled] = useState(() => {
    const line = getValues(`lines.${index}`);
    return !line.id || (line.vat_amount ?? 0) > 0;
  });

  const vatAmount = useWatch({ control, name: `${path}.vat_amount` });

  function recomputeNet() {
    const line = getValues(`lines.${index}`);
    const wht = line.requires_wht ? line.wht_amount ?? 0 : 0;
    const net = round2((line.amount_before_vat || 0) + (line.vat_amount || 0) - wht);
    setValue(`lines.${index}.net_paid_amount`, net);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller
            control={control}
            name={`${path}.description`}
            render={({ field, fieldState }) => (
              <FormField label="รายละเอียด" required error={fieldState.error?.message} className="sm:col-span-2">
                <Input {...field} placeholder="เช่น ค่าซ่อมเครนเบอร์ C04" />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name={`${path}.account_code_id`}
            render={({ field }) => (
              <FormField label="รหัสบัญชี">
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                >
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
              </FormField>
            )}
          />

          <Controller
            control={control}
            name={`${path}.vehicle_id`}
            render={({ field }) => (
              <FormField label="รหัสรถ/เครน">
                <Select
                  value={field.value ?? NONE}
                  onValueChange={(v) => {
                    field.onChange(v === NONE ? null : v);
                    if (v !== NONE) setValue(`${path}.related_vehicles_text`, "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกรถ/เครน (คันเดียว)">
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
              </FormField>
            )}
          />

          <Controller
            control={control}
            name={`${path}.related_vehicles_text`}
            render={({ field }) => (
              <FormField label="รถหลายคัน (ถ้ามี, คั่นด้วยลูกน้ำ)">
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="เช่น C18, C22, C26"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (e.target.value) setValue(`${path}.vehicle_id`, null);
                  }}
                />
              </FormField>
            )}
          />

          <Controller
            control={control}
            name={`${path}.amount_before_vat`}
            render={({ field }) => (
              <FormField label="ก่อน VAT">
                <CurrencyInput
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    if (vatEnabled) {
                      setValue(`${path}.vat_amount`, round2(v * 0.07));
                    }
                    recomputeNet();
                  }}
                />
              </FormField>
            )}
          />
        </div>
        {removable && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="ลบรายการ">
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <Label>VAT 7%</Label>
        <Switch
          checked={vatEnabled}
          onCheckedChange={(checked) => {
            setVatEnabled(checked);
            const amount = getValues(`${path}.amount_before_vat`);
            setValue(`${path}.vat_amount`, checked ? round2((amount || 0) * 0.07) : 0);
            recomputeNet();
          }}
        />
      </div>
      {vatEnabled && (
        <div className="flex animate-in fade-in slide-in-from-top-1 items-center justify-between rounded-lg bg-info-bg px-3 py-2 text-sm">
          <span className="text-muted-foreground">ยอด VAT 7% (คำนวณอัตโนมัติ)</span>
          <span className="font-mono font-semibold text-info">{formatCurrency(vatAmount)}</span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <Label>ต้องหัก ณ ที่จ่าย</Label>
        <Controller
          control={control}
          name={`${path}.requires_wht`}
          render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
        />
      </div>

      <Controller
        control={control}
        name={`${path}.requires_wht`}
        render={({ field: requiresWht }) =>
          requiresWht.value ? (
            <div className="grid animate-in fade-in slide-in-from-top-1 grid-cols-1 gap-3 rounded-lg bg-warn-bg p-4 sm:grid-cols-3">
              <Controller
                control={control}
                name={`${path}.wht_category_id`}
                render={({ field, fieldState }) => (
                  <FormField label="หมวดหัก ณ ที่จ่าย" required error={fieldState.error?.message}>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => {
                        field.onChange(v === NONE ? null : v);
                        const category = whtCategories.find((c) => c.id === v);
                        if (category) {
                          setValue(`${path}.wht_rate_pct`, category.default_rate_pct);
                          const amount = getValues(`${path}.amount_before_vat`);
                          if (category.default_rate_pct != null) {
                            setValue(
                              `${path}.wht_amount`,
                              round2((amount || 0) * (category.default_rate_pct / 100)),
                            );
                            recomputeNet();
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="เลือกหมวด">
                          {(value: string) => {
                            if (value === NONE) return "ไม่ระบุ";
                            const category = whtCategories.find((c) => c.id === value);
                            if (!category) return undefined;
                            return `${category.name}${category.default_rate_pct != null ? ` (${category.default_rate_pct}%)` : ""}`;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                        {whtCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.default_rate_pct != null ? ` (${c.default_rate_pct}%)` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <Controller
                control={control}
                name={`${path}.wht_payee_name`}
                render={({ field }) => (
                  <FormField label="ชื่อผู้รับเงิน (ใบหัก)">
                    <Input {...field} value={field.value ?? ""} className="bg-background" />
                  </FormField>
                )}
              />
              <Controller
                control={control}
                name={`${path}.wht_amount`}
                render={({ field, fieldState }) => (
                  <FormField label="ยอดหัก ณ ที่จ่าย" required error={fieldState.error?.message}>
                    <CurrencyInput
                      value={field.value ?? 0}
                      onChange={(v) => {
                        field.onChange(v);
                        recomputeNet();
                      }}
                      className="bg-background"
                    />
                  </FormField>
                )}
              />
            </div>
          ) : (
            <></>
          )
        }
      />

      <Controller
        control={control}
        name={`${path}.net_paid_amount`}
        render={({ field }) => (
          <FormField label="ยอดจ่ายสุทธิ (รายการนี้)" className="max-w-xs">
            <CurrencyInput value={field.value} onChange={field.onChange} />
          </FormField>
        )}
      />
    </div>
  );
}
