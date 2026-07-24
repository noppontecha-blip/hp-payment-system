"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { billPaymentSchema, type BillPaymentFormValues } from "@/lib/validations/bill-payment";

export async function createBillPayment(values: BillPaymentFormValues) {
  const parsed = billPaymentSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("bill_payments").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath(`/bills/${parsed.hp_number}/edit`);
}

export async function deleteBillPayment(id: string, hpNumber: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bill_payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/bills/${hpNumber}/edit`);
}
