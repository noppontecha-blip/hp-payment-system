import { z } from "zod";

export const vendorSchema = z
  .object({
    code: z.string().min(1, "กรุณากรอกรหัสผู้จำหน่าย"),
    name: z.string().min(1, "กรุณากรอกชื่อผู้จำหน่าย"),
    vendor_type: z.enum(["นิติบุคคล", "บุคคลธรรมดา"]).optional().nullable(),
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
    registered_address: z.string().optional().nullable(),
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
  });

export type VendorFormValues = z.infer<typeof vendorSchema>;
