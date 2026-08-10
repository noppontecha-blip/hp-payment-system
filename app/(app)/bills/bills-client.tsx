"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { FilterField, filterTriggerClassName } from "@/components/shared/filter-field";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryTag } from "@/components/shared/category-tag";
import { deriveDocumentStatus, documentStatusTone } from "@/lib/utils/document-status";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];
type BillPayment = Database["public"]["Tables"]["bill_payments"]["Row"];

const ALL = "__all__";

// Category tabs mirror the "บันทึกรายจ่ายใหม่" categories the create-menu links to
// (?category= slugs match app/(app)/bills/new/page.tsx's CATEGORY_DEFAULTS) — this page is now
// the single hub for both browsing and creating bills per category, so the two no longer duplicate.
const CATEGORIES: { key: string; label: string; expenseGroup: Line["expense_group"] | null }[] = [
  { key: "all", label: "ทั้งหมด", expenseGroup: null },
  { key: "vehicle-cost", label: "ต้นทุนรายคัน", expenseGroup: "ต้นทุนรายคัน" },
  { key: "sga", label: "ค่าใช้จ่ายขายและบริหาร", expenseGroup: "ค่าใช้จ่ายขายและบริหาร" },
  { key: "asset", label: "สินทรัพย์", expenseGroup: "สินทรัพย์" },
];

