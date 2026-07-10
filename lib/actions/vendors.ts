"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { vendorSchema, type VendorFormValues } from "@/lib/validations/vendor";

export async function createVendor(values: VendorFormValues) {
  const parsed = vendorSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/vendors");
}

export async function updateVendor(id: string, values: VendorFormValues) {
  const parsed = vendorSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vendors");
}

export async function deleteVendor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vendors");
}
