"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ShieldCheck, ShieldQuestion, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { FormField } from "@/components/shared/form-field";
import { CurrencyInput } from "@/components/shared/currency-input";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { createBillPayment, deleteBillPayment } from "@/lib/actions/bill-payments";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate, toISODateString } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type BillPayment = Database["public"]["Tables"]["bill_payments"]["Row"];
type SlipScanResult = {
  amount: number | null;
  date: string | null;
  bank: string | null;
  reference: string | null;
  looks_like_transfer_slip: boolean;
};

const NONE = "__none__";

// เพิ่มการจ่ายเงินแบบแบ่งงวดต่อบิล (hp_number) แยกจาก payment_method/payment_date
// ที่หัวบิล (ยังคงไว้เป็นข้อมูลการจ่ายหลัก) — คำนวณยอดคงเหลือจาก netTotal - ผลรวมที่จ่ายแล้ว
export function PaymentHistory({
  hpNumber,
  payments,
  netTotal,
}: {
  hpNumber: string;
  payments: BillPayment[];
  netTotal: number;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [date, setDate] = useState(toISODateString(new Date()));
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [slipPath, setSlipPath] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<SlipScanResult | null>(null);

  const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = round2(netTotal - paidSoFar);

  function round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  function resetForm() {
    setAmount(0);
    setNotes("");
    setSlipPath(null);
    setScanResult(null);
  }

  async function handleSlipUpload(file: File) {
    setScanning(true);
    try {
      const supabase = createClient();
      const path = `${hpNumber}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("payment-slips").upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      setSlipPath(path);
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
      setScanResult(data as SlipScanResult);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setScanning(false);
    }
  }

  function applyScanResult() {
    if (!scanResult) return;
    if (scanResult.amount != null) setAmount(scanResult.amount);
    if (scanResult.date) setDate(scanResult.date);
    toast.success("ใช้ข้อมูลจากสลิปแล้ว");
  }

  async function handleAdd() {
    if (amount <= 0) {
      toast.error("กรุณากรอกจำนวนเงิน");
      return;
    }
    setSubmitting(true);
    try {
      await createBillPayment({
        hp_number: hpNumber,
        payment_date: date,
        amount,
        payment_method: method as "บัญชีธนาคารบริษัท" | "สำรองจ่าย" | null,
        notes: notes || null,
        slip_path: slipPath,
        slip_ocr_amount: scanResult?.amount ?? null,
        slip_ocr_date: scanResult?.date ?? null,
        slip_ocr_bank: scanResult?.bank ?? null,
        slip_ocr_reference: scanResult?.reference ?? null,
        slip_looks_valid: scanResult?.looks_like_transfer_slip ?? null,
      });
      toast.success("บันทึกการจ่ายเงินแล้ว");
      setAdding(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ยืนยันลบรายการจ่ายเงินนี้?")) return;
    try {
      await deleteBillPayment(id, hpNumber);
      toast.success("ลบรายการแล้ว");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">ประวัติการจ่ายเงิน</p>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            เพิ่มการจ่ายเงิน
          </Button>
        )}
      </div>

      {payments.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11.5px] font-bold tracking-wide text-muted-foreground uppercase">
              <th className="p-2">วันที่</th>
              <th className="p-2">วิธีจ่าย</th>
              <th className="p-2">จำนวนเงิน</th>
              <th className="p-2">หมายเหตุ</th>
              <th className="p-2">สลิป</th>
              <th className="w-9 p-2" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-2">{formatThaiDate(p.payment_date)}</td>
                <td className="p-2">{p.payment_method ?? "-"}</td>
                <td className="p-2 font-mono">{formatCurrency(p.amount)}</td>
                <td className="p-2 text-muted-foreground">{p.notes ?? "-"}</td>
                <td className="p-2">
                  {p.slip_path ? (
                    p.slip_looks_valid ? (
                      <ShieldCheck className="size-4 text-success" aria-label="ดูเหมือน slip จริง" />
                    ) : (
                      <ShieldQuestion className="size-4 text-warn" aria-label="ตรวจสอบไม่ผ่าน กรุณาตรวจสอบเอง" />
                    )
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(p.id)}
                    aria-label="ลบรายการจ่ายเงิน"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && (
        <div className="animate-in fade-in slide-in-from-top-1 space-y-3 rounded-lg bg-muted p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <FormField label="วันที่จ่าย">
              <ThaiDatePicker value={date} onChange={setDate} />
            </FormField>
            <FormField label="จำนวนเงิน">
              <CurrencyInput value={amount} onChange={setAmount} />
            </FormField>
            <FormField label="วิธีจ่าย">
              <Select value={method ?? NONE} onValueChange={(v) => setMethod(v === NONE ? null : v)}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="เลือกวิธีจ่าย">
                    {(value: string) => (value === NONE ? "ไม่ระบุ" : value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>ไม่ระบุ</SelectItem>
                  <SelectItem value="บัญชีธนาคารบริษัท">จ่ายผ่านบัญชีธนาคารบริษัทฯ</SelectItem>
                  <SelectItem value="สำรองจ่าย">สำรองจ่าย</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="หมายเหตุ">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-background" />
            </FormField>
          </div>

          <FormField label="สลิปโอนเงิน (ถ้ามี)">
            <FileDropzone
              accept="image/*"
              disabled={scanning}
              onFile={handleSlipUpload}
              attachedHint={slipPath && !scanning ? "แนบไฟล์แล้ว" : undefined}
            />
          </FormField>

          {scanResult && (
            <div
              className={cn(
                "space-y-2 rounded-lg border p-3 text-sm",
                scanResult.looks_like_transfer_slip
                  ? "border-success/30 bg-success-bg"
                  : "border-warn/30 bg-warn-bg",
              )}
            >
              <div className="flex items-center gap-1.5 font-medium">
                {scanResult.looks_like_transfer_slip ? (
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
                จำนวนเงิน: {scanResult.amount != null ? formatCurrency(scanResult.amount) : "-"} · วันที่:{" "}
                {scanResult.date ? formatThaiDate(scanResult.date) : "-"} · ธนาคาร: {scanResult.bank ?? "-"} ·
                เลขอ้างอิง: {scanResult.reference ?? "-"}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={applyScanResult}>
                ใช้ข้อมูลนี้
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd} disabled={submitting}>
              บันทึก
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                resetForm();
              }}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          ยอดที่ต้องชำระ <span className="ml-1 font-mono text-ink">{formatCurrency(netTotal)}</span>
        </span>
        <span className="text-muted-foreground">
          ชำระแล้ว <span className="ml-1 font-mono text-ink">{formatCurrency(paidSoFar)}</span>
        </span>
        <span
          className={cn(
            "font-semibold",
            remaining <= 0 ? "text-success" : "text-warn",
          )}
        >
          คงเหลือ <span className="ml-1 font-mono">{formatCurrency(remaining)}</span>
        </span>
      </div>
    </div>
  );
}
