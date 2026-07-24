import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { BillDocument } from "@/lib/pdf/bill-document";
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

  const buffer = await renderToBuffer(
    <BillDocument
      data={{
        hpNumber: data.hpNumber,
        transactionDate: data.transactionDate,
        documentNumber: data.documentNumber,
        company: {
          company_name: data.company.company_name,
          tax_id: data.company.tax_id,
          registered_address: data.company.registered_address,
        },
        vendor: {
          name: data.vendor.name,
          code: data.vendor.code,
          tax_id: data.vendor.tax_id,
          address: data.vendor.address,
        },
        lines: data.lines.map((l) => ({
          description: l.description,
          accountLabel: l.accountLabel,
          vehicleLabel: l.vehicleLabel,
          amountBeforeVat: l.amountBeforeVat,
          vatAmount: l.vatAmount,
        })),
        totals: data.totals,
        requiresWht: data.requiresWht,
        payments: data.payments,
        headerPaymentMethod: data.headerPaymentMethod,
        headerPaymentDate: data.headerPaymentDate,
        notes: data.notes,
        isCancelled: data.isCancelled,
      }}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bill-${hpNumber}.pdf"`,
    },
  });
}
