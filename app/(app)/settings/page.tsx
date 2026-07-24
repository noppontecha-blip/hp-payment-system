import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { CompanyProfileForm } from "./company-profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("company_profile").select("*").limit(1).single();

  return (
    <>
      <Header
        eyebrow="ตั้งค่า"
        title="ตั้งค่าบริษัท"
        subtitle="ข้อมูลบริษัท (ผู้จ่ายเงิน) สำหรับพิมพ์หัวใบ 50 ทวิ"
      />
      {profile ? (
        <CompanyProfileForm profile={profile} />
      ) : (
        <div className="p-5 text-sm text-muted-foreground">
          ไม่พบข้อมูลบริษัท กรุณาติดต่อผู้ดูแลระบบ
        </div>
      )}
    </>
  );
}
