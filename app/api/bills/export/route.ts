import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { formatThaiDate } from "@/lib/utils/thai-date";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const workType = searchParams.get("workType");
  const vendorId = searchParams.get("vendorId");
  const docStatus = searchParams.get("docStatus");
  const wht = searchParams.get("wht");
  const search = searchParams.get("search");

  const supabase = await createClient();
  let query = supabase
    .from("hp_payment_lines")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  if (workType) query = query.eq("work_type", workType as "ปกติ" | "สร้างสินทรัพย์");
  if (vendorId) query = query.eq("vendor_id", vendorId);
  if (docStatus)
    query = query.eq(
      "accounting_office_doc_status",
      docStatus as "ครบถ้วน" | "รอเอกสารจากสนง.บัญชี",
    );
  if (wht === "yes") query = query.eq("requires_wht", true);
  if (wht === "no") query = query.eq("requires_wht", false);
  if (search) {
    const term = search.replace(/[%,()]/g, "");
    query = query.or(
      `hp_number.ilike.%${term}%,vendor_name_snapshot.ilike.%${term}%,description.ilike.%${term}%`,
    );
  }

  const { data: lines, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("บิลจ่าย HP");
  sheet.columns = [
    { header: "เลข HP", key: "hp_number", width: 14 },
    { header: "วันที่", key: "date", width: 12 },
    { header: "ผู้จำหน่าย", key: "vendor", width: 24 },
    { header: "รายละเอียด", key: "description", width: 32 },
    { header: "ประเภทงาน", key: "work_type", width: 14 },
    { header: "ก่อน VAT", key: "amount_before_vat", width: 14 },
    { header: "VAT", key: "vat_amount", width: 12 },
    { header: "หัก ณ ที่จ่าย", key: "wht_amount", width: 14 },
    { header: "สุทธิ", key: "net_paid_amount", width: 14 },
    { header: "สถานะเอกสาร", key: "doc_status", width: 20 },
  ];

  (lines ?? []).forEach((l) => {
    sheet.addRow({
      hp_number: l.hp_number,
      date: formatThaiDate(l.transaction_date),
      vendor: l.vendor_name_snapshot,
      description: l.description,
      work_type: l.work_type,
      amount_before_vat: l.amount_before_vat,
      vat_amount: l.vat_amount,
      wht_amount: l.requires_wht ? (l.wht_amount ?? 0) : 0,
      net_paid_amount: l.net_paid_amount,
      doc_status: l.accounting_office_doc_status,
    });
  });
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="hp-bills-export.xlsx"',
    },
  });
}
