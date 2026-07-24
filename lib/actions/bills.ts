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
