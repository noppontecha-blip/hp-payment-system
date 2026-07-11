"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileClock, FileText, ReceiptText, Wallet } from "lucide-react";
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
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];

const DONUT_COLORS = ["#F5A623", "#1B2A4E", "#2563EB", "#15803D", "#B45309", "#9333EA", "#94A3B8"];

export function DashboardClient({
  billsThisMonth,
  billsThisYear,
  netPaidThisYear,
  pendingDocCount,
  pendingWhtCount,
  monthlySeries,
  categorySeries,
  recentLines,
}: {
  billsThisMonth: number;
  billsThisYear: number;
  netPaidThisYear: number;
  pendingDocCount: number;
  pendingWhtCount: number;
  monthlySeries: { month: string; total: number }[];
  categorySeries: { name: string; total: number }[];
  recentLines: Line[];
}) {
  const router = useRouter();
  return (
    <div className="space-y-5 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="จำนวนบิล HP (เดือนนี้)"
          value={`${billsThisMonth} บิล`}
          trend={`ปีนี้: ${billsThisYear} บิล`}
          icon={<ReceiptText className="size-4" />}
          accent="info"
        />
        <KpiCard
          label="ยอดจ่ายสุทธิรวม (ปีนี้)"
          value={formatCurrency(netPaidThisYear)}
          icon={<Wallet className="size-4" />}
          accent="info"
        />
        <KpiCard
          label="บิลที่รอเอกสารจากสนง.บัญชี"
          value={`${pendingDocCount} บิล`}
          icon={<FileText className="size-4" />}
          accent="warn"
        />
        <KpiCard
          label="ใบหัก ณ ที่จ่ายที่รอออก"
          value={`${pendingWhtCount} รายการ`}
          icon={<FileClock className="size-4" />}
          accent="warn"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-ink">ยอดจ่ายรายเดือน</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={70} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="total" fill="#F5A623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-4 text-sm font-medium text-ink">สัดส่วนตามหมวดบัญชี</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categorySeries}
                dataKey="total"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {categorySeries.map((entry, index) => (
                  <Cell key={entry.name} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,25,40,.03)]">
        <div className="border-b border-border p-4">
          <p className="text-sm font-medium text-ink">รายการล่าสุด</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                <TableHead>เลข HP</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
                <TableHead>สถานะเอกสาร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLines.map((line) => (
                <TableRow
                  key={line.id}
                  onClick={() => router.push(`/bills/${line.hp_number}/edit`)}
                  className="cursor-pointer hover:bg-[#F5F7FB]"
                >
                  <TableCell className="font-mono">{line.hp_number}</TableCell>
                  <TableCell className="font-mono">{formatThaiDate(line.transaction_date)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/bills/${line.hp_number}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-navy underline decoration-navy/30 underline-offset-2"
                    >
                      {line.vendor_name_snapshot}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 truncate">{line.description}</TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(line.net_paid_amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={line.accounting_office_doc_status}
                      tone={docStatusTone(line.accounting_office_doc_status)}
                    />
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
