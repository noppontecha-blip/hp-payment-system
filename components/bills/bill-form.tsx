"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { FormField } from "@/components/shared/form-field";
import { VendorCombobox } from "./vendor-combobox";
import { LineItemRow } from "./line-item-row";
import { SummarySidebar } from "./summary-sidebar";
import {
  hpBillDraftSchema,
  hpBillFinalSchema,
  type HpBillFormValues,
} from "@/lib/validations/hp-line";
import { generateHpNumber, saveHpBill, deleteHpBill } from "@/lib/actions/bills";
import { formatCurrency } from "@/lib/utils/format";
import { toISODateString } from "@/lib/utils/thai-date";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

const NONE = "__none__";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyLine(): HpBillFormValues["lines"][number] {
  return {
    description: "",
    account_code_id: null,
    vehicle_id: null,
    related_vehicles_text: "",
    amount_before_vat: 0,
    vat_amount: 0,
    requires_wht: false,
    wht_category_id: null,
    wht_rate_pct: null,
    wht_payee_name: "",
    wht_amount: null,
    net_paid_amount: 0,
  };
}

export function BillForm({
  mode,
  hpNumber,
  vendors,
  vehicles,
  accounts,
  whtCategories,
  initialValues,
}: {
  mode: "create" | "edit";
  hpNumber: string;
  vendors: Vendor[];
  vehicles: Vehicle[];
  accounts: Account[];
  whtCategories: WhtCategory[];
  initialValues?: HpBillFormValues;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentHpNumber, setCurrentHpNumber] = useState(hpNumber);

  // VAT and หัก ณ ที่จ่าย are one decision for the whole bill (not per line) — reconstructed
  // from the first saved line when editing, since every row is written with the same settings.
  const firstLine = initialValues?.lines[0];
  const [vatEnabled, setVatEnabled] = useState(() => !firstLine || (firstLine.vat_amount ?? 0) > 0);
  const [requiresWht, setRequiresWht] = useState(() => firstLine?.requires_wht ?? false);
  const [whtCategoryId, setWhtCategoryId] = useState<string | null>(firstLine?.wht_category_id ?? null);
  const [whtRatePct, setWhtRatePct] = useState<number | null>(firstLine?.wht_rate_pct ?? null);
  const [whtPayeeName, setWhtPayeeName] = useState(firstLine?.wht_payee_name ?? "");

  const defaultValues: HpBillFormValues = initialValues ?? {
    hp_number: hpNumber,
    transaction_date: toISODateString(new Date()),
    work_type: "ปกติ",
    asset_construction_detail: "",
    vendor_id: null,
    vendor_name_snapshot: "",
    document_type: "ยังไม่มีเอกสาร",
    document_number: "",
    document_invoice_date: null,
    payment_method: null,
    payment_date: null,
    advance_payer_name: "",
    spk_repaid_date: null,
    notes: "",
    lines: [emptyLine()],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
  } = useForm<HpBillFormValues>({
    resolver: zodResolver(hpBillDraftSchema) as Resolver<HpBillFormValues>,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const workType = watch("work_type");
  const linesWatch = watch("lines");
  const vendorId = watch("vendor_id");
  const vendorName = watch("vendor_name_snapshot");
  const documentType = watch("document_type");
  const paymentMethod = watch("payment_method");

  const totalBeforeVat = round2(linesWatch.reduce((sum, l) => sum + (l.amount_before_vat || 0), 0));
  const vatAmount = vatEnabled ? round2(totalBeforeVat * 0.07) : 0;
  const whtAmount =
    requiresWht && whtRatePct != null ? round2(totalBeforeVat * (whtRatePct / 100)) : 0;
  const netTotal = round2(totalBeforeVat + vatAmount - whtAmount);

  // hp_payment_lines still stores vat_amount/wht_amount per row (no header table) — distribute
  // the one bill-level VAT/WHT decision across each row proportionally to its own amount so the
  // per-row figures sum exactly to the totals shown above.
  function buildLinesForSubmit(): HpBillFormValues["lines"] {
    return getValues("lines").map((line) => {
      const amount = line.amount_before_vat || 0;
      const vat = vatEnabled ? round2(amount * 0.07) : 0;
      const wht = requiresWht && whtRatePct != null ? round2(amount * (whtRatePct / 100)) : 0;
      return {
        ...line,
        vat_amount: vat,
        requires_wht: requiresWht,
        wht_category_id: requiresWht ? whtCategoryId : null,
        wht_rate_pct: requiresWht ? whtRatePct : null,
        wht_payee_name: requiresWht ? whtPayeeName : null,
        wht_amount: requiresWht ? wht : null,
        net_paid_amount: round2(amount + vat - wht),
      };
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        const next = await generateHpNumber(getValues("transaction_date"));
        setCurrentHpNumber(next);
        setValue("hp_number", next);
        toast.success(`สร้างเลข HP ใหม่แล้ว: ${next}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "สร้างเลข HP ไม่สำเร็จ");
      }
    });
  }

  function onSave(saveMode: "draft" | "final") {
    const rawValues = getValues();
    const values = { ...rawValues, lines: buildLinesForSubmit() };
    const schema = saveMode === "final" ? hpBillFinalSchema : hpBillDraftSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูลให้ครบถ้วน");
      return;
    }
    startTransition(async () => {
      try {
        await saveHpBill(values, saveMode);
        toast.success(saveMode === "final" ? "บันทึกและปิดงานแล้ว" : "บันทึกร่างแล้ว");
        if (saveMode === "final") {
          router.push("/bills");
        } else if (mode === "create") {
          router.replace(`/bills/${values.hp_number}/edit`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
      }
    });
  }

  async function handleDeleteBill() {
    if (!confirm(`ยืนยันลบบิล ${currentHpNumber} ทั้งหมด?`)) return;
    startTransition(async () => {
      try {
        await deleteHpBill(currentHpNumber);
        toast.success("ลบบิลแล้ว");
        router.push("/bills");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(() => {})} className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Header card */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-ink">ข้อมูลหัวบิล</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="เลข HP">
              <div className="flex items-center gap-2">
                <Input value={currentHpNumber} readOnly className="bg-muted font-medium" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerate}
                  disabled={isPending}
                  aria-label="สุ่มเลข HP ใหม่"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </FormField>

            <Controller
              control={control}
              name="transaction_date"
              render={({ field }) => (
                <FormField label="วันที่" required>
                  <ThaiDatePicker value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />

            <Controller
              control={control}
              name="work_type"
              render={({ field }) => (
                <FormField label="ประเภทงาน">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ปกติ">ปกติ</SelectItem>
                      <SelectItem value="สร้างสินทรัพย์">สร้างสินทรัพย์</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />

            <FormField label="ผู้จำหน่าย" required>
              <VendorCombobox
                vendors={vendors}
                vendorId={vendorId}
                vendorName={vendorName}
                onChange={({ vendor_id, vendor_name_snapshot }) => {
                  setValue("vendor_id", vendor_id);
                  setValue("vendor_name_snapshot", vendor_name_snapshot);
                }}
              />
            </FormField>

            <Controller
              control={control}
              name="document_type"
              render={({ field }) => (
                <FormField label="เอกสารที่ได้รับ">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ใบกำกับภาษี">ใบกำกับภาษี</SelectItem>
                      <SelectItem value="บิลเงินสด">บิลเงินสด</SelectItem>
                      <SelectItem value="ยังไม่มีเอกสาร">ยังไม่มีเอกสาร</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            {documentType !== "ยังไม่มีเอกสาร" && (
              <FormField label="เลขที่เอกสาร">
                <Input {...register("document_number")} placeholder="ไม่จำเป็นต้องกรอกก็ได้" />
              </FormField>
            )}
            {documentType === "ใบกำกับภาษี" && (
              <Controller
                control={control}
                name="document_invoice_date"
                render={({ field }) => (
                  <FormField label="วันที่ในใบกำกับภาษี">
                    <ThaiDatePicker value={field.value} onChange={field.onChange} />
                  </FormField>
                )}
              />
            )}

            {workType === "สร้างสินทรัพย์" && (
              <FormField label="รายละเอียดงานสร้างสินทรัพย์" className="sm:col-span-2">
                <Textarea {...register("asset_construction_detail")} rows={2} />
              </FormField>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">รายการย่อย</p>
            <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine())}>
              <Plus className="size-4" />
              เพิ่มรายการ
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="p-2">รายละเอียด</th>
                  <th className="p-2">รหัสบัญชี</th>
                  <th className="p-2">รหัสรถ/เครน</th>
                  <th className="p-2">ค่าใช้จ่าย</th>
                  <th className="w-9 p-2" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <LineItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    accounts={accounts}
                    vehicles={vehicles}
                    onRemove={() => remove(index)}
                    removable={fields.length > 1}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-ink">
                  <td className="p-2" colSpan={3}>
                    ค่าใช้จ่ายรวม
                  </td>
                  <td className="p-2 font-mono">{formatCurrency(totalBeforeVat)}</td>
                  <td className="p-2" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* VAT — one decision for the whole bill */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label>VAT 7%</Label>
            <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
          </div>
          {vatEnabled && (
            <div className="flex animate-in fade-in slide-in-from-top-1 items-center justify-between rounded-lg bg-info-bg px-3 py-2 text-sm">
              <span className="text-muted-foreground">ยอด VAT 7% (คำนวณอัตโนมัติ)</span>
              <span className="font-mono font-semibold text-info">{formatCurrency(vatAmount)}</span>
            </div>
          )}

          {/* หัก ณ ที่จ่าย — one decision for the whole bill */}
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <Label>ต้องหัก ณ ที่จ่าย</Label>
            <Switch checked={requiresWht} onCheckedChange={setRequiresWht} />
          </div>
          {requiresWht && (
            <div className="grid animate-in fade-in slide-in-from-top-1 grid-cols-1 gap-3 rounded-lg bg-warn-bg p-4 sm:grid-cols-3">
              <FormField label="หมวดหัก ณ ที่จ่าย" required>
                <Select
                  value={whtCategoryId ?? NONE}
                  onValueChange={(v) => {
                    if (v === NONE) {
                      setWhtCategoryId(null);
                      return;
                    }
                    setWhtCategoryId(v);
                    const category = whtCategories.find((c) => c.id === v);
                    setWhtRatePct(category?.default_rate_pct ?? null);
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
              <FormField label="ชื่อผู้รับเงิน (ใบหัก)">
                <Input
                  value={whtPayeeName ?? ""}
                  onChange={(e) => setWhtPayeeName(e.target.value)}
                  className="bg-background"
                />
              </FormField>
              <FormField label="ยอดหัก ณ ที่จ่าย (คำนวณอัตโนมัติ)">
                <div className="flex h-8 items-center rounded-lg bg-background px-2.5 font-mono text-sm font-semibold text-warn">
                  {formatCurrency(whtAmount)}
                </div>
              </FormField>
            </div>
          )}
        </div>

        {/* Payment section — usually filled in later, after the bill itself is entered */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-ink">การจ่ายเงิน</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <FormField label="วิธีการจ่าย">
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกวิธีการจ่าย">
                        {(value: string) => (value === NONE ? "ยังไม่ระบุ" : value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>ยังไม่ระบุ</SelectItem>
                      <SelectItem value="บัญชีธนาคารบริษัท">จ่ายผ่านบัญชีธนาคารบริษัทฯ</SelectItem>
                      <SelectItem value="สำรองจ่าย">สำรองจ่าย</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="payment_date"
              render={({ field }) => (
                <FormField label="วันที่จ่าย">
                  <ThaiDatePicker value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
            {paymentMethod === "สำรองจ่าย" && (
              <>
                <FormField label="ชื่อผู้สำรองจ่าย">
                  <Input {...register("advance_payer_name")} />
                </FormField>
                <Controller
                  control={control}
                  name="spk_repaid_date"
                  render={({ field }) => (
                    <FormField label="วันที่คืนเงินให้ผู้สำรองจ่าย">
                      <ThaiDatePicker value={field.value} onChange={field.onChange} />
                    </FormField>
                  )}
                />
              </>
            )}
          </div>
          <FormField label="หมายเหตุ">
            <Textarea {...register("notes")} rows={2} />
          </FormField>
        </div>

        <div className="flex items-center justify-between">
          {mode === "edit" ? (
            <Button type="button" variant="destructive" onClick={handleDeleteBill} disabled={isPending}>
              <Trash2 className="size-4" />
              ลบบิลนี้
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onSave("draft")} disabled={isPending}>
              บันทึกร่าง
            </Button>
            <Button type="button" onClick={() => onSave("final")} disabled={isPending}>
              บันทึกและปิดงาน
            </Button>
          </div>
        </div>
      </div>

      <SummarySidebar beforeVat={totalBeforeVat} vat={vatAmount} wht={whtAmount} net={netTotal} />
    </form>
  );
}
