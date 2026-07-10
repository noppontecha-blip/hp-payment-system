"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { whtCategorySchema, type WhtCategoryFormValues } from "@/lib/validations/wht-category";

export async function createWhtCategory(values: WhtCategoryFormValues) {
  const parsed = whtCategorySchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("wht_categories").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/wht-categories");
}

export async function updateWhtCategory(id: string, values: WhtCategoryFormValues) {
  const parsed = whtCategorySchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("wht_categories").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/wht-categories");
}

export async function deleteWhtCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("wht_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/wht-categories");
}
