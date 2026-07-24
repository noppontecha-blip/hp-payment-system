import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { AssetCategoriesClient } from "./asset-categories-client";

export default async function AssetCategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from("asset_categories").select("*").order("name"),
    supabase.from("chart_of_accounts").select("*").order("code"),
  ]);

  return (
    <>
      <Header
        eyebrow="ข้อมูล MASTER"
        title="หมวดสินทรัพย์"
        subtitle="หมวดสินทรัพย์และอายุการใช้งานมาตรฐานสำหรับทะเบียนทรัพย์สิน"
        metaChip={`ทั้งหมด ${categories?.length ?? 0} หมวด`}
      />
      <AssetCategoriesClient categories={categories ?? []} accounts={accounts ?? []} />
    </>
  );
}
