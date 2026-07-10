import { z } from "zod";

export const vendorSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสผู้จำหน่าย"),
  name: z.string().min(1, "กรุณากรอกชื่อผู้จำหน่าย"),
  account_code_hint: z.string().optional().nullable(),
  payment_method: z.enum(["สด", "โอน"]).optional().nullable(),
  default_wht_pct: z.coerce.number().optional().nullable(),
  default_wht_category: z.string().optional().nullable(),
  wht_certificate_name: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  document_source: z.string().optional().nullable(),
  contact_info: z.string().optional().nullable(),
  work_type: z.string().optional().nullable(),
  delivery_method: z.string().optional().nullable(),
  mailing_address: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;
