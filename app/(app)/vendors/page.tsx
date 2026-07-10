import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { VendorsClient } from "./vendors-client";

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase.from("vendors").select("*").order("code");

  return (
    <>
      <Header title="ผู้จำหน่าย" subtitle="ข้อมูลหลักผู้จำหน่ายสำหรับใช้ในบิลจ่าย HP" />
      <VendorsClient vendors={vendors ?? []} />
    </>
  );
}
