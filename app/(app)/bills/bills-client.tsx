"use client";

import Link from "next/link";
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
import { StatusBadge, docStatusTone } from "@/components/shared/status-badge";
import { CategoryTag } from "@/components/shared/category-tag";
import { formatCurrency } from "@/lib/utils/format";
import { formatThaiDate } from "@/lib/utils/thai-date";
import type { Database } from "@/lib/types/database";

type Line = Database["public"]["Tables"]["hp_payment_lines"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

const ALL = "__all__";

export function BillsClient({ lines, vendors }: { lines: Line[]; vendors: Vendor[] }) {
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
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลข HP, ผู้จำหน่าย, รายละเอียด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="w-40">
          <ThaiDatePicker value={from} onChange={setFrom} />
        </div>
        <div className="w-40">
          <ThaiDatePicker value={to} onChange={setTo} />
        </div>
        <Select value={workType} onValueChange={(v) => setWorkType(v ?? ALL)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ประเภทงาน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกประเภทงาน</SelectItem>
            <SelectItem value="ปกติ">ปกติ</SelectItem>
            <SelectItem value="สร้างสินทรัพย์">สร้างสินทรัพย์</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendorId} onValueChange={(v) => setVendorId(v ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="ผู้จำหน่าย" />
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
        <Select value={docStatus} onValueChange={(v) => setDocStatus(v ?? ALL)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="สถานะเอกสาร" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกสถานะเอกสาร</SelectItem>
            <SelectItem value="ครบถ้วน">ครบถ้วน</SelectItem>
            <SelectItem value="รอเอกสารจากสนง.บัญชี">รอเอกสารจากสนง.บัญชี</SelectItem>
          </SelectContent>
        </Select>
        <Select value={whtFilter} onValueChange={(v) => setWhtFilter(v ?? ALL)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="หัก ณ ที่จ่าย" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทั้งหมด</SelectItem>
            <SelectItem value="yes">ต้องหัก</SelectItem>
            <SelectItem value="no">ไม่ต้องหัก</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" />
            ส่งออก Excel
          </Button>
          <Button render={<Link href="/bills/new" />}>
            <Plus className="size-4" />
            สร้างบิลใหม่
          </Button>
        </div>
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
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    ไม่พบรายการที่ตรงกับเงื่อนไข
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((line) => (
                <TableRow
                  key={line.id}
                  className={
                    line.accounting_office_doc_status === "รอเอกสารจากสนง.บัญชี"
                      ? "bg-amber/5"
                      : undefined
                  }
                >
                  <TableCell>
                    <Link href={`/bills/${line.hp_number}/edit`} className="font-medium text-amber hover:underline">
                      {line.hp_number}
                    </Link>
                  </TableCell>
                  <TableCell>{formatThaiDate(line.transaction_date)}</TableCell>
                  <TableCell>{line.vendor_name_snapshot}</TableCell>
                  <TableCell className="max-w-64 truncate">{line.description}</TableCell>
                  <TableCell>
                    <CategoryTag label={line.work_type} />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(line.amount_before_vat)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(line.vat_amount)}</TableCell>
                  <TableCell className="text-right">
                    {line.requires_wht ? formatCurrency(line.wht_amount ?? 0) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
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
