"use client";

import { useRouter } from "next/navigation";
import { FileCheck2, FileWarning, Wallet } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard } from "@/components/shared/kpi-card";
import { StatusBadge, docStatusTone } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];

export function DocumentTrackingClient({ lines }: { lines: Line[] }) {
  const router = useRouter();

  const pending = lines.filter((l) => l.document_type === "ยังไม่มีเอกสาร");
  const received = lines.filter((l) => l.document_type !== "ยังไม่มีเอกสาร");
  const pendingHpCount = new Set(pending.map((l) => l.hp_number)).size;
  const pendingTotal = pending.reduce((sum, l) => sum + l.net_paid_amount, 0);

  return (
    <div className="space-y-5 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <TableRow className="bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                <TableHead>เลข HP</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
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
              {lines.map((line) => (
                <TableRow
                  key={line.id}
                  onClick={() => router.push(`/bills/${line.hp_number}/edit`)}
                  className={cn(
                    "cursor-pointer hover:bg-[#F5F7FB]",
                    line.document_type === "ยังไม่มีเอกสาร" && "bg-warn-bg/40",
                  )}
                >
                  <TableCell className="font-mono font-medium">{line.hp_number}</TableCell>
                  <TableCell className="font-mono">{formatThaiDate(line.transaction_date)}</TableCell>
                  <TableCell>{line.vendor_name_snapshot}</TableCell>
                  <TableCell className="max-w-56 truncate">{line.description}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(line.net_paid_amount)}</TableCell>
                  <TableCell>
                    <StatusBadge label={line.document_type} tone={docStatusTone(line.document_type)} />
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {line.document_number || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
