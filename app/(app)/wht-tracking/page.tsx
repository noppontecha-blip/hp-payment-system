import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { WhtTrackingClient } from "./wht-tracking-client";

export default async function WhtTrackingPage() {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("requires_wht", true)
    .order("transaction_date", { ascending: false });

  return (
    <>
      <Header title="ติดตามใบหัก ณ ที่จ่าย" subtitle="รายการที่ต้องหัก ณ ที่จ่ายและสถานะการออกหนังสือ" />
      <WhtTrackingClient lines={lines ?? []} />
    </>
  );
}
