import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";
import { formatThaiDate, toISODateString } from "@/lib/utils/thai-date";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const lastUpdatedDate = formatThaiDate(toISODateString(now));
  const lastUpdatedTime = now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        userEmail={user?.email}
        lastUpdatedDate={lastUpdatedDate}
        lastUpdatedTime={lastUpdatedTime}
      />
      <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  );
}
