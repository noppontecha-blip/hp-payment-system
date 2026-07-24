"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AccountTree } from "./account-tree";
import { AccountDetailPanel } from "./account-detail-panel";
import type { Database } from "@/lib/types/database";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

export function AccountsClient({ accounts }: { accounts: Account[] }) {
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createParentCode, setCreateParentCode] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.code === selectedCode) ?? null,
    [accounts, selectedCode],
  );

  function handleSelect(account: Account) {
    setCreating(false);
    setSelectedCode(account.code);
  }

  function handleAddRoot() {
    setCreating(true);
    setCreateParentCode(null);
    setSelectedCode(null);
  }

  function handleAddChild(parentCode: string) {
    setCreating(true);
    setCreateParentCode(parentCode);
    setSelectedCode(null);
  }

  function handleSaved(code: string) {
    setCreating(false);
    setSelectedCode(code);
  }

  function handleDeleted() {
    setCreating(false);
    setSelectedCode(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหารหัสบัญชี หรือชื่อบัญชี..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={handleAddRoot}>
              <Plus className="size-4" />
              เพิ่มบัญชี
            </Button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            <AccountTree
              accounts={accounts}
              selectedCode={selectedCode}
              onSelect={handleSelect}
              search={search}
            />
          </div>
        </CardContent>
      </Card>

      {creating || selectedAccount ? (
        <AccountDetailPanel
          key={creating ? `create:${createParentCode ?? "root"}` : `edit:${selectedAccount?.code}`}
          account={creating ? null : selectedAccount}
          defaultParentCode={createParentCode}
          accounts={accounts}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCancel={() => setCreating(false)}
          onAddChild={handleAddChild}
        />
      ) : (
        <Card className="h-fit">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            เลือกรหัสบัญชีทางซ้าย หรือกด &quot;เพิ่มบัญชี&quot; เพื่อสร้างรายการใหม่
          </CardContent>
        </Card>
      )}
    </div>
  );
}
