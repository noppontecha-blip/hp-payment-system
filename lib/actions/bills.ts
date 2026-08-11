"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hpBillDraftSchema,
  hpBillFinalSchema,
  type HpBillFormValues,
} from "@/lib/validations/hp-line";
import type { Database } from "@/lib/types/database";

type HpLineInsert = Database["public"]["Tables"]["hp_payment_lines"]["Insert"];

// Read-only preview for display before the first save — never advances the counter.
export async function peekHpNumber(dateIso: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("peek_next_hp_number", { p_date: dateIso });
  if (error) throw new Error(error.message);
  return data as unknown as string;
}

// Atomically claims a real number — only ever called server-side, once, at the moment a
// brand-new document is actually saved (see saveHpBill's isNewDocument branch below).
async function generateHpNumber(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dateIso: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("generate_next_hp_number", { p_date: dateIso });
  if (error) throw new Error(error.message);
  return data as unknown as string;
}

// เลขที่ใบกำกับภาษีซื้อห้ามซ้ำกับที่เคยบันทึกไว้แล้วของผู้จำหน่ายรายเดียวกัน (ไม่นับเอกสารนี้เอง หรือ
// เอกสารที่ยกเลิกแล้ว) — ป้องกันเคสยื่นภาษีซื้อซ้ำเดือนแล้วโดนเบี้ยปรับ. เทียบตาม vendor_id ถ้าเป็น
// ผู้จำหน่ายจริง หรือ adhoc_vendor_tax_id ถ้าเป็นผู้จำหน่าย "ทั่วไป" (V9999) — ไม่มีทั้งคู่แปลว่าไม่มี
// ตัวตนผู้ขายให้เทียบ ข้ามการตรวจสอบ
export async function checkDuplicateInvoiceNumber(params: {
  documentNumber: string;
  vendorId: string | null;
  adhocVendorTaxId: string | null;
  excludeHpNumber: string;
}): Promise<{ duplicate: boolean; hpNumber: string | null }> {
  if (!params.vendorId && !params.adhocVendorTaxId) return { duplicate: false, hpNumber: null };

  const supabase = await createClient();
  let query = supabase
    .from("hp_payment_lines")
    .select("hp_number")
    .eq("document_number", params.documentNumber)
    .eq("document_type", "ใบกำกับภาษี")
    .eq("is_cancelled", false)
    .neq("hp_number", params.excludeHpNumber)
    .limit(1);
  query = params.vendorId
    ? query.eq("vendor_id", params.vendorId)
    : query.eq("adhoc_vendor_tax_id", params.adhocVendorTaxId as string);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return { duplicate: (data?.length ?? 0) > 0, hpNumber: data?.[0]?.hp_number ?? null };
}

export async function saveHpBill(
  input: HpBillFormValues,
  saveMode: "draft" | "final",
  isNewDocument: boolean,
) {
  const schema = saveMode === "final" ? hpBillFinalSchema : hpBillDraftSchema;
  const parsed = schema.parse(input);
  const { lines, ...header } = parsed;

  const supabase = await createClient();

  // A brand-new document only ever gets a real, counter-committed hp_number here — at save
  // time — not when the page was opened. This is what fixes numbers being burned just by
  // visiting /bills/new (see peekHpNumber, used for display before this point).
  if (isNewDocument) {
    header.hp_number = await generateHpNumber(supabase, header.transaction_date);
  }

  // ตรวจสอบเลขที่ใบกำกับภาษีซื้อซ้ำก่อนบันทึกจริง — บล็อกการบันทึกถ้าซ้ำ (ทั้งบันทึกร่างและบันทึกจริง
  // เพราะทั้งคู่เขียนลงตารางจริงเหมือนกัน) รวบเลขที่ที่ไม่ซ้ำกันก่อนเพื่อไม่ต้อง query ซ้ำต่อบรรทัด
  if (header.document_type === "ใบกำกับภาษี") {
    const documentNumbers = Array.from(
      new Set(lines.map((l) => l.document_number).filter((n): n is string => !!n)),
    );
    for (const documentNumber of documentNumbers) {
      const dup = await checkDuplicateInvoiceNumber({
        documentNumber,
        vendorId: header.vendor_id ?? null,
        adhocVendorTaxId: header.adhoc_vendor_tax_id ?? null,
        excludeHpNumber: header.hp_number,
      });
      if (dup.duplicate) {
        throw new Error(
          `เลขที่ใบกำกับภาษี "${documentNumber}" ซ้ำกับเอกสาร ${dup.hpNumber} ที่บันทึกไว้แล้ว (ผู้จำหน่ายเดียวกัน) — กรุณาตรวจสอบก่อนบันทึก เพื่อป้องกันการยื่นภาษีซื้อซ้ำ`,
        );
      }
    }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("hp_payment_lines")
    .select("id")
    .eq("hp_number", header.hp_number);
  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existingRows ?? []).map((r) => r.id));
  const submittedIds = new Set(lines.filter((l) => l.id).map((l) => l.id as string));
  const idsToDelete = [...existingIds].filter((id) => !submittedIds.has(id));

  if (idsToDelete.length > 0) {
    const { error } = await supabase.from("hp_payment_lines").delete().in("id", idsToDelete);
    if (error) throw new Error(error.message);
  }

  const isDraft = saveMode === "draft";
  const rowsToUpdate: HpLineInsert[] = [];
  const rowsToInsert: HpLineInsert[] = [];

  for (const line of lines) {
    const { id, ...lineFields } = line;
    const row: HpLineInsert = {
      ...header,
      ...lineFields,
      is_draft: isDraft,
    };
    if (id) {
      rowsToUpdate.push({ ...row, id });
    } else {
      rowsToInsert.push(row);
    }
  }

  if (rowsToUpdate.length > 0) {
    const { error } = await supabase.from("hp_payment_lines").upsert(rowsToUpdate);
    if (error) throw new Error(error.message);
  }
  if (rowsToInsert.length > 0) {
    const { error } = await supabase.from("hp_payment_lines").insert(rowsToInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/bills");
  revalidatePath(`/bills/${header.hp_number}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/document-tracking");

  return { hp_number: header.hp_number };
}

// Documents are never hard-deleted (would break sequential HP numbering) — cancelling stamps
// every line for this hp_number instead, surfaced as a red "ยกเลิก" mark on the printed PDF
// and a greyed-out row in the list.
export async function cancelHpBill(hpNumber: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hp_payment_lines")
    .update({ is_cancelled: true })
    .eq("hp_number", hpNumber);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath(`/bills/${hpNumber}/edit`);
  revalidatePath("/dashboard");
  revalidatePath("/document-tracking");
}
