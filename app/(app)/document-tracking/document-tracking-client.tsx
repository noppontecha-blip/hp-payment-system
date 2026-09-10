"use client";

import { useMemo, useState } from "react";
import { FileCheck2, FileWarning, Wallet, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SortableTableHead, type SortDirection } from "@/components/shared/sortable-table-head";
import { BillDetailDrawer } from "@/components/bills/bill-detail-drawer";
import { derivePurchaseDocLabel, purchaseDocLabelTone } from "@/lib/utils/document-status";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];

export function DocumentTrackingClient({ lines }: { lines: Line[] }) {
  const [selectedHp, setSelectedHp] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"hpNumber" | "date" | "vendor" | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  function toggleSort(key: "hpNumber" | "date" | "vendor") {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedLines = useMemo(() => {
    if (!sortKey) return lines;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...lines].sort((a, b) => {
      if (sortKey === "hpNumber") return a.hp_number.localeCompare(b.hp_number) * dir;
      if (sortKey === "date")
        return (a.transaction_date < b.transaction_date ? -1 : a.transaction_date > b.transaction_date ? 1 : 0) * dir;
      return a.vendor_name_snapshot.localeCompare(b.vendor_name_snapshot) * dir;
    });
  }, [lines, sortKey, sortDir]);

  const pending = useMemo(() => lines.filter((l) => l.document_type === "ยังไม่มีเอกสาร"), [lines]);
  const received = lines.filter((l) => l.document_type !== "ยังไม่มีเอกสาร");
  const pendingHpCount = new Set(pending.map((l) => l.hp_number)).size;
  const pendingTotal = pending.reduce((sum, l) => sum + l.net_paid_amount, 0);
  // จ่ายเงินไปแล้วแต่ยังไม่ได้ใบกำกับภาษี — เร่งด่วนกว่ารายการที่ยังไม่ได้จ่ายเงิน เพราะเงินออกไปแล้ว
  // แต่ยังยื่นภาษีซื้อไม่ได้จนกว่าจะได้ใบกำกับจริง
  const pendingPaidCount = pending.filter((l) => l.payment_date != null).length;

  return (
    <div className="space-y-5 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <KpiCard
          label="จ่ายแล้ว แต่ยังไม่ได้ใบกำกับภาษี"
          value={`${pendingPaidCount} รายการ`}
          icon={<AlertTriangle className="size-4" />}
          accent="danger"
          trend="เร่งด่วน — เสี่ยงยื่นภาษีซื้อไม่ทัน"
        />
        <KpiCard
          label="เลข HP ที่ยังตามเอกสารไม่ครบ"
          value={`${pendingHpCount} เลข`}
          icon={<FileWarning className="size-4" />}
          accent="warn"
        />
        <KpiCard
          label="มูลค่ารวมที่ยังไม่มีเอกสาร"
          value={formatCurrency(pendingTotal)}
          icon={<Wallet className="size-4" />}
          accent="warn"
        />
        <KpiCard
          label="มีเอกสารแล้ว"
          value={`${received.length} รายการ`}
          icon={<FileCheck2 className="size-4" />}
          accent="success"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-tint hover:bg-surface-tint">
                <SortableTableHead label="เลข HP" sortKey="hpNumber" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableTableHead label="วันที่" sortKey="date" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <SortableTableHead label="ผู้จำหน่าย" sortKey="vendor" activeKey={sortKey} direction={sortDir} onSort={toggleSort} />
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
                <TableHead>เอกสารซื้อ</TableHead>
                <TableHead>เลขที่เอกสาร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    ไม่มีรายการ
                  </TableCell>
                </TableRow>
              )}
              {sortedLines.map((line) => {
                const docLabel = derivePurchaseDocLabel({
                  documentType: line.document_type,
                  expectedDocumentType: line.expected_document_type,
                });
                return (
                  <TableRow
                    key={line.id}
                    onClick={() => setSelectedHp(line.hp_number)}
                    className={cn(
                      "cursor-pointer hover:bg-surface-tint",
                      line.document_type === "ยังไม่มีเอกสาร" && "bg-warn-bg/40",
                    )}
                  >
                    <TableCell className="font-mono font-medium">{line.hp_number}</TableCell>
                    <TableCell className="font-mono">{formatThaiDate(line.transaction_date)}</TableCell>
                    <TableCell>{line.vendor_name_snapshot}</TableCell>
                    <TableCell className="max-w-56 truncate">{line.description}</TableCell>
                    <TableCell className="text-right font-mono font-semibold tabular-nums">{formatCurrency(line.net_paid_amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge label={docLabel} tone={purchaseDocLabelTone(docLabel)} />
                        {line.document_type === "ยังไม่มีเอกสาร" && line.payment_date != null && (
                          <StatusBadge label="จ่ายแล้ว" tone="danger" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {line.document_number || "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <BillDetailDrawer hpNumber={selectedHp} onClose={() => setSelectedHp(null)} />
    </div>
  );
}
