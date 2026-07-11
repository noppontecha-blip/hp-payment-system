import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { WhtCategoriesClient } from "./wht-categories-client";

export default async function WhtCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("wht_categories").select("*").order("name");

  return (
    <>
      <Header
        eyebrow="ข้อมูล MASTER"
        title="หมวดหัก ณ ที่จ่าย"
        subtitle="หมวดและอัตราหัก ณ ที่จ่ายมาตรฐานสำหรับใช้ในบิลจ่าย HP"
        metaChip={`ทั้งหมด ${categories?.length ?? 0} หมวด`}
      />
      <WhtCategoriesClient categories={categories ?? []} />
    </>
  );
}
