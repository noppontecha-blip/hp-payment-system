"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Account = Database["public"]["Tables"]["chart_of_accounts"]["Row"];

const CATEGORY_ORDER = ["สินทรัพย์", "หนี้สิน", "ทุน", "รายได้", "ค่าใช้จ่าย"] as const;

function buildChildrenMap(accounts: Account[]) {
  const map = new Map<string, Account[]>();
  for (const a of accounts) {
    if (!a.parent_code) continue;
    if (!map.has(a.parent_code)) map.set(a.parent_code, []);
    map.get(a.parent_code)!.push(a);
  }
  for (const list of map.values()) list.sort((a, b) => a.code.localeCompare(b.code));
  return map;
}

function matches(account: Account, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return account.code.toLowerCase().includes(q) || account.name.toLowerCase().includes(q);
}

export function AccountTree({
  accounts,
  selectedCode,
  onSelect,
  search,
}: {
  accounts: Account[];
  selectedCode: string | null;
  onSelect: (account: Account) => void;
  search: string;
}) {
  const classified = useMemo(() => accounts.filter((a) => a.category !== null), [accounts]);
  const legacy = useMemo(() => accounts.filter((a) => a.category === null), [accounts]);
  const childrenMap = useMemo(() => buildChildrenMap(classified), [classified]);
  const byCode = useMemo(() => new Map(accounts.map((a) => [a.code, a])), [accounts]);

  const roots = useMemo(() => {
    const list = classified.filter((a) => !a.parent_code);
    return list.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category as (typeof CATEGORY_ORDER)[number]);
      const bi = CATEGORY_ORDER.indexOf(b.category as (typeof CATEGORY_ORDER)[number]);
      if (ai !== bi) return ai - bi;
      return a.code.localeCompare(b.code);
    });
  }, [classified]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(roots.map((r) => r.code)));

  // Auto-expand ancestor chains of search matches so results are always visible.
  useEffect(() => {
    if (!search.trim()) return;
    const toExpand = new Set<string>();
    for (const a of classified) {
      if (!matches(a, search)) continue;
      let cursor = a.parent_code;
      while (cursor) {
        toExpand.add(cursor);
        cursor = byCode.get(cursor)?.parent_code ?? null;
      }
    }
    if (toExpand.size > 0) {
      setExpanded((prev) => new Set([...prev, ...toExpand]));
    }
  }, [search, classified, byCode]);

  function toggle(code: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function renderNode(account: Account): React.ReactNode {
    const children = childrenMap.get(account.code) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expanded.has(account.code);
    const isSelected = account.code === selectedCode;
    const isMatch = matches(account, search);

    return (
      <div key={account.id}>
        <button
          type="button"
          onClick={() => onSelect(account)}
          style={{ paddingLeft: `${(account.level ?? 1) * 14}px` }}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
            isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
            isMatch && !isSelected && "bg-amber-100/60 dark:bg-amber-400/10",
          )}
        >
          <span
            role={hasChildren ? "button" : undefined}
            onClick={(e) => {
              if (!hasChildren) return;
              e.stopPropagation();
              toggle(account.code);
            }}
            className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )
            ) : null}
          </span>
          {account.account_type === "คุม" ? (
            <Folder className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">
            <span className="text-muted-foreground">{account.code}</span>{" "}
            <span>{account.name}</span>
          </span>
        </button>
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>{roots.map((root) => renderNode(root))}</div>

      {legacy.length > 0 && (
        <div>
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            ยังไม่จัดหมวดหมู่ ({legacy.length} รายการเดิม)
          </div>
          {legacy
            .slice()
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((account) => {
              const isSelected = account.code === selectedCode;
              const isMatch = matches(account, search);
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => onSelect(account)}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 pl-3.5 text-left text-sm transition-colors",
                    isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                    isMatch && !isSelected && "bg-amber-100/60 dark:bg-amber-400/10",
                  )}
                >
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    <span className="text-muted-foreground">{account.code}</span>{" "}
                    <span>{account.name}</span>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
