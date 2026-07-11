import { z } from "zod";

// One row of the editable line-items table (7.3): รายละเอียด / รหัสบัญชี / รหัสรถ / ค่าใช้จ่าย.
// VAT and หัก ณ ที่จ่าย are a single decision for the whole bill (see BillForm) — bill-form.tsx
// distributes the resulting amounts across each row proportionally before saving, since
// hp_payment_lines still stores vat_amount/wht_amount per row (no separate header table).
const hpLineItemBase = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  account_code_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
  related_vehicles_text: z.string().nullable().optional(),
  amount_before_vat: z.coerce.number().min(0),
  vat_amount: z.coerce.number().min(0),
  requires_wht: z.boolean().default(false),
  wht_category_id: z.string().uuid().nullable().optional(),
  wht_rate_pct: z.coerce.number().nullable().optional(),
  wht_payee_name: z.string().nullable().optional(),
  wht_amount: z.coerce.number().nullable().optional(),
  wht_issue_date: z.string().nullable().optional(),
  net_paid_amount: z.coerce.number(),
});

export const hpLineItemSchema = hpLineItemBase.superRefine((line, ctx) => {
  if (line.requires_wht) {
    if (!line.wht_category_id) {
      ctx.addIssue({
        code: "custom",
        path: ["wht_category_id"],
        message: "กรุณาเลือกหมวดหัก ณ ที่จ่าย",
      });
    }
    if (line.wht_amount == null) {
      ctx.addIssue({
        code: "custom",
        path: ["wht_amount"],
        message: "กรุณากรอกยอดหัก ณ ที่จ่าย",
      });
    }
  }
});
export type HpLineItemFormValues = z.infer<typeof hpLineItemBase>;

const hpBillHeaderFields = {
  hp_number: z.string().min(1, "กรุณาสร้างเลข HP"),
  transaction_date: z.string().min(1, "กรุณาเลือกวันที่"),
  work_type: z.enum(["ปกติ", "สร้างสินทรัพย์"]),
  asset_construction_detail: z.string().nullable().optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  vendor_name_snapshot: z.string().min(1, "กรุณาเลือกผู้จำหน่าย"),
  tax_invoice_number: z.string().nullable().optional(),
  bill_number: z.string().nullable().optional(),
  payment_account: z.string().nullable().optional(),
  advance_payer_name: z.string().nullable().optional(),
  spk_repaid_date: z.string().nullable().optional(),
  accounting_office_doc_status: z
    .enum(["ครบถ้วน", "รอเอกสารจากสนง.บัญชี"])
    .default("ครบถ้วน"),
  notes: z.string().nullable().optional(),
};

export const hpBillHeaderSchema = z.object(hpBillHeaderFields);
export type HpBillHeaderValues = z.infer<typeof hpBillHeaderSchema>;

// "บันทึกร่าง" — structural validation only, WHT sub-fields can stay incomplete while drafting.
export const hpBillDraftSchema = z.object({
  ...hpBillHeaderFields,
  lines: z.array(hpLineItemBase).min(1, "ต้องมีอย่างน้อย 1 รายการย่อย"),
});

// "บันทึกและปิดงาน" — full validation per spec 4.3 (WHT category + amount required when the
// bill-level WHT toggle is on — gets distributed to every row before this runs, so they all
// pass/fail together).
export const hpBillFinalSchema = z.object({
  ...hpBillHeaderFields,
  lines: z.array(hpLineItemSchema).min(1, "ต้องมีอย่างน้อย 1 รายการย่อย"),
});

export type HpBillFormValues = z.infer<typeof hpBillDraftSchema>;
