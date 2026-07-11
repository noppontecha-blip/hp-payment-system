"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThaiDatePicker } from "@/components/shared/thai-date-picker";
import { FilterField, filterTriggerClassName } from "@/components/shared/filter-field";
import { StatusBadge, docStatusTone } from "@/components/shared/status-badge";
import { CategoryTag } from "@/components/shared/category-tag";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

const ALL = "__all__";

export function BillsClient({ lines, vendors }: { lines: Line[]; vendors: Vendor[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [workType, setWorkType] = useState(ALL);
  const [vendorId, setVendorId] = useState(ALL);
  const [docStatus, setDocStatus] = useState(ALL);
  const [whtFilter, setWhtFilter] = useState(ALL);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lines.filter((line) => {
      if (from && line.transaction_date < from) return false;
      if (to && line.transaction_date > to) return false;
      if (workType !== ALL && line.work_type !== workType) return false;
      if (vendorId !== ALL && line.vendor_id !== vendorId) return false;
      if (docStatus !== ALL && line.accounting_office_doc_status !== docStatus) return false;
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
  }, [lines, search, from, to, workType, vendorId, docStatus, whtFilter]);

  function handleExport() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (workType !== ALL) params.set("workType", workType);
    if (vendorId !== ALL) params.set("vendorId", vendorId);
    if (docStatus !== ALL) params.set("docStatus", docStatus);
    if (whtFilter !== ALL) params.set("wht", whtFilter);
    if (search.trim()) params.set("search", search.trim());
    window.location.href = `/api/bills/export?${params.toString()}`;
  }

  return (
    <div className="space-y-4 p-5">
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
        <FilterField label="สถานะเอกสาร" className="w-52">
          <Select value={docStatus} onValueChange={(v) => setDocStatus(v ?? ALL)}>
            <SelectTrigger className={cn(filterTriggerClassName, "w-full")}>
              <SelectValue placeholder="สถานะเอกสาร">
                {(value: string) => (value === ALL ? "ทุกสถานะเอกสาร" : value)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>ทุกสถานะเอกสาร</SelectItem>
              <SelectItem value="ครบถ้วน">ครบถ้วน</SelectItem>
              <SelectItem value="รอเอกสารจากสนง.บัญชี">รอเอกสารจากสนง.บัญชี</SelectItem>
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
          <Button render={<Link href="/bills/new" />} nativeButton={false}>
            <Plus className="size-4" />
            สร้างบิลใหม่
          </Button>
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
                <TableHead>ประเภทงาน</TableHead>
                <TableHead className="text-right">ก่อน VAT</TableHead>
                <TableHead className="text-right">VAT</TableHead>
                <TableHead className="text-right">หัก ณ ที่จ่าย</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
                <TableHead>สถานะเอกสาร</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-2">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((line) => (
                <TableRow
                  key={line.id}
                  onClick={() => router.push(`/bills/${line.hp_number}/edit`)}
                  className={cn(
                    "cursor-pointer text-xs font-normal hover:bg-[#F5F7FB]",
                    line.accounting_office_doc_status === "รอเอกสารจากสนง.บัญชี" && "bg-warn-bg/40",
                  )}
                >
                  <TableCell className="font-mono">{line.hp_number}</TableCell>
                  <TableCell className="font-mono">{formatThaiDate(line.transaction_date)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/bills/${line.hp_number}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-normal text-navy underline decoration-navy/30 underline-offset-2"
                    >
                      {line.vendor_name_snapshot}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-64 truncate">{line.description}</TableCell>
                  <TableCell>
                    <CategoryTag label={line.work_type} />
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(line.amount_before_vat)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(line.vat_amount)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {line.requires_wht ? formatCurrency(line.wht_amount ?? 0) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
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
