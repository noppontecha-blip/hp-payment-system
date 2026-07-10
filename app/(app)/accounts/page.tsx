import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { AccountsClient } from "./accounts-client";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from("chart_of_accounts").select("*").order("code");

  return (
    <>
      <Header title="ผังบัญชี" subtitle="รหัสบัญชีสำหรับจัดหมวดรายการบิลจ่าย HP" />
      <AccountsClient accounts={accounts ?? []} />
    </>
  );
}
