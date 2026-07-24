"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/master-data/data-table";
import { AssetCategoryFormDialog } from "./asset-category-form-dialog";
import { deleteAssetCategory } from "@/lib/actions/asset-categories";
import type { Database } from "@/lib/types/database";

type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

export function AssetCategoriesClient({
  categories,
  accounts,
}: {
  categories: AssetCategory[];
  accounts: Account[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssetCategory | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const columns: Column<AssetCategory>[] = [
    { key: "name", header: "ชื่อหมวด", render: (c) => c.name },
    {
      key: "fixed_asset_account_id",
      header: "บัญชีสินทรัพย์",
      render: (c) => {
        const account = accounts.find((a) => a.id === c.fixed_asset_account_id);
        return account ? `${account.code} — ${account.name}` : "-";
      },
    },
    {
      key: "default_useful_life_years",
      header: "อายุการใช้งาน (ปี)",
      align: "right",
      numeric: true,
      render: (c) => (c.default_useful_life_years != null ? `${c.default_useful_life_years} ปี` : "-"),
    },
    { key: "reference_note", header: "หมายเหตุ", render: (c) => c.reference_note ?? "-" },
  ];

  async function handleDelete(category: AssetCategory) {
    if (!confirm(`ยืนยันลบหมวด "${category.name}"?`)) return;
    try {
      await deleteAssetCategory(category.id);
      toast.success("ลบหมวดสินทรัพย์แล้ว");
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
            placeholder="ค้นหาหมวดสินทรัพย์..."
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
          เพิ่มหมวดสินทรัพย์
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
        emptyLabel="ยังไม่มีหมวดสินทรัพย์"
      />

      <AssetCategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        category={editing}
        accounts={accounts}
      />
    </div>
  );
}
