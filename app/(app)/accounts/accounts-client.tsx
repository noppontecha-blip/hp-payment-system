"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/master-data/data-table";
import { AccountFormDialog } from "./account-form-dialog";
import { deleteAccount } from "@/lib/actions/accounts";
import type { Database } from "@/lib/types/database";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const columns: Column<Account>[] = [
    { key: "code", header: "รหัสบัญชี", render: (a) => a.code },
    { key: "name", header: "ชื่อบัญชี", render: (a) => a.name },
    { key: "legacy_note", header: "หมายเหตุ", render: (a) => a.legacy_note ?? "-" },
  ];

  async function handleDelete(account: Account) {
    if (!confirm(`ยืนยันลบรหัสบัญชี "${account.code}"?`)) return;
    try {
      await deleteAccount(account.id);
      toast.success("ลบรหัสบัญชีแล้ว");
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
            placeholder="ค้นหารหัสบัญชี..."
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
          เพิ่มรหัสบัญชี
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
        emptyLabel="ยังไม่มีผังบัญชี"
      />

      <AccountFormDialog open={open} onOpenChange={setOpen} account={editing} />
    </div>
  );
}
