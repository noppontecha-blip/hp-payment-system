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

  const amountBeforeVat = lines.reduce((sum, l) => sum + (l.amount_before_vat || 0), 0);
  const whtAmount = lines.reduce((sum, l) => sum + (l.wht_amount || 0), 0);

  const { data: whtCategory } = first.wht_category_id
    ? await supabase.from("wht_categories").select("*").eq("id", first.wht_category_id).single()
    : { data: null };

  const buffer = await renderToBuffer(
    <WhtCertificateDocument
      data={{
        hpNumber,
        paymentDate: first.payment_date ?? first.transaction_date,
        incomeTypeLabel: whtCategory?.name ?? "อื่นๆ",
        amountBeforeVat,
        whtRatePct: first.wht_rate_pct,
        whtAmount,
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
