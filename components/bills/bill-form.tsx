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
import { toISODateString } from "@/lib/utils/thai-date";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

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

  const defaultValues: HpBillFormValues = initialValues ?? {
    hp_number: hpNumber,
    transaction_date: toISODateString(new Date()),
    work_type: "ปกติ",
    asset_construction_detail: "",
    vendor_id: null,
    vendor_name_snapshot: "",
    tax_invoice_number: "",
    bill_number: "",
    payment_account: "",
    advance_payer_name: "",
    spk_repaid_date: null,
    accounting_office_doc_status: "ครบถ้วน",
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

  const totals = linesWatch.reduce(
    (acc, l) => {
      acc.beforeVat += l.amount_before_vat || 0;
      acc.vat += l.vat_amount || 0;
      acc.wht += l.requires_wht ? l.wht_amount || 0 : 0;
      acc.net += l.net_paid_amount || 0;
      return acc;
    },
    { beforeVat: 0, vat: 0, wht: 0, net: 0 },
  );

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
    const values = getValues();
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
    <form onSubmit={handleSubmit(() => {})} className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Header card */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-navy-text">ข้อมูลหัวบิล</p>
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

            <FormField label="เลขใบกำกับภาษี">
              <Input {...register("tax_invoice_number")} />
            </FormField>
            <FormField label="เลขที่บิล">
              <Input {...register("bill_number")} />
            </FormField>

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
            <p className="text-sm font-medium text-navy-text">รายการย่อย</p>
            <Button type="button" variant="outline" size="sm" onClick={() => append(emptyLine())}>
              <Plus className="size-4" />
              เพิ่มรายการ
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ถ้ารายการนี้เกี่ยวข้องกับรถ/เครนมากกว่า 1 คัน และต้องการต้นทุนต่อคันที่แม่นยำ
            แนะนำให้แยกบันทึกเป็นหลายแถว (1 แถวต่อ 1 คัน) แทนการกรอกหลายคันในแถวเดียว — ใช้เลข HP ซ้ำกันได้
          </p>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <LineItemRow
                key={field.id}
                index={index}
                control={control}
                setValue={setValue}
                getValues={getValues}
                accounts={accounts}
                vehicles={vehicles}
                whtCategories={whtCategories}
                onRemove={() => remove(index)}
                removable={fields.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Payment section */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-navy-text">การจ่ายเงิน</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="บัญชีที่จ่าย">
              <Input {...register("payment_account")} />
            </FormField>
            <FormField label="ผู้สำรองจ่าย">
              <Input {...register("advance_payer_name")} />
            </FormField>
            <Controller
              control={control}
              name="spk_repaid_date"
              render={({ field }) => (
                <FormField label="วันที่ SPK จ่ายคืน">
                  <ThaiDatePicker value={field.value} onChange={field.onChange} />
                </FormField>
              )}
            />
            <Controller
              control={control}
              name="accounting_office_doc_status"
              render={({ field }) => (
                <FormField label="สถานะเอกสารจากสนง.บัญชี">
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ครบถ้วน">ครบถ้วน</SelectItem>
                      <SelectItem value="รอเอกสารจากสนง.บัญชี">รอเอกสารจากสนง.บัญชี</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
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

      <SummarySidebar
        beforeVat={totals.beforeVat}
        vat={totals.vat}
        wht={totals.wht}
        net={totals.net}
      />
    </form>
  );
}
