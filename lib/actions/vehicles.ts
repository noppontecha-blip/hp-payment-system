"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { vehicleSchema, type VehicleFormValues } from "@/lib/validations/vehicle";

export async function createVehicle(values: VehicleFormValues) {
  const parsed = vehicleSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}

export async function updateVehicle(id: string, values: VehicleFormValues) {
  const parsed = vehicleSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/vehicles");
}
