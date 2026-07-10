"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountSchema, type AccountFormValues } from "@/lib/validations/account";

export async function createAccount(values: AccountFormValues) {
  const parsed = accountSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("chart_of_accounts").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

export async function updateAccount(id: string, values: AccountFormValues) {
  const parsed = accountSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("chart_of_accounts").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}
