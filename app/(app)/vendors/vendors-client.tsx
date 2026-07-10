"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/master-data/data-table";
import { VendorFormDialog } from "./vendor-form-dialog";
import { deleteVendor } from "@/lib/actions/vendors";
import type { Database } from "@/lib/types/database";

type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

export function VendorsClient({ vendors }: { vendors: Vendor[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) => v.name.toLowerCase().includes(q) || v.code.toLowerCase().includes(q),
    );
  }, [vendors, search]);

  const columns: Column<Vendor>[] = [
    { key: "code", header: "รหัส", render: (v) => v.code },
    { key: "name", header: "ชื่อผู้จำหน่าย", render: (v) => v.name },
    { key: "payment_method", header: "วิธีชำระเงิน", render: (v) => v.payment_method ?? "-" },
    { key: "bank_account", header: "เลขบัญชี", render: (v) => v.bank_account ?? "-" },
    { key: "tax_id", header: "เลขผู้เสียภาษี", render: (v) => v.tax_id ?? "-" },
  ];

  async function handleDelete(vendor: Vendor) {
    if (!confirm(`ยืนยันลบผู้จำหน่าย "${vendor.name}"?`)) return;
    try {
      await deleteVendor(vendor.id);
      toast.success("ลบผู้จำหน่ายแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาผู้จำหน่าย..."
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
          เพิ่มผู้จำหน่าย
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
        emptyLabel="ยังไม่มีข้อมูลผู้จำหน่าย"
      />

      <VendorFormDialog open={open} onOpenChange={setOpen} vendor={editing} />
    </div>
  );
}
