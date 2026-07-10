"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  hpBillDraftSchema,
  hpBillFinalSchema,
  type HpBillFormValues,
} from "@/lib/validations/hp-line";
import { toISODateString } from "@/lib/utils/thai-date";
import type { Database } from "@/lib/types/database";

type HpLineInsert = Database["public"]["Tables"]["hp_payment_lines"]["Insert"];

export async function generateHpNumber(dateIso: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_next_hp_number", { p_date: dateIso });
  if (error) throw new Error(error.message);
  return data as unknown as string;
}

export async function saveHpBill(input: HpBillFormValues, mode: "draft" | "final") {
  const schema = mode === "final" ? hpBillFinalSchema : hpBillDraftSchema;
  const parsed = schema.parse(input);
  const { lines, ...header } = parsed;

  const supabase = await createClient();

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

  const rowsToUpdate: HpLineInsert[] = [];
  const rowsToInsert: HpLineInsert[] = [];

  for (const line of lines) {
    const { id, ...lineFields } = line;
    const row: HpLineInsert = {
      ...header,
      ...lineFields,
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
  revalidatePath("/wht-tracking");

  return { hp_number: header.hp_number };
}

export async function deleteHpBill(hpNumber: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hp_payment_lines").delete().eq("hp_number", hpNumber);
  if (error) throw new Error(error.message);
  revalidatePath("/bills");
  revalidatePath("/dashboard");
}

export async function issueWhtCertificate(lineId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hp_payment_lines")
    .update({ wht_issue_date: toISODateString(new Date()) })
    .eq("id", lineId);
  if (error) throw new Error(error.message);
  revalidatePath("/wht-tracking");
}
