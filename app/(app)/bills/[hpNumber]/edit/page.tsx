import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { BillForm } from "@/components/bills/bill-form";
import type { HpBillFormValues } from "@/lib/validations/hp-line";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ hpNumber: string }>;
}) {
  const { hpNumber } = await params;
  const supabase = await createClient();

  const [
    { data: rows },
    { data: vendors },
    { data: vehicles },
    { data: accounts },
    { data: whtCategories },
  ] = await Promise.all([
    supabase
      .from("hp_payment_lines")
      .select("*")
      .eq("hp_number", hpNumber)
      .order("created_at"),
    supabase.from("vendors").select("*").order("name"),
    supabase.from("vehicles").select("*").order("code"),
    supabase.from("chart_of_accounts").select("*").order("code"),
    supabase.from("wht_categories").select("*").order("name"),
  ]);

  if (!rows || rows.length === 0) notFound();

  const first = rows[0];
  const initialValues: HpBillFormValues = {
    hp_number: first.hp_number,
    transaction_date: first.transaction_date,
    work_type: first.work_type,
    asset_construction_detail: first.asset_construction_detail,
    vendor_id: first.vendor_id,
    vendor_name_snapshot: first.vendor_name_snapshot,
    tax_invoice_number: first.tax_invoice_number,
    bill_number: first.bill_number,
    payment_account: first.payment_account,
    advance_payer_name: first.advance_payer_name,
    spk_repaid_date: first.spk_repaid_date,
    accounting_office_doc_status: first.accounting_office_doc_status,
    notes: first.notes,
    lines: rows.map((row) => ({
      id: row.id,
      description: row.description,
      account_code_id: row.account_code_id,
      vehicle_id: row.vehicle_id,
      related_vehicles_text: row.related_vehicles_text,
      amount_before_vat: row.amount_before_vat,
      vat_amount: row.vat_amount,
      requires_wht: row.requires_wht,
      wht_category_id: row.wht_category_id,
      wht_rate_pct: row.wht_rate_pct,
      wht_payee_name: row.wht_payee_name,
      wht_amount: row.wht_amount,
      net_paid_amount: row.net_paid_amount,
    })),
  };

  return (
    <>
      <Header eyebrow="บิลจ่าย HP" title="แก้ไขบิลจ่าย HP" metaChip={`เลข HP: ${hpNumber}`} />
      <BillForm
        mode="edit"
        hpNumber={hpNumber}
        vendors={vendors ?? []}
        vehicles={vehicles ?? []}
        accounts={accounts ?? []}
        whtCategories={whtCategories ?? []}
        initialValues={initialValues}
      />
    </>
  );
}
