import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { DocumentTrackingClient } from "./document-tracking-client";

export default async function DocumentTrackingPage() {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .order("transaction_date", { ascending: false });

  return (
    <>
      <Header
        eyebrow="บิลจ่าย HP"
        title="ติดตามเอกสารซื้อ (ใบกำกับภาษี/บิลเงินสด)"
        subtitle="รายการ HP ที่ยังตามเอกสารจากผู้จำหน่ายไม่ครบ"
        metaChip={`ทั้งหมด ${lines?.length ?? 0} รายการ`}
      />
      <DocumentTrackingClient lines={lines ?? []} />
    </>
  );
}
