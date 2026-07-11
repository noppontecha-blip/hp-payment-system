import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { VehiclesClient } from "./vehicles-client";

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase.from("vehicles").select("*").order("code");

  return (
    <>
      <Header
        eyebrow="ข้อมูล MASTER"
        title="รถ-เครน"
        subtitle="ข้อมูลหลักรถและเครนสำหรับอ้างอิงในบิลจ่าย HP"
        metaChip={`ทั้งหมด ${vehicles?.length ?? 0} คัน`}
      />
      <VehiclesClient vehicles={vehicles ?? []} />
    </>
  );
}
