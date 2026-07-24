import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { PaymentVoucherDocument } from "@/lib/pdf/payment-voucher-document";
import { fetchExpenseDocumentData } from "@/lib/pdf/fetch-expense-document";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hpNumber: string }> },
) {
  const { hpNumber } = await params;
  const supabase = await createClient();

  const data = await fetchExpenseDocumentData(supabase, hpNumber);
  if (!data) {
    return NextResponse.json({ message: "ไม่พบบิลนี้" }, { status: 404 });
  }

  const buffer = await renderToBuffer(<PaymentVoucherDocument data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="voucher-${hpNumber}.pdf"`,
    },
  });
}
