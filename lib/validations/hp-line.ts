import { z } from "zod";

// One row of the editable line-items table: รหัสบัญชี / รายละเอียด / รหัสรถ / ค่าใช้จ่าย, plus
// its own หมวดรายจ่าย. VAT and หัก ณ ที่จ่าย are a single decision for the whole bill (see
// BillForm) — bill-form.tsx distributes the resulting amounts across each row proportionally
// before saving, since hp_payment_lines still stores vat_amount/wht_amount per row (no
// separate header table).
// หมวดหมู่การบันทึกรายจ่าย — เลือกได้ต่อรายการย่อย (ไม่ใช่ทั้งเอกสาร) เพราะเอกสารเดียว
// อาจมีทั้งต้นทุนรายคันและค่าใช้จ่ายขายและบริหารปนกันได้. ต้นทุนรายคันแยกย่อยด้วย cost_subtype
// (อะไหล่ซ่อม/สต๊อก ต้องระบุรถ/เครน, วัสดุสิ้นเปลืองไม่บังคับ). สินทรัพย์ต้องระบุหมวด+อายุการใช้งาน.
const hpLineItemBase = z.object({
  id: z.string().uuid().optional(),
  description: z.string().min(1, "กรุณากรอกรายละเอียด"),
  account_code_id: z.string().uuid().nullable().optional(),
  vehicle_id: z.string().uuid().nullable().optional(),
  related_vehicles_text: z.string().nullable().optional(),
  expense_group: z
    .enum(["ต้นทุนรายคัน", "ค่าใช้จ่ายขายและบริหาร", "สินทรัพย์"])
    .default("ต้นทุนรายคัน"),
  cost_subtype: z.enum(["อะไหล่ซ่อม/สต๊อก", "วัสดุสิ้นเปลือง"]).nullable().optional(),
  asset_category_id: z.string().uuid().nullable().optional(),
  asset_useful_life_years: z.coerce.number().nullable().optional(),
  quantity: z.coerce.number().positive("กรุณากรอกจำนวนหน่วย").default(1),
  unit_price: z.coerce.number().min(0).default(0),
  amount_before_vat: z.coerce.number().min(0),
  vat_amount: z.coerce.number().min(0),
  requires_wht: z.boolean().default(false),
  wht_category_id: z.string().uuid().nullable().optional(),
  wht_rate_pct: z.coerce.number().nullable().optional(),
  wht_payee_name: z.string().nullable().optional(),
  wht_amount: z.coerce.number().nullable().optional(),
  wht_issue_date: z.string().nullable().optional(),
  wht_pnd_form: z.enum(["ภ.ง.ด.3", "ภ.ง.ด.53"]).nullable().optional(),
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
  if (line.expense_group === "ต้นทุนรายคัน") {
    if (!line.cost_subtype) {
      ctx.addIssue({
        code: "custom",
        path: ["cost_subtype"],
        message: "กรุณาเลือกประเภทต้นทุน",
      });
    }
    if (line.cost_subtype === "อะไหล่ซ่อม/สต๊อก" && !line.vehicle_id) {
      ctx.addIssue({
        code: "custom",
        path: ["vehicle_id"],
        message: "กรุณาเลือกรถ/เครน (จำเป็นสำหรับอะไหล่ซ่อม/สต๊อก)",
      });
    }
  }
  if (line.expense_group === "สินทรัพย์" && !line.asset_category_id) {
    ctx.addIssue({
      code: "custom",
      path: ["asset_category_id"],
      message: "กรุณาเลือกหมวดสินทรัพย์",
    });
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
  // เอกสารที่ได้รับจากผู้จำหน่าย — บางรายออกใบกำกับภาษี บางรายออกบิลเงินสด บางบิลยังไม่มีเอกสาร
  // (รายการที่ "ยังไม่มีเอกสาร" จะไปโผล่ในหน้าติดตามเอกสารซื้อ)
  document_type: z
    .enum(["ใบกำกับภาษี", "บิลเงินสด", "ยังไม่มีเอกสาร"])
    .default("ยังไม่มีเอกสาร"),
  document_number: z.string().nullable().optional(),
  // ใช้ทำรายงานภาษีซื้อ — มีค่าเฉพาะตอน document_type = "ใบกำกับภาษี"
  document_invoice_date: z.string().nullable().optional(),
  // วิธีการจ่ายเงิน — จ่ายผ่านบัญชีธนาคารบริษัทฯ หรือมีคนสำรองจ่ายไปก่อน
  payment_method: z.enum(["บัญชีธนาคารบริษัท", "สำรองจ่าย"]).nullable().optional(),
  payment_date: z.string().nullable().optional(),
  // สลิปโอนเงินที่แนบกับ "วิธีการจ่ายเงิน" หลักของเอกสาร (แยกจากสลิปรายงวดใน bill_payments)
  slip_path: z.string().nullable().optional(),
  slip_ocr_amount: z.coerce.number().nullable().optional(),
  slip_ocr_date: z.string().nullable().optional(),
  slip_ocr_bank: z.string().nullable().optional(),
  slip_ocr_reference: z.string().nullable().optional(),
  slip_looks_valid: z.boolean().nullable().optional(),
  advance_payer_name: z.string().nullable().optional(),
  // วันที่บริษัทคืนเงินให้ผู้สำรองจ่าย (มีค่า = คืนแล้ว)
  spk_repaid_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
};

export const hpBillHeaderSchema = z.object(hpBillHeaderFields);
export type HpBillHeaderValues = z.infer<typeof hpBillHeaderSchema>;

// "บันทึกร่าง" — structural validation only, WHT sub-fields can stay incomplete while drafting.
export const hpBillDraftSchema = z.object({
  ...hpBillHeaderFields,
  lines: z.array(hpLineItemBase).min(1, "ต้องมีอย่างน้อย 1 รายการย่อย"),
});

// "บันทึกและปิดงาน" — full validation (WHT + หมวดรายจ่าย sub-fields required per line, see
// hpLineItemSchema's own superRefine above — each line validates independently now that
// categorization is per-line, not a single bill-level choice).
export const hpBillFinalSchema = z.object({
  ...hpBillHeaderFields,
  lines: z.array(hpLineItemSchema).min(1, "ต้องมีอย่างน้อย 1 รายการย่อย"),
});

export type HpBillFormValues = z.infer<typeof hpBillDraftSchema>;
