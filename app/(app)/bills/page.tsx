import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { BillsClient } from "./bills-client";

export default async function BillsPage() {
  const supabase = await createClient();
  const [{ data: lines }, { data: vendors }, { data: payments }] = await Promise.all([
    supabase.from("hp_payment_lines").select("*").order("transaction_date", { ascending: false }),
    supabase.from("vendors").select("*").order("name"),
    supabase.from("bill_payments").select("*"),
  ]);

  return (
    <>
      <Header
        eyebrow="รายจ่าย"
        title="รายจ่าย"
        subtitle="รายการย่อยทั้งหมดของรายจ่าย"
        metaChip={`ทั้งหมด ${lines?.length ?? 0} รายการ`}
      />
      <BillsClient lines={lines ?? []} vendors={vendors ?? []} payments={payments ?? []} />
    </>
  );
}
