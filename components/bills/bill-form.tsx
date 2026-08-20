"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useFieldArray, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Printer,
  RefreshCw,
  Ban,
  ShieldCheck,
  ShieldQuestion,
  ChevronDown,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { CurrencyInput } from "@/components/shared/currency-input";
import { FormField } from "@/components/shared/form-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { RibbonBadge } from "@/components/shared/ribbon-badge";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { VendorCombobox } from "./vendor-combobox";
import { LineItemRow } from "./line-item-row";
import { SummaryBar } from "./summary-bar";
import { PaymentHistory } from "./payment-history";
import {
  hpBillDraftSchema,
  hpBillFinalSchema,
  type HpBillFormValues,
} from "@/lib/validations/hp-line";
import { peekHpNumber, saveHpBill, cancelHpBill, checkDuplicateInvoiceNumber } from "@/lib/actions/bills";
import { deriveDocumentStatus, documentStatusTone } from "@/lib/utils/document-status";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, sanitizeFileName } from "@/lib/utils/format";
import { formatThaiDate, toISODateString } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];
type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];
type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type BillPayment = Database["public"]["Tables"]["bill_payments"]["Row"];

const NONE = "__none__";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyLine(
  expenseGroup: HpBillFormValues["lines"][number]["expense_group"] = "ต้นทุนรายคัน",
): HpBillFormValues["lines"][number] {
  return {
    description: "",
    account_code_id: null,
    vehicle_id: null,
    related_vehicles_text: "",
    expense_group: expenseGroup,
    cost_subtype: null,
    asset_category_id: null,
    asset_useful_life_years: null,
    quantity: 1,
    unit_price: 0,
    amount_before_vat: 0,
    vat_amount: 0,
    requires_wht: false,
    wht_category_id: null,
    wht_rate_pct: null,
    wht_payee_name: "",
    wht_amount: null,
    wht_pnd_form: null,
    net_paid_amount: 0,
    document_number: "",
    document_invoice_date: null,
    vat_non_claimable: false,
  };
}

