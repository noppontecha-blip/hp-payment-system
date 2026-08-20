import { z } from "zod";

export const vendorSchema = z
  .object({
    code: z.string().min(1, "กรุณากรอกรหัสผู้จำหน่าย"),
    name: z.string().min(1, "กรุณากรอกชื่อผู้จำหน่าย"),
    vendor_type: z.enum(["นิติบุคคล", "บุคคลธรรมดา"]).optional().nullable(),
    vat_registered: z.boolean().default(true),
    tax_id: z.string().optional().nullable(),
    default_account_code_id: z.string().uuid("กรุณาเลือกบัญชีที่มักใช้"),
    payment_method: z.enum(["สด", "โอน"]).optional().nullable(),
    bank_name: z.string().optional().nullable(),
    bank_account: z.string().optional().nullable(),
    bank_account_name: z.string().optional().nullable(),
    default_wht_category_id: z.string().uuid().optional().nullable(),
    wht_certificate_name: z.string().optional().nullable(),
    document_source: z.string().optional().nullable(),
    contact_name: z.string().optional().nullable(),
    contact_phone: z.string().optional().nullable(),
    contact_email: z
      .string()
      .email("อีเมลไม่ถูกต้อง")
      .optional()
      .nullable()
      .or(z.literal("")),
    work_type: z
      .enum(["งานซ่อม", "อะไหล่รอซ่อม", "รถร่วม", "ค่าใช้จ่าย", "ต้นทุนขาย"])
      .optional()
      .nullable(),
    delivery_method: z.string().optional().nullable(),
    mailing_address: z.string().optional().nullable(),
    // registered_address is derived (composeThaiAddress) from the structured fields below at
    // submit time, not typed directly — kept in the schema since existing readers (bill-form,
    // wht-certificate route, fetch-expense-document) still consume the single joined string.
    registered_address: z.string().optional().nullable(),
    address_number: z.string().optional().nullable(),
    address_moo: z.string().optional().nullable(),
    address_village: z.string().optional().nullable(),
    address_soi: z.string().optional().nullable(),
    address_road: z.string().optional().nullable(),
    address_subdistrict: z.string().optional().nullable(),
    address_district: z.string().optional().nullable(),
    address_province: z.string().optional().nullable(),
    address_postal_code: z.string().optional().nullable(),
    branch_type: z.enum(["สำนักงานใหญ่", "สาขา"]).optional().nullable(),
    branch_code: z.string().optional().nullable(),
    id_document_path: z.string().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.payment_method === "โอน") {
      if (!v.bank_name) {
        ctx.addIssue({ code: "custom", path: ["bank_name"], message: "กรุณากรอกธนาคาร" });
      }
      if (!v.bank_account) {
        ctx.addIssue({ code: "custom", path: ["bank_account"], message: "กรุณากรอกเลขบัญชี" });
      }
      if (!v.bank_account_name) {
        ctx.addIssue({ code: "custom", path: ["bank_account_name"], message: "กรุณากรอกชื่อบัญชี" });
      }
    }
    if (v.vendor_type === "นิติบุคคล" && !v.name.includes("จำกัด")) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: 'ชื่อนิติบุคคลควรมีคำว่า "จำกัด" ต่อท้าย เช่น บริษัท ... จำกัด',
      });
    }
    if (v.branch_type === "สาขา" && !v.branch_code) {
      ctx.addIssue({ code: "custom", path: ["branch_code"], message: "กรุณากรอกรหัสสาขา" });
    }
    if (v.branch_code && !/^\d+$/.test(v.branch_code)) {
      ctx.addIssue({ code: "custom", path: ["branch_code"], message: "รหัสสาขาต้องเป็นตัวเลขเท่านั้น" });
    }
  });

export type VendorFormValues = z.infer<typeof vendorSchema>;
