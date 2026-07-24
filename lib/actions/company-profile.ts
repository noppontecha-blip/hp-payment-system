"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  companyProfileSchema,
  type CompanyProfileFormValues,
} from "@/lib/validations/company-profile";

export async function updateCompanyProfile(id: string, values: CompanyProfileFormValues) {
  const parsed = companyProfileSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("company_profile").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
