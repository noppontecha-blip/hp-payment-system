"use client";

import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormSetValue,
  type UseFormGetValues,
} from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
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

  const {
    fields: breakdownFields,
    append: appendBreakdown,
    remove: removeBreakdown,
  } = useFieldArray({ control, name: `${path}.vehicleBreakdown` });
  const isMultiVehicle = breakdownFields.length > 0;

  function recomputeNet() {
    const line = getValues(`lines.${index}`);
    const wht = line.requires_wht ? line.wht_amount ?? 0 : 0;
    const net = round2((line.amount_before_vat || 0) + (line.vat_amount || 0) - wht);
    setValue(`lines.${index}.net_paid_amount`, net);
  }

  function applyAmountChange(newAmount: number) {
    setValue(`${path}.amount_before_vat`, newAmount);
    if (vatEnabled) {
      setValue(`${path}.vat_amount`, round2(newAmount * 0.07));
    }
    recomputeNet();
  }

  function enableMultiVehicle() {
    const currentVehicle = getValues(`${path}.vehicle_id`);
    const currentAmount = getValues(`${path}.amount_before_vat`) || 0;
    appendBreakdown({ vehicle_id: currentVehicle ?? null, amount: currentAmount });
    setValue(`${path}.vehicle_id`, null);
  }

  function disableMultiVehicle() {
    const count = getValues(`${path}.vehicleBreakdown`)?.length ?? 0;
    for (let i = count - 1; i >= 0; i--) removeBreakdown(i);
  }

  function handleAddBreakdownRow() {
    appendBreakdown({ vehicle_id: null, amount: 0 });
  }

  function handleRemoveBreakdownRow(i: number) {
    const row = getValues(`${path}.vehicleBreakdown.${i}`);
    removeBreakdown(i);
    const current = getValues(`${path}.amount_before_vat`) || 0;
    applyAmountChange(round2(current - (row?.amount || 0)));
  }

  function handleBreakdownAmountChange(i: number, value: number) {
    const previous = getValues(`${path}.vehicleBreakdown.${i}.amount`) || 0;
    setValue(`${path}.vehicleBreakdown.${i}.amount`, value);
    const current = getValues(`${path}.amount_before_vat`) || 0;
    applyAmountChange(round2(current - previous + value));
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

          {!isMultiVehicle && (
            <Controller
              control={control}
              name={`${path}.vehicle_id`}
              render={({ field }) => (
                <FormField label="รหัสรถ/เครน">
                  <Select
                    value={field.value ?? NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                  >
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
                </FormField>
              )}
            />
          )}

          {!isMultiVehicle && (
            <Controller
              control={control}
              name={`${path}.amount_before_vat`}
              render={({ field }) => (
                <FormField label="ก่อน VAT">
                  <CurrencyInput value={field.value} onChange={(v) => applyAmountChange(v)} />
                </FormField>
              )}
            />
          )}

          <div className="sm:col-span-2">
            {!isMultiVehicle ? (
              <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={enableMultiVehicle}>
                <Plus className="size-3.5" />
                แยกยอดตามรถหลายคัน
              </Button>
            ) : (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label>รถ/เครนหลายคัน — ยอดต่อคัน</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={disableMultiVehicle}>
                    ยกเลิกแยกยอด
                  </Button>
                </div>
                <div className="space-y-2">
                  {breakdownFields.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`${path}.vehicleBreakdown.${i}.vehicle_id`}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? NONE}
                            onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                          >
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
                      <Controller
                        control={control}
                        name={`${path}.vehicleBreakdown.${i}.amount`}
                        render={({ field }) => (
                          <CurrencyInput
                            value={field.value ?? 0}
                            onChange={(v) => handleBreakdownAmountChange(i, v)}
                            className="w-36 shrink-0"
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveBreakdownRow(i)}
                        aria-label="ลบรถคันนี้"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddBreakdownRow}>
                  <Plus className="size-3.5" />
                  เพิ่มรถ
                </Button>
                <Controller
                  control={control}
                  name={`${path}.amount_before_vat`}
                  render={({ field }) => (
                    <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium text-ink">
                      <span>รวมก่อน VAT</span>
                      <span className="font-mono">{formatCurrency(field.value)}</span>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
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
