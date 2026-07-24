"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { accountSchema, type AccountFormValues } from "@/lib/validations/account";

async function resolveLevel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  code: string,
  parentCode: string | null | undefined,
) {
  if (!parentCode) return 1;
  if (parentCode === code) throw new Error("ไม่สามารถเลือกตัวเองเป็นบัญชีแม่ได้");

  const { data: parent, error } = await supabase
    .from("chart_of_accounts")
    .select("account_type, level")
    .eq("code", parentCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!parent) throw new Error("ไม่พบรหัสบัญชีแม่");
  if (parent.account_type !== "คุม") {
    throw new Error("เลือกได้เฉพาะบัญชีคุมเป็นบัญชีแม่");
  }
  return (parent.level ?? 0) + 1;
}

export async function createAccount(values: AccountFormValues) {
  const parsed = accountSchema.parse(values);
  const supabase = await createClient();
  const level = await resolveLevel(supabase, parsed.code, parsed.parent_code);
  const { error } = await supabase.from("chart_of_accounts").insert({ ...parsed, level });
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

export async function updateAccount(id: string, values: AccountFormValues) {
  const parsed = accountSchema.parse(values);
  const supabase = await createClient();
  const level = await resolveLevel(supabase, parsed.code, parsed.parent_code);
  const { error } = await supabase
    .from("chart_of_accounts")
    .update({ ...parsed, level })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();

  const { data: account, error: fetchError } = await supabase
    .from("chart_of_accounts")
    .select("code")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!account) throw new Error("ไม่พบรหัสบัญชีนี้");

  const { count: childCount, error: childError } = await supabase
    .from("chart_of_accounts")
    .select("id", { count: "exact", head: true })
    .eq("parent_code", account.code);
  if (childError) throw new Error(childError.message);
  if (childCount && childCount > 0) {
    throw new Error("มีบัญชีย่อยอยู่ภายใต้รหัสนี้ ต้องลบ/ย้ายก่อน");
  }

  const { count: lineCount, error: lineError } = await supabase
    .from("hp_payment_lines")
    .select("id", { count: "exact", head: true })
    .eq("account_code_id", id);
  if (lineError) throw new Error(lineError.message);

  const { count: vendorCount, error: vendorError } = await supabase
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("default_account_code_id", id);
  if (vendorError) throw new Error(vendorError.message);

  if ((lineCount && lineCount > 0) || (vendorCount && vendorCount > 0)) {
    throw new Error("รหัสบัญชีนี้ถูกใช้งานอยู่ ไม่สามารถลบได้");
  }

  const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/accounts");
}