export function BillForm({
  mode,
  hpNumber,
  vendors,
  vehicles,
  accounts,
  whtCategories,
  assetCategories,
  initialValues,
  initialExpenseGroup,
  payments,
  initialIsDraft = false,
  initialIsCancelled = false,
}: {
  mode: "create" | "edit";
  hpNumber: string;
  vendors: Vendor[];
  vehicles: Vehicle[];
  accounts: Account[];
  whtCategories: WhtCategory[];
  assetCategories: AssetCategory[];
  initialValues?: HpBillFormValues;
  initialExpenseGroup?: HpBillFormValues["lines"][number]["expense_group"];
  payments?: BillPayment[];
  initialIsDraft?: boolean;
  initialIsCancelled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentHpNumber, setCurrentHpNumber] = useState(hpNumber);
  const [scanningSlip, setScanningSlip] = useState(false);
  const isCancelled = initialIsCancelled;

  // VAT and หัก ณ ที่จ่าย are one decision for the whole bill (not per line) — reconstructed
  // from the first saved line when editing, since every row is written with the same settings.
  const firstLine = initialValues?.lines[0];
  const [vatEnabled, setVatEnabled] = useState(() => !firstLine || (firstLine.vat_amount ?? 0) > 0);
  const [requiresWht, setRequiresWht] = useState(() => firstLine?.requires_wht ?? false);
  const [whtCategoryId, setWhtCategoryId] = useState<string | null>(firstLine?.wht_category_id ?? null);
  const [whtRatePct, setWhtRatePct] = useState<number | null>(firstLine?.wht_rate_pct ?? null);
  // ยอดหัก ณ ที่จ่ายคำนวณอัตโนมัติจากอัตรา×ยอดรวมเป็นค่าเริ่มต้น แต่แก้ไขเองได้ — บางบิลมีทั้งค่าบริการ
  // (ต้องหัก) และค่าสินค้า (ไม่ต้องหัก) ปนกัน ยอดที่คำนวณจากยอดรวมทั้งหมดจึงอาจไม่ตรงกับยอดที่ต้องหักจริง
  const [whtAmount, setWhtAmount] = useState<number>(() =>
    round2((initialValues?.lines ?? []).reduce((sum, l) => sum + (l.wht_amount ?? 0), 0)),
  );

  // เลขที่/วันที่ใบกำกับภาษี — ปกติ 1 HP มีใบกำกับภาษีใบเดียว (กรอกครั้งเดียว ใช้กับทุกรายการย่อย)
  // แต่บางบิล (เช่น ค่าประกันภัยจ่ายทีเดียวแต่มีใบกำกับแยกตามรถแต่ละคัน) มีหลายใบตามรายการ — สลับโหมดได้
  // ด้วยติ๊กนี้. ตรวจจากข้อมูลเดิมตอนเปิดแก้ไข: ถ้าทุกรายการมีเลขที่/วันที่เดียวกันหมด ถือว่าเป็นโหมดเดียว
  // (ค่าเริ่มต้น) ถ้าต่างกันแม้แต่รายการเดียว ถือว่าเคยแยกตามรายการไว้แล้ว
  const [invoicePerLine, setInvoicePerLine] = useState(() => {
    const lines = initialValues?.lines ?? [];
    if (lines.length < 2) return false;
    const first = lines[0];
    return lines.some(
      (l) => l.document_number !== first.document_number || l.document_invoice_date !== first.document_invoice_date,
    );
  });
  const [singleDocumentNumber, setSingleDocumentNumber] = useState(() => firstLine?.document_number ?? "");
  const [singleDocumentInvoiceDate, setSingleDocumentInvoiceDate] = useState<string | null>(
    () => firstLine?.document_invoice_date ?? null,
  );
  const [singleInvoiceDuplicateWarning, setSingleInvoiceDuplicateWarning] = useState<string | null>(null);

  const defaultValues: HpBillFormValues = initialValues ?? {
    hp_number: hpNumber,
    transaction_date: toISODateString(new Date()),
    work_type: "ปกติ",
    asset_construction_detail: "",
    vendor_id: null,
    vendor_name_snapshot: "",
    document_type: "ยังไม่มีเอกสาร",
    document_received_date: null,
    expected_document_type: null,
    adhoc_vendor_tax_id: "",
    payment_method: null,
    payment_date: null,
    slip_path: null,
    slip_ocr_amount: null,
    slip_ocr_date: null,
    slip_ocr_bank: null,
    slip_ocr_reference: null,
    slip_looks_valid: null,
    advance_payer_name: "",
    spk_repaid_date: null,
    notes: "",
    lines: [emptyLine(initialExpenseGroup)],
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
  const adhocVendorTaxId = watch("adhoc_vendor_tax_id");
  const paymentMethod = watch("payment_method");
  const slipPath = watch("slip_path");
  const slipOcrAmount = watch("slip_ocr_amount");
  const slipOcrDate = watch("slip_ocr_date");
  const slipOcrBank = watch("slip_ocr_bank");
  const slipOcrReference = watch("slip_ocr_reference");
  const slipLooksValid = watch("slip_looks_valid");
  const selectedVendor = vendors.find((v) => v.id === vendorId);
  const vendorCode = selectedVendor?.code ?? "-";
  const vendorAddress = selectedVendor?.registered_address || selectedVendor?.mailing_address || "-";
  // รายจ่ายในเอกสารนี้ใช้ได้เฉพาะบัญชีหมวดค่าใช้จ่าย (5000-00 เป็นต้นไป) — โค้ดก่อนหน้านั้นเป็น
  // สินทรัพย์/หนี้สิน/ทุน/รายได้ ไม่เกี่ยวกับการบันทึกรายจ่ายรายบรรทัด
  const expenseAccounts = accounts.filter((a) => a.code >= "5000-00");

  const totalBeforeVat = round2(linesWatch.reduce((sum, l) => sum + (l.amount_before_vat || 0), 0));
  const vatAmount = vatEnabled ? round2(totalBeforeVat * 0.07) : 0;
  const effectiveWhtAmount = requiresWht ? whtAmount : 0;
  const netTotal = round2(totalBeforeVat + vatAmount - effectiveWhtAmount);
  function recomputeWhtAmount() {
    setWhtAmount(whtRatePct != null ? round2(totalBeforeVat * (whtRatePct / 100)) : 0);
  }

  const paidFromPayments = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);
  const paidTotal = paidFromPayments > 0 ? paidFromPayments : watch("payment_date") ? netTotal : 0;
  const currentStatus =
    mode === "create"
      ? "ร่างเอกสาร"
      : deriveDocumentStatus({
          isDraft: initialIsDraft,
          isCancelled,
          documentType,
          netTotal,
          paidTotal,
        });

  // hp_payment_lines still stores vat_amount/wht_amount per row (no header table) — distribute
  // the one bill-level VAT/WHT decision across each row proportionally to its own amount so the
  // per-row figures sum exactly to the totals shown above.
  function buildLinesForSubmit(): HpBillFormValues["lines"] {
    // สแนปช็อตหมวดแบบฟอร์มภาษีตอนบันทึก (ภ.ง.ด.53 = นิติบุคคล, ภ.ง.ด.3 = บุคคลธรรมดา) — ไม่ derive
    // สดจาก vendors.vendor_type ตอนทำรายงาน เพราะถ้าแก้ประเภทผู้จำหน่ายภายหลัง เอกสารที่ยื่นแล้ว
    // ไม่ควรถูกจัดหมวดใหม่ย้อนหลัง (หลักการเดียวกับ vendor_name_snapshot)
    const pndForm = !requiresWht
      ? null
      : selectedVendor?.vendor_type === "นิติบุคคล"
        ? "ภ.ง.ด.53"
        : selectedVendor?.vendor_type === "บุคคลธรรมดา"
          ? "ภ.ง.ด.3"
          : null;
    const lines = getValues("lines");
    // ยอดหัก ณ ที่จ่ายอาจถูกแก้เองจนไม่ตรงกับอัตรา×ยอดรวมพอดี (เช่น บิลมีทั้งค่าบริการที่ต้องหักและ
    // ค่าสินค้าที่ไม่ต้องหักปนกัน) — กระจายยอดที่ (อาจถูกแก้ไขแล้ว) นี้ตามสัดส่วนของแต่ละรายการแทนที่จะ
    // คำนวณจากอัตราตรง ๆ ต่อบรรทัด แล้วปัดเศษไปรวมไว้ที่บรรทัดสุดท้ายกันผลรวมคลาดเคลื่อน
    let whtAllocated = 0;
    return lines.map((line, i) => {
      const amount = line.amount_before_vat || 0;
      const vat = vatEnabled ? round2(amount * 0.07) : 0;
      let wht = 0;
      if (requiresWht) {
        if (i === lines.length - 1) {
          wht = round2(whtAmount - whtAllocated);
        } else {
          wht = totalBeforeVat > 0 ? round2(whtAmount * (amount / totalBeforeVat)) : 0;
          whtAllocated = round2(whtAllocated + wht);
        }
      }
      return {
        ...line,
        vat_amount: vat,
        requires_wht: requiresWht,
        wht_category_id: requiresWht ? whtCategoryId : null,
        wht_rate_pct: requiresWht ? whtRatePct : null,
        wht_amount: requiresWht ? wht : null,
        wht_pnd_form: pndForm,
        net_paid_amount: round2(amount + vat - wht),
        // ใบกำกับภาษีใบเดียวสำหรับทั้งเอกสาร — กรอกครั้งเดียวแล้วใช้ค่าเดียวกันกับทุกรายการย่อย แทนที่
        // ค่าที่กรอกไว้ต่อรายการ (ถ้ามี) เพื่อให้รายงานภาษีซื้อรวมยอดถูกต้องครบทุกบรรทัด
        ...(documentType !== "ยังไม่มีเอกสาร" && !invoicePerLine
          ? {
              document_number: singleDocumentNumber || null,
              document_invoice_date: documentType === "ใบกำกับภาษี" ? singleDocumentInvoiceDate : null,
            }
          : {}),
      };
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        const next = await peekHpNumber(getValues("transaction_date"));
        setCurrentHpNumber(next);
        setValue("hp_number", next);
        toast.success(`เลข HP ถัดไป: ${next}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "ดึงเลข HP ไม่สำเร็จ");
      }
    });
  }

  const transactionDate = watch("transaction_date");
  const skipNextHpPeek = useRef(true);
  // เลข HP อิงจากเดือนของวันที่ทำรายการ — พอเปลี่ยนวันที่ (เช่น ข้ามเดือน) เลขที่แสดงต้องขยับตาม
  // ทันทีโดยไม่ต้องกดปุ่ม "ดูเลข HP ถัดไป" เอง ยังคงเป็นแค่ peek (ไม่ commit เลขจริงจนกว่าจะบันทึก)
  useEffect(() => {
    if (mode !== "create") return;
    if (skipNextHpPeek.current) {
      skipNextHpPeek.current = false;
      return;
    }
    peekHpNumber(transactionDate)
      .then((next) => {
        setCurrentHpNumber(next);
        setValue("hp_number", next);
      })
      .catch(() => {
        // เงียบไว้ — เลขเดิมยังแสดงอยู่ กดปุ่ม "ดูเลข HP ถัดไป" เพื่อลองใหม่ได้
      });
  }, [transactionDate, mode, setValue]);

  async function handleSlipUpload(file: File) {
    setScanningSlip(true);
    try {
      const supabase = createClient();
      const path = `${currentHpNumber}/header-${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("payment-slips").upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      setValue("slip_path", path);
      toast.success("อัปโหลดสลิปแล้ว กำลังอ่านข้อมูล...");

      const res = await fetch("/api/bill-payments/scan-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message ?? "อ่านข้อมูลสลิปไม่สำเร็จ");
        return;
      }
      setValue("slip_ocr_amount", data.amount ?? null);
      setValue("slip_ocr_date", data.date ?? null);
      setValue("slip_ocr_bank", data.bank ?? null);
      setValue("slip_ocr_reference", data.reference ?? null);
      setValue("slip_looks_valid", data.looks_like_transfer_slip ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setScanningSlip(false);
    }
  }

  function applySlipToPaymentDate() {
    if (slipOcrDate) {
      setValue("payment_date", slipOcrDate);
      toast.success("ใช้ข้อมูลจากสลิปแล้ว");
    }
  }

  async function handleViewSlip() {
    if (!slipPath) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("payment-slips").createSignedUrl(slipPath, 3600);
    if (error || !data) {
      toast.error("เปิดไฟล์สลิปไม่สำเร็จ");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  function onSave(saveMode: "draft" | "final") {
    // ครอบทั้งฟังก์ชันด้วย try/catch — ก่อนหน้านี้ถ้า buildLinesForSubmit() หรือ safeParse ตัวมันเอง
    // throw อะไรที่ไม่คาดคิดขึ้นมา (bug ที่ยังไม่รู้จัก) จะไม่มี toast ขึ้นเลย ดูเหมือนกดปุ่มแล้ว
    // "ไม่มีอะไรเกิดขึ้น" ทั้งที่จริง ๆ มี error เกิดขึ้นแล้วแค่ไม่มีใครจับไว้โชว์ให้เห็น
    try {
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
          const result = await saveHpBill(values, saveMode, mode === "create");
          setCurrentHpNumber(result.hp_number);
          toast.success(saveMode === "final" ? "บันทึกและปิดงานแล้ว" : "บันทึกร่างแล้ว");
          if (saveMode === "final") {
            router.push("/bills");
          } else if (mode === "create") {
            router.replace(`/bills/${result.hp_number}/edit`);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
        }
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? `เกิดข้อผิดพลาดที่ไม่คาดคิด: ${err.message}` : "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      );
    }
  }

  async function handleIssueWhtCertificate() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/bills/${currentHpNumber}/wht-certificate`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toast.error(data?.message ?? "ออกใบ 50 ทวิ ไม่สำเร็จ");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `50twi-${currentHpNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error("ออกใบ 50 ทวิ ไม่สำเร็จ");
      }
    });
  }

  async function handlePrint(endpoint: string, filenamePrefix: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/bills/${currentHpNumber}/${endpoint}`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          toast.error(data?.message ?? "พิมพ์เอกสารไม่สำเร็จ");
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filenamePrefix}-${currentHpNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error("พิมพ์เอกสารไม่สำเร็จ");
      }
    });
  }

  async function handleCancelBill() {
    if (!confirm(`ยืนยันยกเลิกเอกสาร ${currentHpNumber}? เอกสารจะยังอยู่ในระบบแต่จะถูกประทับตรา "ยกเลิก"`))
      return;
    startTransition(async () => {
      try {
        await cancelHpBill(currentHpNumber);
        toast.success("ยกเลิกเอกสารแล้ว");
        router.push("/bills");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "ยกเลิกไม่สำเร็จ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(() => {})} className="relative mx-auto max-w-3xl space-y-5 p-5">
      <RibbonBadge label={currentStatus} tone={documentStatusTone(currentStatus)} />
      <div className="space-y-6">
        {/* Header card */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-info" />
              <p className="text-sm font-medium text-ink">ข้อมูลทั่วไป</p>
              <StatusBadge label={currentStatus} tone={documentStatusTone(currentStatus)} />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>เลข HP: </span>
              <span className="font-mono font-medium text-ink">{currentHpNumber}</span>
              {mode === "create" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRegenerate}
                  disabled={isPending}
                  aria-label="ดูเลข HP ถัดไป"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {isCancelled && (
            <div className="rounded-lg bg-danger-bg px-3 py-2 text-sm font-medium text-danger">
              เอกสารนี้ถูกยกเลิกแล้ว ไม่สามารถแก้ไขหรือบันทึกซ้ำได้
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="ผู้จำหน่าย" required className="sm:col-span-2">
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

            <FormField label="รหัสผู้จำหน่าย">
              <Input value={vendorCode} disabled readOnly />
            </FormField>

            <FormField label="ที่อยู่ผู้จำหน่าย" className="sm:col-span-2">
              <Input value={vendorAddress} disabled readOnly />
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

            <FormField label="สถานะเอกสารภาษีซื้อ">
              <Select
                value={documentType === "ยังไม่มีเอกสาร" ? "pending" : "received"}
                onValueChange={(v) => {
                  if (v === "pending") {
                    setValue("document_type", "ยังไม่มีเอกสาร");
                  } else {
                    // ยังไม่มีการระบุประเภทที่คาดไว้ตอนเป็น pending — ใช้ใบกำกับภาษีเป็นค่าเริ่มต้น
                    setValue("document_type", getValues("expected_document_type") ?? "ใบกำกับภาษี");
                    // เพิ่งเปลี่ยนจาก "ยังไม่ได้รับ" เป็น "ได้รับแล้ว" — ตั้งวันที่ได้รับเป็นวันนี้
                    // ให้อัตโนมัติ (แก้ไขเองได้ถ้าจริง ๆ ได้รับมาก่อนหน้านี้แล้วเพิ่งมาบันทึก)
                    if (!getValues("document_received_date")) {
                      setValue("document_received_date", toISODateString(new Date()));
                    }
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => (value === "pending" ? "ยังไม่ได้รับ" : "ได้รับแล้ว")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">ยังไม่ได้รับ</SelectItem>
                  <SelectItem value="received">ได้รับแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {documentType === "ยังไม่มีเอกสาร" && (
              <Controller
                control={control}
                name="expected_document_type"
                render={({ field }) => (
                  <FormField label="ประเภทเอกสารที่คาดว่าจะได้รับ">
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value: string) => (value === NONE ? "ยังไม่ทราบ" : value)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ยังไม่ทราบ</SelectItem>
                        <SelectItem value="ใบกำกับภาษี">ใบกำกับภาษี</SelectItem>
                        <SelectItem value="บิลเงินสด">บิลเงินสด</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
            )}

            {documentType !== "ยังไม่มีเอกสาร" && (
              <Controller
                control={control}
                name="document_type"
                render={({ field }) => (
                  <FormField label="ประเภทเอกสาร">
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ใบกำกับภาษี">ใบกำกับภาษี</SelectItem>
                        <SelectItem value="บิลเงินสด">บิลเงินสด</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
            )}
            {documentType !== "ยังไม่มีเอกสาร" && (
              <div className="flex items-center gap-1.5 sm:col-span-2">
                <Checkbox
                  id="invoice-per-line"
                  checked={invoicePerLine}
                  onCheckedChange={(checked) => setInvoicePerLine(checked === true)}
                />
                <Label htmlFor="invoice-per-line" className="cursor-pointer font-normal">
                  ใบกำกับภาษีแยกตามรายการ (1 HP มีหลายใบ เช่น ประกันภัยแยกตามรถแต่ละคัน)
                </Label>
              </div>
            )}
            {documentType !== "ยังไม่มีเอกสาร" && !invoicePerLine && (
              <div>
                <FormField label={documentType === "ใบกำกับภาษี" ? "เลขที่ใบกำกับภาษี" : "เลขที่เอกสาร"}>
                  <Input
                    value={singleDocumentNumber}
                    onChange={(e) => setSingleDocumentNumber(e.target.value)}
                    onBlur={async (e) => {
                      const value = e.target.value;
                      if (!value || documentType !== "ใบกำกับภาษี") {
                        setSingleInvoiceDuplicateWarning(null);
                        return;
                      }
                      try {
                        const result = await checkDuplicateInvoiceNumber({
                          documentNumber: value,
                          vendorId: vendorId ?? null,
                          adhocVendorTaxId: adhocVendorTaxId ?? null,
                          excludeHpNumber: currentHpNumber,
                        });
                        setSingleInvoiceDuplicateWarning(
                          result.duplicate
                            ? `เลขที่นี้ซ้ำกับเอกสาร ${result.hpNumber} ที่บันทึกไว้แล้ว (ผู้จำหน่ายเดียวกัน)`
                            : null,
                        );
                      } catch {
                        setSingleInvoiceDuplicateWarning(null);
                      }
                    }}
                    placeholder="เลขที่เอกสาร"
                  />
                </FormField>
                {singleInvoiceDuplicateWarning && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
                    <AlertTriangle className="size-3 shrink-0" />
                    {singleInvoiceDuplicateWarning}
                  </p>
                )}
              </div>
            )}
            {documentType === "ใบกำกับภาษี" && !invoicePerLine && (
              <FormField label="วันที่ในใบกำกับภาษี">
                <ThaiDatePicker value={singleDocumentInvoiceDate} onChange={setSingleDocumentInvoiceDate} />
              </FormField>
            )}
            {documentType === "ใบกำกับภาษี" && (
              <Controller
                control={control}
                name="document_received_date"
                render={({ field }) => (
                  <FormField label="วันที่ได้รับใบกำกับภาษีจริง">
                    <ThaiDatePicker value={field.value} onChange={field.onChange} />
                    <p className="text-[11px] text-muted-2">
                      ใช้ตัดสินว่ายื่นภาษีซื้อเดือนไหน ถ้าได้รับช้ากว่าวันที่ในใบกำกับ
                    </p>
                  </FormField>
                )}
              />
            )}
            {selectedVendor?.code === "V9999" && vatEnabled && (
              <FormField label="เลขผู้เสียภาษีผู้ขาย (ระบุเอง)">
                <Input
                  {...register("adhoc_vendor_tax_id")}
                  placeholder="กรณีผู้ขายขาจรมี VAT แต่ไม่ได้บันทึกเป็นผู้จำหน่ายประจำ"
                />
                <p className="mt-1 text-[11px] text-muted-2">
                  ชื่อผู้ขายใช้ช่อง &quot;ผู้จำหน่าย&quot; ด้านบน — พิมพ์ชื่อจริงของผู้ขายแทนคำว่า
                  &quot;ทั่วไป&quot; ทั้งเลขผู้เสียภาษีและชื่อนี้จะไปแสดงในรายงานภาษีซื้อและเอกสารที่พิมพ์
                </p>
              </FormField>
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
            <div className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-info" />
              <p className="text-sm font-medium text-ink">รายการย่อย</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append(emptyLine(linesWatch[linesWatch.length - 1]?.expense_group))}
            >
              <Plus className="size-4" />
              เพิ่มรายการ
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="w-9 p-2">ลำดับ</th>
                  <th className="p-2">รหัสบัญชี</th>
                  <th className="p-2">รายละเอียด</th>
                  <th className="p-2">รหัสรถ</th>
                  <th className="p-2">จำนวนหน่วย</th>
                  <th className="p-2">ราคาต่อหน่วย</th>
                  <th className="p-2">รวม</th>
                  <th className="w-9 p-2" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <LineItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    setValue={setValue}
                    accounts={expenseAccounts}
                    vehicles={vehicles}
                    assetCategories={assetCategories}
                    documentType={invoicePerLine ? documentType : "ยังไม่มีเอกสาร"}
                    vatEnabled={vatEnabled}
                    hpNumber={currentHpNumber}
                    vendorId={vendorId ?? null}
                    adhocVendorTaxId={adhocVendorTaxId ?? null}
                    onRemove={() => remove(index)}
                    removable={fields.length > 1}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border font-semibold text-ink">
                  <td className="p-2" colSpan={6}>
                    รวมทั้งสิ้น
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
          <div className="inline-flex w-fit items-center gap-3 rounded-lg border border-border px-3 py-2">
            <Label>ต้องหัก ณ ที่จ่าย</Label>
            <Switch checked={requiresWht} onCheckedChange={setRequiresWht} />
          </div>
          {requiresWht && (
            <div className="grid animate-in fade-in slide-in-from-top-1 grid-cols-1 gap-3 rounded-lg bg-warn-bg p-4 sm:grid-cols-2">
              <FormField label="หมวดหัก ณ ที่จ่าย" required>
                <Select
                  value={whtCategoryId ?? NONE}
                  onValueChange={(v) => {
                    if (v === NONE) {
                      setWhtCategoryId(null);
                      setWhtRatePct(null);
                      return;
                    }
                    setWhtCategoryId(v);
                    const category = whtCategories.find((c) => c.id === v);
                    const nextRate = category?.default_rate_pct ?? null;
                    setWhtRatePct(nextRate);
                    // ใช้ nextRate ตรง ๆ แทนอ่านจาก whtRatePct state เพราะ setWhtRatePct ข้างบนยัง
                    // ไม่ผ่าน re-render ตอนนี้ — ค่าเก่าจะยังค้างอยู่ถ้าอ่านจาก state ตรงนี้
                    setWhtAmount(nextRate != null ? round2(totalBeforeVat * (nextRate / 100)) : 0);
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
              <FormField label="ยอดหัก ณ ที่จ่าย">
                <div className="flex items-center gap-1.5">
                  <CurrencyInput value={whtAmount} onChange={setWhtAmount} className="bg-background" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={recomputeWhtAmount}
                    disabled={whtRatePct == null}
                    aria-label="คำนวณอัตโนมัติจากอัตราหัก ณ ที่จ่าย"
                    title="คำนวณอัตโนมัติ"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
                <p className="mt-1 text-[11px] text-muted-2">
                  คำนวณอัตโนมัติจากอัตรา × ยอดรวม แต่แก้ไขเองได้ เช่น กรณีในบิลมีทั้งค่าบริการที่ต้องหักและ
                  ค่าสินค้าที่ไม่ต้องหักปนกัน
                </p>
              </FormField>
            </div>
          )}

          <SummaryBar
            beforeVat={totalBeforeVat}
            vat={vatAmount}
            wht={effectiveWhtAmount}
            net={netTotal}
            bordered={false}
          />
        </div>

        {/* Payment section — usually filled in later, after the bill itself is entered */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-info" />
            <p className="text-sm font-medium text-ink">การจ่ายเงิน</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="payment_method"
              render={({ field }) => (
                <FormField label="วิธีการจ่าย">
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกวิธีการจ่าย">
                        {(value: string) =>
                          value === NONE
                            ? "ยังไม่ระบุ"
                            : value === "บัญชีธนาคารบริษัท"
                              ? "จ่ายผ่านบัญชีธนาคารบริษัทฯ"
                              : value
                        }
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

          <FormField label="สลิปโอนเงิน (ถ้ามี)">
            <FileDropzone
              accept="image/*"
              disabled={scanningSlip}
              onFile={handleSlipUpload}
              attachedHint={slipPath && !scanningSlip ? "แนบไฟล์แล้ว" : undefined}
            />
            {slipPath && !scanningSlip && (
              <Button type="button" variant="ghost" size="sm" className="mt-1" onClick={handleViewSlip}>
                <Download className="size-4" />
                ดูสลิปที่แนบไว้
              </Button>
            )}
          </FormField>

          {slipPath &&
            (slipOcrAmount != null || slipOcrDate || slipOcrBank || slipOcrReference || slipLooksValid != null) && (
              <div
                className={cn(
                  "space-y-2 rounded-lg border p-3 text-sm",
                  slipLooksValid ? "border-success/30 bg-success-bg" : "border-warn/30 bg-warn-bg",
                )}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {slipLooksValid ? (
                    <>
                      <ShieldCheck className="size-4 text-success" />
                      <span className="text-success">ดูเหมือน slip จริง</span>
                    </>
                  ) : (
                    <>
                      <ShieldQuestion className="size-4 text-warn" />
                      <span className="text-warn">ตรวจสอบไม่ผ่าน กรุณาตรวจสอบเอง</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  จำนวนเงิน: {slipOcrAmount != null ? formatCurrency(slipOcrAmount) : "-"} · วันที่:{" "}
                  {slipOcrDate ? formatThaiDate(slipOcrDate) : "-"} · ธนาคาร: {slipOcrBank ?? "-"} ·
                  เลขอ้างอิง: {slipOcrReference ?? "-"}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={applySlipToPaymentDate}>
                  ใช้ข้อมูลนี้
                </Button>
              </div>
            )}

          <FormField label="หมายเหตุ">
            <Textarea {...register("notes")} rows={2} />
          </FormField>

          {mode === "edit" && (
            <PaymentHistory hpNumber={currentHpNumber} payments={payments ?? []} netTotal={netTotal} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {mode === "edit" && !isCancelled ? (
          <Button type="button" variant="destructive" onClick={handleCancelBill} disabled={isPending}>
            <Ban className="size-4" />
            ยกเลิกเอกสาร
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {mode === "edit" && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="outline" disabled={isPending} />}>
                <Printer className="size-4" />
                พิมพ์
                <ChevronDown className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handlePrint("document", "bill")}>
                  พิมพ์บันทึกรายจ่าย
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint("payment-voucher", "voucher")}>
                  พิมพ์ใบสำคัญจ่าย
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePrint("receipt-substitute", "receipt-substitute")}>
                  พิมพ์ใบรับรองแทนใบเสร็จรับเงิน
                </DropdownMenuItem>
                {requiresWht && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleIssueWhtCertificate}>
                      ออกหนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onSave("draft")}
            disabled={isPending || isCancelled}
          >
            บันทึกร่าง
          </Button>
          <Button type="button" onClick={() => onSave("final")} disabled={isPending || isCancelled}>
            บันทึกและปิดงาน
          </Button>
        </div>
      </div>
    </form>
  );
}
