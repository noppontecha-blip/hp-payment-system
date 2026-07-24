import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { BillForm } from "@/components/bills/bill-form";
import { peekHpNumber } from "@/lib/actions/bills";
import { toISODateString } from "@/lib/utils/thai-date";
import type { HpBillFormValues } from "@/lib/validations/hp-line";

// เมนู "สร้างเอกสาร" ในไซด์บาร์ลิงก์มาที่ฟอร์มเดียวกันนี้ พร้อม query param บอกหมวดเริ่มต้นของ
// รายการย่อยแรก (แต่ละรายการเลือกหมวดของตัวเองได้ ไม่ใช่ทั้งเอกสารอีกต่อไป)
const CATEGORY_DEFAULTS: Record<string, HpBillFormValues["lines"][number]["expense_group"]> = {
  "vehicle-cost": "ต้นทุนรายคัน",
  sga: "ค่าใช้จ่ายขายและบริหาร",
  asset: "สินทรัพย์",
};

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialExpenseGroup = category ? CATEGORY_DEFAULTS[category] : undefined;

  const supabase = await createClient();
  const [
    { data: vendors },
    { data: vehicles },
    { data: accounts },
    { data: whtCategories },
    { data: assetCategories },
  ] = await Promise.all([
    supabase.from("vendors").select("*").order("name"),
    supabase.from("vehicles").select("*").order("code"),
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("wht_categories").select("*").order("name"),
    supabase.from("asset_categories").select("*").order("name"),
  ]);

  // Preview only — does not advance hp_number_counters. The real number is claimed once,
  // server-side, at the moment the document is actually saved (see saveHpBill).
  const hpNumber = await peekHpNumber(toISODateString(new Date()));

  return (
    <>
      <Header eyebrow="รายจ่าย" title="สร้างเอกสาร" metaChip={`เลข HP: ${hpNumber}`} />
      <BillForm
        mode="create"
        hpNumber={hpNumber}
        vendors={vendors ?? []}
        vehicles={vehicles ?? []}
        accounts={accounts ?? []}
        whtCategories={whtCategories ?? []}
        assetCategories={assetCategories ?? []}
        initialExpenseGroup={initialExpenseGroup}
      />
    </>
  );
}