export function BillsClient({
  lines,
  vendors,
  payments,
}: {
  lines: Line[];
  vendors: Vendor[];
  payments: BillPayment[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [workType, setWorkType] = useState(ALL);
  const [vendorId, setVendorId] = useState(ALL);
  const [documentType, setDocumentType] = useState(ALL);
  const [whtFilter, setWhtFilter] = useState(ALL);

  const paidByHpNumber = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      map.set(p.hp_number, (map.get(p.hp_number) ?? 0) + p.amount);
    }
    return map;
  }, [payments]);

  const netByHpNumber = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lines) {
      map.set(l.hp_number, (map.get(l.hp_number) ?? 0) + l.net_paid_amount);
    }
    return map;
  }, [lines]);

  function statusForLine(line: Line) {
    const netTotal = netByHpNumber.get(line.hp_number) ?? line.net_paid_amount;
    const paidFromPayments = paidByHpNumber.get(line.hp_number) ?? 0;
    const paidTotal = paidFromPayments > 0 ? paidFromPayments : line.payment_date ? netTotal : 0;
    return deriveDocumentStatus({
      isDraft: line.is_draft,
      isCancelled: line.is_cancelled,
      documentType: line.document_type,
      netTotal,
      paidTotal,
    });
  }

  // นับเป็นจำนวน "เอกสาร" (HP เลขที่ต่างกัน) ไม่ใช่จำนวนรายการย่อย — ให้ตรงกับตารางที่ยุบเหลือ
  // 1 แถวต่อ HP ด้านล่าง ไม่งั้นตัวเลขที่แท็บกับจำนวนแถวที่เห็นจะไม่ตรงกัน
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of CATEGORIES) {
      const matching = c.expenseGroup ? lines.filter((l) => l.expense_group === c.expenseGroup) : lines;
      counts.set(c.key, new Set(matching.map((l) => l.hp_number)).size);
    }
    return counts;
  }, [lines]);

  const filtered = useMemo(() => {
    const activeCategory = CATEGORIES.find((c) => c.key === category);
    const q = search.trim().toLowerCase();
    return lines.filter((line) => {
      if (activeCategory?.expenseGroup && line.expense_group !== activeCategory.expenseGroup) return false;
      if (from && line.transaction_date < from) return false;
      if (to && line.transaction_date > to) return false;
      if (workType !== ALL && line.work_type !== workType) return false;
      if (vendorId !== ALL && line.vendor_id !== vendorId) return false;
      if (documentType !== ALL && line.document_type !== documentType) return false;
      if (whtFilter === "yes" && !line.requires_wht) return false;
      if (whtFilter === "no" && line.requires_wht) return false;
      if (
        q &&
        !`${line.hp_number} ${line.vendor_name_snapshot} ${line.description}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [lines, category, search, from, to, workType, vendorId, documentType, whtFilter]);

  // เอกสารเดียว (HP เลขเดียวกัน) มีได้หลายรายการย่อย — ตารางสรุปนี้ยุบให้เหลือ 1 แถวต่อ HP โดยยอด
  // เงินรวมของแถวคือผลรวมของรายการย่อยที่ผ่านตัวกรองอยู่ (ไม่ใช่ทั้งเอกสาร) ให้สอดคล้องกับแท็บหมวด
  // ที่กรองเป็นรายการย่อยเช่นกัน ส่วนรายละเอียด/หมวดที่โชว์ใช้ของรายการแรกในเอกสารนั้น
  const groupedRows = useMemo(() => {
    const map = new Map<string, Line[]>();
    for (const line of filtered) {
      const group = map.get(line.hp_number);
      if (group) group.push(line);
      else map.set(line.hp_number, [line]);
    }
    return Array.from(map.values()).map((group) => ({
      hpNumber: group[0].hp_number,
      first: group[0],
      lineCount: group.length,
      amountBeforeVat: group.reduce((sum, l) => sum + l.amount_before_vat, 0),
      vatAmount: group.reduce((sum, l) => sum + l.vat_amount, 0),
      whtAmount: group.reduce((sum, l) => sum + (l.requires_wht ? (l.wht_amount ?? 0) : 0), 0),
      netPaidAmount: group.reduce((sum, l) => sum + l.net_paid_amount, 0),
      requiresWht: group.some((l) => l.requires_wht),
    }));
  }, [filtered]);

  function handleExport() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (workType !== ALL) params.set("workType", workType);
    if (vendorId !== ALL) params.set("vendorId", vendorId);
    if (documentType !== ALL) params.set("documentType", documentType);
    if (whtFilter !== ALL) params.set("wht", whtFilter);
    if (search.trim()) params.set("search", search.trim());
    window.location.href = `/api/bills/export?${params.toString()}`;
  }

  return (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              category === c.key
                ? "border-navy text-navy"
                : "border-transparent text-muted-foreground hover:text-ink",
            )}
          >
            {c.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[11px] font-mono",
                category === c.key ? "bg-navy text-white" : "bg-muted text-muted-foreground",
              )}
            >
              {categoryCounts.get(c.key) ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <FilterField label="ค้นหา" className="w-64">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="เลข HP, ผู้จำหน่าย, รายละเอียด..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-[8px] pl-8 text-[12.5px]"
            />
          </div>
        </FilterField>
        <FilterField label="จากวันที่" className="w-40">
          <ThaiDatePicker value={from} onChange={setFrom} className={filterTriggerClassName} />
        </FilterField>
        <FilterField label="ถึงวันที่" className="w-40">
          <ThaiDatePicker value={to} onChange={setTo} className={filterTriggerClassName} />
        </FilterField>
        <FilterField label="ประเภทงาน" className="w-40">
          <Select value={workType} onValueChange={(v) => setWorkType(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="ประเภทงาน">
                {(value: string) => (value === ALL ? "ทุกประเภทงาน" : value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกประเภทงาน</SelectItem>
              <SelectItem value="ปกติ">ปกติ</SelectItem>
              <SelectItem value="สร้างสินทรัพย์">สร้างสินทรัพย์</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="ผู้จำหน่าย" className="w-48">
          <Select value={vendorId} onValueChange={(v) => setVendorId(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="ผู้จำหน่าย">
                {(value: string) =>
                  value === ALL ? "ทุกผู้จำหน่าย" : (vendors.find((v) => v.id === value)?.name ?? undefined)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกผู้จำหน่าย</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="เอกสารซื้อ" className="w-52">
          <Select value={documentType} onValueChange={(v) => setDocumentType(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="เอกสารซื้อ">
                {(value: string) => (value === ALL ? "ทุกสถานะเอกสาร" : value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสถานะเอกสาร</SelectItem>
              <SelectItem value="ใบกำกับภาษี">ใบกำกับภาษี</SelectItem>
              <SelectItem value="บิลเงินสด">บิลเงินสด</SelectItem>
              <SelectItem value="ยังไม่มีเอกสาร">ยังไม่มีเอกสาร</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="หัก ณ ที่จ่าย" className="w-44">
          <Select value={whtFilter} onValueChange={(v) => setWhtFilter(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="หัก ณ ที่จ่าย">
                {(value: string) =>
                  value === ALL ? "ทั้งหมด" : value === "yes" ? "ต้องหัก" : "ไม่ต้องหัก"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทั้งหมด</SelectItem>
              <SelectItem value="yes">ต้องหัก</SelectItem>
              <SelectItem value="no">ไม่ต้องหัก</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            ส่งออก Excel
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button />}>
              <Plus className="size-4" />
              สร้างเอกสาร
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/bills/new?category=vehicle-cost")}>
                ต้นทุนรายคัน
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/bills/new?category=sga")}>
                ค่าใช้จ่ายขายและบริหาร
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/bills/new?category=asset")}>
                สินทรัพย์
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgba(20,25,40,.03)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                <TableHead>เลข HP</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้จำหน่าย</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead className="text-right">ก่อน VAT</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">หัก ณ ที่จ่าย</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-2">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
              {groupedRows.map((row) => {
                const line = row.first;
                return (
                  <TableRow
                    key={row.hpNumber}
                    onClick={() => router.push(`/bills/${row.hpNumber}/edit`)}
                    className={cn(
                      "cursor-pointer text-xs font-normal hover:bg-[#F5F7FB]",
                      line.is_cancelled && "opacity-50 grayscale",
                      !line.is_cancelled && line.document_type === "ยังไม่มีเอกสาร" && "bg-warn-bg/40",
                    )}
                  >
                    <TableCell className="font-mono">{row.hpNumber}</TableCell>
                    <TableCell className="font-mono">{formatThaiDate(line.transaction_date)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/bills/${row.hpNumber}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-normal text-navy underline decoration-navy/30 underline-offset-2"
                      >
                        {line.vendor_name_snapshot}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">
                      {line.description}
                      {row.lineCount > 1 && (
                        <span className="ml-1.5 text-muted-2">+{row.lineCount - 1} รายการ</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <CategoryTag label={line.expense_group} />
                        {line.cost_subtype && (
                          <CategoryTag label={line.cost_subtype} className="border-ink/10 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.amountBeforeVat)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(row.vatAmount)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {row.requiresWht ? formatCurrency(row.whtAmount) : "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(row.netPaidAmount)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = statusForLine(line);
                        return <StatusBadge label={status} tone={documentStatusTone(status)} />;
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
