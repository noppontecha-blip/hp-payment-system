import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { BillForm } from "@/components/bills/bill-form";
import { generateHpNumber } from "@/lib/actions/bills";
import { toISODateString } from "@/lib/utils/thai-date";

export default async function NewBillPage() {
  const supabase = await createClient();
  const [{ data: vendors }, { data: vehicles }, { data: accounts }, { data: whtCategories }] =
    await Promise.all([
      supabase.from("vendors").select("*").order("name"),
      supabase.from("vehicles").select("*").order("code"),
      supabase.from("chart_of_accounts").select("*").order("code"),
      supabase.from("wht_categories").select("*").order("name"),
    ]);

  const hpNumber = await generateHpNumber(toISODateString(new Date()));

  return (
    <>
      <Header title="สร้างบิลจ่าย HP" subtitle={`เลข HP: ${hpNumber}`} />
      <BillForm
        mode="create"
        hpNumber={hpNumber}
        vendors={vendors ?? []}
        vehicles={vehicles ?? []}
        accounts={accounts ?? []}
        whtCategories={whtCategories ?? []}
      />
    </>
  );
}
