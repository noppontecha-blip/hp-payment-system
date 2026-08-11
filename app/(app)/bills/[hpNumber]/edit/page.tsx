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
    { data: assetCategories },
    { data: payments },
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
    supabase.from("asset_categories").select("*").order("name"),
    supabase.from("bill_payments").select("*").eq("hp_number", hpNumber).order("payment_date"),
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
    document_type: first.document_type,
    document_received_date: first.document_received_date,
    expected_document_type: first.expected_document_type,
    adhoc_vendor_tax_id: first.adhoc_vendor_tax_id,
    payment_method: first.payment_method,
    payment_date: first.payment_date,
    slip_path: first.slip_path,
    slip_ocr_amount: first.slip_ocr_amount,
    slip_ocr_date: first.slip_ocr_date,
    slip_ocr_bank: first.slip_ocr_bank,
    slip_ocr_reference: first.slip_ocr_reference,
    slip_looks_valid: first.slip_looks_valid,
    advance_payer_name: first.advance_payer_name,
    spk_repaid_date: first.spk_repaid_date,
    notes: first.notes,
    lines: rows.map((row) => ({
      id: row.id,
      description: row.description,
      account_code_id: row.account_code_id,
      vehicle_id: row.vehicle_id,
      related_vehicles_text: row.related_vehicles_text,
      expense_group: row.expense_group,
      cost_subtype: row.cost_subtype,
      asset_category_id: row.asset_category_id,
      asset_useful_life_years: row.asset_useful_life_years,
      quantity: row.quantity ?? 1,
      unit_price: row.unit_price ?? row.amount_before_vat,
      amount_before_vat: row.amount_before_vat,
      vat_amount: row.vat_amount,
      requires_wht: row.requires_wht,
      wht_category_id: row.wht_category_id,
      wht_rate_pct: row.wht_rate_pct,
      wht_payee_name: row.wht_payee_name,
      wht_amount: row.wht_amount,
      wht_pnd_form: row.wht_pnd_form,
      net_paid_amount: row.net_paid_amount,
      document_number: row.document_number,
      document_invoice_date: row.document_invoice_date,
      vat_non_claimable: row.vat_non_claimable,
    })),
  };

  return (
    <>
      <Header eyebrow="รายจ่าย" title="แก้ไขเอกสาร" metaChip={`เลข HP: ${hpNumber}`} />
      <BillForm
        mode="edit"
        hpNumber={hpNumber}
        vendors={vendors ?? []}
        vehicles={vehicles ?? []}
        accounts={accounts ?? []}
        whtCategories={whtCategories ?? []}
        assetCategories={assetCategories ?? []}
        initialValues={initialValues}
        payments={payments ?? []}
        initialIsDraft={first.is_draft}
        initialIsCancelled={first.is_cancelled}
      />
    </>
  );
}
