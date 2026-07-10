import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { BillsClient } from "./bills-client";

export default async function BillsPage() {
  const supabase = await createClient();
  const [{ data: lines }, { data: vendors }] = await Promise.all([
    supabase.from("hp_payment_lines").select("*").order("transaction_date", { ascending: false }),
    supabase.from("vendors").select("*").order("name"),
  ]);

  return (
    <>
      <Header title="รายการบิลจ่าย HP" subtitle="รายการย่อยทั้งหมดของบิลจ่าย HP" />
      <BillsClient lines={lines ?? []} vendors={vendors ?? []} />
    </>
  );
}
