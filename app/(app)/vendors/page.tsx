import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { VendorsClient } from "./vendors-client";

export default async function VendorsPage() {
  const supabase = await createClient();
  const [{ data: vendors }, { data: accounts }, { data: whtCategories }] = await Promise.all([
    supabase.from("vendors").select("*").order("code"),
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("wht_categories").select("*").order("name"),
  ]);

  return (
    <>
      <Header
        eyebrow="ข้อมูล MASTER"
        title="ผู้จำหน่าย"
        subtitle="ข้อมูลหลักผู้จำหน่ายสำหรับใช้ในบิลจ่าย HP"
        metaChip={`ทั้งหมด ${vendors?.length ?? 0} ราย`}
      />
      <VendorsClient
        vendors={vendors ?? []}
        accounts={accounts ?? []}
        whtCategories={whtCategories ?? []}
      />
    </>
  );
}
