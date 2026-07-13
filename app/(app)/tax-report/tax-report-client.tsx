"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterField, filterTriggerClassName } from "@/components/shared/filter-field";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate, parseISODate, toBEYear } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];

const ALL = "__all__";
const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export function TaxReportClient({ lines }: { lines: Line[] }) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));

  const years = useMemo(() => {
    const set = new Set(lines.map((l) => parseISODate(l.document_invoice_date as string).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [lines, now]);

  const filtered = useMemo(() => {
    return lines.filter((l) => {
      const d = parseISODate(l.document_invoice_date as string);
      if (year !== ALL && d.getFullYear() !== Number(year)) return false;
      if (month !== ALL && d.getMonth() + 1 !== Number(month)) return false;
      return true;
    });
  }, [lines, year, month]);

  const totals = filtered.reduce(
    (acc, l) => ({
      beforeVat: acc.beforeVat + l.amount_before_vat,
      vat: acc.vat + l.vat_amount,
      total: acc.total + l.amount_before_vat + l.vat_amount,
    }),
    { beforeVat: 0, vat: 0, total: 0 },
  );

  function handleExport() {
    const params = new URLSearchParams();
    if (year !== ALL) params.set("year", year);
    if (month !== ALL) params.set("month", month);
    window.location.href = `/api/tax-report/export?${params.toString()}`;
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="ปี" className="w-36">
          <Select value={year} onValueChange={(v) => setYear(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="ปี">
                {(value: string) => (value === ALL ? "ทุกปี" : toBEYear(Number(value)))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกปี</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {toBEYear(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="เดือน" className="w-44">
          <Select value={month} onValueChange={(v) => setMonth(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="เดือน">
                {(value: string) => (value === ALL ? "ทุกเดือน" : THAI_MONTHS[Number(value) - 1])}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกเดือน</SelectItem>
              {THAI_MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <Button variant="outline" className="ml-auto" onClick={handleExport}>
          <Download className="size-4" />
          ส่งออก Excel
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,25,40,.03)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                <TableHead>เลข HP</TableHead>
                <TableHead>วันที่ใบกำกับภาษี</TableHead>
                <TableHead>เลขที่เอกสาร</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead className="text-right">ก่อน VAT</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">รวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-2">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((line) => (
                <TableRow key={line.id} className="text-xs font-normal">
                  <TableCell className="font-mono">{line.hp_number}</TableCell>
                  <TableCell className="font-mono">
                    {formatThaiDate(line.document_invoice_date)}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {line.document_number || "-"}
                  </TableCell>
                  <TableCell>{line.vendor_name_snapshot}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(line.amount_before_vat)}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(line.vat_amount)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(line.amount_before_vat + line.vat_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {filtered.length > 0 && (
              <TableFooter>
                <TableRow className="font-semibold text-ink">
                  <TableCell colSpan={4}>ยอดรวม</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals.beforeVat)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals.vat)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(totals.total)}</TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
