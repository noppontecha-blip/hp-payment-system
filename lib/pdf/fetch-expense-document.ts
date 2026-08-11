import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

// Shared data-fetch for every printable รายจ่าย document (บันทึกรายจ่าย, ใบสำคัญจ่าย,
// ใบรับรองแทนใบเสร็จรับเงิน) — one Promise.all covering vendor/company/accounts/vehicles/payments,
// reused by all three print routes so the query + line-mapping logic isn't triplicated.
export type ExpenseDocumentData = {
  hpNumber: string;
  transactionDate: string;
  documentNumber: string | null;
  company: {
    company_name: string;
    tax_id: string | null;
    branch: string | null;
    registered_address: string | null;
    phone: string | null;
    authorized_signer_name: string | null;
  };
  vendor: {
    name: string;
    code: string | null;
    tax_id: string | null;
    address: string | null;
    contact_phone: string | null;
    contact_name: string | null;
  };
  lines: {
    seq: number;
    accountCode: string;
    accountLabel: string;
    vehicleLabel: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amountBeforeVat: number;
    vatAmount: number;
    whtAmount: number;
    documentNumber: string | null;
    documentInvoiceDate: string | null;
  }[];
  totals: { beforeVat: number; vat: number; wht: number; net: number };
  requiresWht: boolean;
  payments: { payment_date: string; amount: number; payment_method: string | null; notes: string | null }[];
  headerPaymentMethod: string | null;
  headerPaymentDate: string | null;
  notes: string | null;
  isCancelled: boolean;
};

export async function fetchExpenseDocumentData(
  supabase: SupabaseClient<Database>,
  hpNumber: string,
): Promise<ExpenseDocumentData | null> {
  const { data: lines } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("hp_number", hpNumber)
    .order("created_at");
  if (!lines || lines.length === 0) return null;

  const first = lines[0];

  const [{ data: vendor }, { data: company }, { data: accounts }, { data: vehicles }, { data: payments }] =
    await Promise.all([
      first.vendor_id
        ? supabase.from("vendors").select("*").eq("id", first.vendor_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("company_profile").select("*").limit(1).single(),
      supabase.from("chart_of_accounts").select("*"),
      supabase.from("vehicles").select("*"),
      supabase.from("bill_payments").select("*").eq("hp_number", hpNumber).order("payment_date"),
    ]);

  const accountMap = new Map((accounts ?? []).map((a) => [a.id, a]));
  const vehicleMap = new Map((vehicles ?? []).map((v) => [v.id, v.code]));

  const beforeVat = lines.reduce((sum, l) => sum + (l.amount_before_vat || 0), 0);
  const vat = lines.reduce((sum, l) => sum + (l.vat_amount || 0), 0);
  const wht = lines.reduce((sum, l) => sum + (l.wht_amount || 0), 0);
  const net = lines.reduce((sum, l) => sum + (l.net_paid_amount || 0), 0);

  // เลขที่เอกสารเป็นต่อรายการย่อยแล้ว (1 HP อาจมีใบกำกับภาษีหลายใบ เช่น ประกันภัยแยกตามรถแต่ละคัน) —
  // อ้างอิงบนหัวเอกสารเป็นสรุปเลขที่ทั้งหมดที่ไม่ซ้ำกัน ส่วนรายละเอียดครบถ้วนต่อใบอยู่ในตารางรายการ
  const distinctDocNumbers = Array.from(new Set(lines.map((l) => l.document_number).filter(Boolean)));

  return {
    hpNumber,
    transactionDate: first.transaction_date,
    documentNumber: distinctDocNumbers.length > 0 ? distinctDocNumbers.join(", ") : null,
    company: {
      company_name: company?.company_name ?? "-",
      tax_id: company?.tax_id ?? null,
      branch: company?.branch ?? null,
      registered_address: company?.registered_address ?? null,
      phone: company?.phone ?? null,
      authorized_signer_name: company?.authorized_signer_name ?? null,
    },
    vendor: {
      name: first.vendor_name_snapshot,
      code: vendor?.code ?? null,
      // ผู้ขายขาจร (V9999) ไม่มีเลขผู้เสียภาษีประจำ — ใช้เลขที่ระบุเองต่อเอกสารแทนถ้ามี
      tax_id: vendor?.tax_id ?? first.adhoc_vendor_tax_id ?? null,
      address: vendor?.registered_address ?? vendor?.mailing_address ?? null,
      contact_phone: vendor?.contact_phone ?? null,
      contact_name: vendor?.contact_name ?? null,
    },
    lines: lines.map((l, i) => {
      const account = l.account_code_id ? accountMap.get(l.account_code_id) : undefined;
      return {
        seq: i + 1,
        accountCode: account?.code ?? "",
        accountLabel: account ? `${account.code} — ${account.name}` : "",
        vehicleLabel: l.vehicle_id ? (vehicleMap.get(l.vehicle_id) ?? "") : "",
        description: l.description,
        quantity: l.quantity ?? 1,
        unitPrice: l.unit_price ?? l.amount_before_vat,
        amountBeforeVat: l.amount_before_vat,
        vatAmount: l.vat_amount,
        whtAmount: l.wht_amount ?? 0,
        documentNumber: l.document_number,
        documentInvoiceDate: l.document_invoice_date,
      };
    }),
    totals: { beforeVat, vat, wht, net },
    requiresWht: first.requires_wht,
    payments: (payments ?? []).map((p) => ({
      payment_date: p.payment_date,
      amount: p.amount,
      payment_method: p.payment_method,
      notes: p.notes,
    })),
    headerPaymentMethod: first.payment_method,
    headerPaymentDate: first.payment_date,
    notes: first.notes,
    isCancelled: first.is_cancelled,
  };
}
