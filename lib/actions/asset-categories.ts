"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  assetCategorySchema,
  type AssetCategoryFormValues,
} from "@/lib/validations/asset-category";

export async function createAssetCategory(values: AssetCategoryFormValues) {
  const parsed = assetCategorySchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("asset_categories").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/asset-categories");
}

export async function updateAssetCategory(id: string, values: AssetCategoryFormValues) {
  const parsed = assetCategorySchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("asset_categories").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/asset-categories");
}

export async function deleteAssetCategory(id: string) {
  const supabase = await createClient();

  const { count, error: lineError } = await supabase
    .from("hp_payment_lines")
    .select("id", { count: "exact", head: true })
    .eq("asset_category_id", id);
  if (lineError) throw new Error(lineError.message);
  if (count && count > 0) {
    throw new Error("หมวดสินทรัพย์นี้ถูกใช้งานอยู่ ไม่สามารถลบได้");
  }

  const { error } = await supabase.from("asset_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/asset-categories");
}
