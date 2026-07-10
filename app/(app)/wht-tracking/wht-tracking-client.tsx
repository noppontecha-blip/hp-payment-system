"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Clock, FileCheck2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { issueWhtCertificate } from "@/lib/actions/bills";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];

export function WhtTrackingClient({ lines }: { lines: Line[] }) {
  const [isPending, startTransition] = useTransition();
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const pending = lines.filter((l) => !l.wht_issue_date);
  const issued = lines.filter((l) => l.wht_issue_date);
  const pendingTotal = pending.reduce((sum, l) => sum + (l.wht_amount ?? 0), 0);

  function handleIssue(lineId: string) {
    setIssuingId(lineId);
    startTransition(async () => {
      try {
        await issueWhtCertificate(lineId);
        toast.success("ออกใบหัก ณ ที่จ่ายแล้ว");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setIssuingId(null);
      }
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="รอออกหนังสือ"
          value={`${pending.length} รายการ`}
          icon={<Clock className="size-4" />}
          accent="amber"
        />
        <KpiCard
          label="มูลค่ารวมที่รอออก"
          value={formatCurrency(pendingTotal)}
          icon={<Wallet className="size-4" />}
          accent="amber"
        />
        <KpiCard
          label="ออกแล้ว"
          value={`${issued.length} รายการ`}
          icon={<FileCheck2 className="size-4" />}
          accent="success"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>เลข HP</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>ชื่อผู้รับเงิน</TableHead>
                <TableHead className="text-right">ยอดหัก ณ ที่จ่าย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-32 text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    ไม่มีรายการที่ต้องหัก ณ ที่จ่าย
                  </TableCell>
                </TableRow>
              )}
              {lines.map((line) => (
                <TableRow key={line.id} className={!line.wht_issue_date ? "bg-amber/5" : undefined}>
                  <TableCell className="font-medium">{line.hp_number}</TableCell>
                  <TableCell>{formatThaiDate(line.transaction_date)}</TableCell>
                  <TableCell>{line.vendor_name_snapshot}</TableCell>
                  <TableCell className="max-w-56 truncate">{line.description}</TableCell>
                  <TableCell>{line.wht_payee_name || line.vendor_name_snapshot}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.wht_amount ?? 0)}</TableCell>
                  <TableCell>
                    {line.wht_issue_date ? (
                      <StatusBadge label={`ออกแล้ว ${formatThaiDate(line.wht_issue_date)}`} tone="success" />
                    ) : (
                      <StatusBadge label="รอออกหนังสือ" tone="warning" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!line.wht_issue_date && (
                      <Button
                        size="sm"
                        onClick={() => handleIssue(line.id)}
                        disabled={isPending && issuingId === line.id}
                      >
                        ออกใบหัก
                      </Button>
                    )}
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
