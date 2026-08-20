import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { WhtCertificateDocument } from "@/lib/pdf/wht-certificate-document";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hpNumber: string }> },
) {
  const { hpNumber } = await params;
  const supabase = await createClient();

  const { data: lines, error: linesError } = await supabase
    .from("hp_payment_lines")
    .select("*")
    .eq("hp_number", hpNumber);
  if (linesError) return NextResponse.json({ message: linesError.message }, { status: 500 });
  if (!lines || lines.length === 0) {
    return NextResponse.json({ message: "ไม่พบบิลนี้" }, { status: 404 });
  }

  const first = lines[0];
  if (!first.requires_wht) {
    return NextResponse.json({ message: "บิลนี้ไม่ได้ระบุว่าต้องหัก ณ ที่จ่าย" }, { status: 400 });
  }

  const { data: vendor } = first.vendor_id
    ? await supabase.from("vendors").select("*").eq("id", first.vendor_id).single()
    : { data: null };
  if (!vendor || !vendor.tax_id || !vendor.vendor_type) {
    return NextResponse.json(
      { message: "ข้อมูลผู้จำหน่าย (เลขประจำตัวผู้เสียภาษี/ประเภทผู้จำหน่าย) ยังไม่ครบ กรุณากรอกในหน้าผู้จำหน่ายก่อน" },
      { status: 400 },
    );
  }

  const { data: company } = await supabase.from("company_profile").select("*").limit(1).single();
  if (!company) {
    return NextResponse.json(
      { message: "ยังไม่ได้ตั้งค่าข้อมูลบริษัทที่ /settings" },
      { status: 400 },
    );
  }

  // แต่ละรายการย่อยที่ต้องหัก ณ ที่จ่ายขึ้นเป็นแถวของตัวเองในหนังสือรับรอง — ก่อนหน้านี้รวมทุกรายการ
  // เป็นแถวเดียว ทำให้เอกสารดูเหมือน "รายการหาย" เมื่อบิลมีหลายรายการย่อย
  const whtLines = lines.filter((l) => l.requires_wht);
  const categoryIds = Array.from(
    new Set(whtLines.map((l) => l.wht_category_id).filter((id): id is string => !!id)),
  );
  const { data: whtCategories } = categoryIds.length > 0
    ? await supabase.from("wht_categories").select("*").in("id", categoryIds)
    : { data: [] };
  const categoryMap = new Map((whtCategories ?? []).map((c) => [c.id, c.name]));

  const buffer = await renderToBuffer(
    <WhtCertificateDocument
      data={{
        hpNumber,
        transactionDate: first.transaction_date,
        lines: whtLines.map((l) => ({
          incomeTypeLabel: l.wht_category_id ? (categoryMap.get(l.wht_category_id) ?? "อื่นๆ") : "อื่นๆ",
          paymentDate: l.payment_date ?? l.transaction_date,
          amountBeforeVat: l.amount_before_vat || 0,
          whtRatePct: l.wht_rate_pct,
          whtAmount: l.wht_amount || 0,
        })),
        company: {
          company_name: company.company_name,
          tax_id: company.tax_id,
          branch: company.branch,
          registered_address: company.registered_address,
          authorized_signer_name: company.authorized_signer_name,
        },
        vendor: {
          name: vendor.wht_certificate_name || vendor.name,
          tax_id: vendor.tax_id,
          vendor_type: vendor.vendor_type,
          registered_address: vendor.registered_address,
          branchLabel:
            vendor.branch_type === "สาขา"
              ? `สาขา ${vendor.branch_code ?? "-"}`
              : vendor.branch_type === "สำนักงานใหญ่"
                ? "สำนักงานใหญ่"
                : null,
        },
      }}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="50twi-${hpNumber}.pdf"`,
    },
  });
}
