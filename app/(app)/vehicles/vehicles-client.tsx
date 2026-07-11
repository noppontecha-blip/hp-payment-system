"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/master-data/data-table";
import { CategoryTag } from "@/components/shared/category-tag";
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { deleteVehicle } from "@/lib/actions/vehicles";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export function VehiclesClient({ vehicles }: { vehicles: Vehicle[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.code.toLowerCase().includes(q) ||
        (v.nickname ?? "").toLowerCase().includes(q) ||
        (v.plate_number ?? "").toLowerCase().includes(q),
    );
  }, [vehicles, search]);

  const columns: Column<Vehicle>[] = [
    { key: "code", header: "รหัส", render: (v) => v.code },
    { key: "nickname", header: "ชื่อเล่น", render: (v) => v.nickname ?? "-" },
    { key: "size", header: "ขนาด", render: (v) => v.size ?? "-" },
    { key: "plate_number", header: "ทะเบียน", render: (v) => v.plate_number ?? "-" },
    {
      key: "vat_eligible",
      header: "VAT",
      render: (v) => <CategoryTag label={v.vat_eligible ? "เข้าเกณฑ์ VAT" : "ไม่เข้าเกณฑ์"} />,
    },
  ];

  async function handleDelete(vehicle: Vehicle) {
    if (!confirm(`ยืนยันลบรถ/เครน "${vehicle.code}"?`)) return;
    try {
      await deleteVehicle(vehicle.id);
      toast.success("ลบรถ/เครนแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหารถ/เครน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          เพิ่มรถ/เครน
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        onEdit={(row) => {
          setEditing(row);
          setOpen(true);
        }}
        onDelete={handleDelete}
        emptyLabel="ยังไม่มีข้อมูลรถ/เครน"
      />

      <VehicleFormDialog open={open} onOpenChange={setOpen} vehicle={editing} />
    </div>
  );
}
