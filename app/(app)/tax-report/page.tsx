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
    // ภาษีซื้อต้องห้าม (vat_non_claimable) ยังบันทึกเป็นค่าใช้จ่ายได้ปกติ แต่ต้องไม่ปนเข้ารายงาน
    // ภาษีซื้อที่ยื่นสรรพากร
    .eq("vat_non_claimable", false)
    .order("hp_number", { ascending: true });

  return (
    <>
      <Header
        eyebrow="บิลจ่าย HP"
        title="รายงานภาษีซื้อ"
        subtitle="สรุปรายการใบกำกับภาษีซื้อตามวันที่ได้รับใบกำกับจริง (ถ้าไม่ระบุ ยึดวันที่ในใบกำกับ) เรียงตามเลข HP"
        metaChip={`ทั้งหมด ${lines?.length ?? 0} รายการ`}
      />
      <TaxReportClient lines={lines ?? []} />
    </>
  );
}
