import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { TaxReportClient } from "./tax-report-client";

export default async function TaxReportPage() {
  const supabase = await createClient();
  const { data: lines } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("document_type", "ใบกำกับภาษี")
    .not("document_invoice_date", "is", null)
    .order("hp_number", { ascending: true });

  return (
    <>
      <Header
        eyebrow="บิลจ่าย HP"
        title="รายงานภาษีซื้อ"
        subtitle="สรุปรายการใบกำกับภาษีซื้อตามวันที่ในใบกำกับภาษี เรียงตามเลข HP"
        metaChip={`ทั้งหมด ${lines?.length ?? 0} รายการ`}
      />
      <TaxReportClient lines={lines ?? []} />
    </>
  );
}
