import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { formatThaiDate } from "@/lib/utils/thai-date";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const supabase = await createClient();
  const { data: allLines, error } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("document_type", "ใบกำกับภาษี")
    .not("document_invoice_date", "is", null)
    .eq("vat_non_claimable", false)
    .order("hp_number", { ascending: true });
  if (error) return new Response(error.message, { status: 500 });

  // เดือนที่ยื่นภาษีซื้อจริงยึดวันที่ได้รับใบกำกับภาษี (document_received_date) ถ้ามีการบันทึกไว้ —
  // เพราะใบกำกับมักมาถึงช้ากว่าวันที่พิมพ์บนใบกำกับ — ไม่งั้น fallback ไปใช้ document_invoice_date
  // เหมือนเดิม (รายการเก่าที่ยังไม่เคยบันทึกวันที่ได้รับ). ทั้งสองเป็นคอลัมน์ `date` ธรรมดา — Postgres/
  // PostgREST ไม่มี LIKE สำหรับ date เลยกรองปี/เดือนฝั่ง client จาก string "YYYY-MM-DD" แทน
  const filingDate = (l: (typeof allLines)[number]) => l.document_received_date ?? l.document_invoice_date;
  const yearStr = year ? year : null;
  const monthStr = month ? String(Number(month)).padStart(2, "0") : null;
  const lines = (allLines ?? []).filter((l) => {
    const d = filingDate(l);
    if (!d) return false;
    if (yearStr && d.slice(0, 4) !== yearStr) return false;
    if (monthStr && d.slice(5, 7) !== monthStr) return false;
    return true;
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("รายงานภาษีซื้อ");
  sheet.columns = [
    { header: "เลข HP", key: "hp_number", width: 14 },
    { header: "วันที่ใบกำกับภาษี", key: "date", width: 16 },
    { header: "วันที่ได้รับ", key: "received_date", width: 16 },
    { header: "เลขที่เอกสาร", key: "document_number", width: 18 },
    { header: "ผู้จำหน่าย", key: "vendor", width: 30 },
    { header: "ก่อน VAT", key: "amount_before_vat", width: 14 },
    { header: "VAT", key: "vat_amount", width: 12 },
    { header: "รวม", key: "total", width: 14 },
  ];

  let totalBeforeVat = 0;
  let totalVat = 0;
  lines.forEach((l) => {
    totalBeforeVat += l.amount_before_vat;
    totalVat += l.vat_amount;
    sheet.addRow({
      hp_number: l.hp_number,
      date: formatThaiDate(l.document_invoice_date),
      received_date: l.document_received_date ? formatThaiDate(l.document_received_date) : "-",
      document_number: l.document_number ?? "",
      vendor: l.vendor_name_snapshot,
      amount_before_vat: l.amount_before_vat,
      vat_amount: l.vat_amount,
      total: l.amount_before_vat + l.vat_amount,
    });
  });
  sheet.getRow(1).font = { bold: true };

  const totalRow = sheet.addRow({
    hp_number: "",
    date: "",
    received_date: "",
    document_number: "",
    vendor: "ยอดรวม",
    amount_before_vat: totalBeforeVat,
    vat_amount: totalVat,
    total: totalBeforeVat + totalVat,
  });
  totalRow.font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="tax-report.xlsx"',
    },
  });
}
