import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("chart_of_accounts").select("*").order("code");

  return (
    <>
      <Header
        eyebrow="ข้อมูล MASTER"
        title="ผังบัญชี"
        subtitle="รหัสบัญชีสำหรับจัดหมวดรายการบิลจ่าย HP"
        metaChip={`ทั้งหมด ${accounts?.length ?? 0} รหัส`}
      />
      <AccountsClient accounts={accounts ?? []} />
    </>
  );
}
