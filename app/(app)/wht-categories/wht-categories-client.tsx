"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/master-data/data-table";
import { WhtCategoryFormDialog } from "./wht-category-form-dialog";
import { deleteWhtCategory } from "@/lib/actions/wht-categories";
import type { Database } from "@/lib/types/database";

type WhtCategory = Database["public"]["Tables"]["wht_categories"]["Row"];

export function WhtCategoriesClient({ categories }: { categories: WhtCategory[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WhtCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const columns: Column<WhtCategory>[] = [
    { key: "name", header: "ชื่อหมวด", render: (c) => c.name },
    {
      key: "default_rate_pct",
      header: "อัตราเริ่มต้น",
      align: "right",
      render: (c) => (c.default_rate_pct != null ? `${c.default_rate_pct}%` : "-"),
    },
    { key: "reference_note", header: "หมายเหตุ", render: (c) => c.reference_note ?? "-" },
  ];

  async function handleDelete(category: WhtCategory) {
    if (!confirm(`ยืนยันลบหมวด "${category.name}"?`)) return;
    try {
      await deleteWhtCategory(category.id);
      toast.success("ลบหมวดหัก ณ ที่จ่ายแล้ว");
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
            placeholder="ค้นหาหมวดหัก ณ ที่จ่าย..."
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
          เพิ่มหมวดหัก
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
        emptyLabel="ยังไม่มีหมวดหัก ณ ที่จ่าย"
      />

      <WhtCategoryFormDialog open={open} onOpenChange={setOpen} category={editing} />
    </div>
  );
}
