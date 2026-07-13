import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { formatThaiDate } from "@/lib/utils/thai-date";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const supabase = await createClient();
  let query = supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("document_type", "ใบกำกับภาษี")
    .not("document_invoice_date", "is", null)
    .order("hp_number", { ascending: true });

  if (year) {
    const y = Number(year);
    query = query.gte("document_invoice_date", `${y}-01-01`).lte("document_invoice_date", `${y}-12-31`);
  }

  const { data: allLines, error } = await query;
  if (error) return new Response(error.message, { status: 500 });

  // document_invoice_date is a `date` column — PostgREST/Postgres has no LIKE operator for it,
  // so filter by month client-side on the "YYYY-MM-DD" string instead of pushing it to the query.
  const monthStr = month ? String(Number(month)).padStart(2, "0") : null;
  const lines = monthStr
    ? (allLines ?? []).filter((l) => l.document_invoice_date?.slice(5, 7) === monthStr)
    : (allLines ?? []);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("รายงานภาษีซื้อ");
  sheet.columns = [
    { header: "เลข HP", key: "hp_number", width: 14 },
    { header: "วันที่ใบกำกับภาษี", key: "date", width: 16 },
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
