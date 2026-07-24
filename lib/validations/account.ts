import { z } from "zod";

export const accountSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสบัญชี"),
  name: z.string().min(1, "กรุณากรอกชื่อบัญชี"),
  name_en: z.string().optional().nullable(),
  category: z.enum(["สินทรัพย์", "หนี้สิน", "ทุน", "รายได้", "ค่าใช้จ่าย"], {
    message: "กรุณาเลือกหมวดบัญชี",
  }),
  account_type: z.enum(["คุม", "ย่อย"], { message: "กรุณาเลือกประเภทบัญชี" }),
  parent_code: z.string().optional().nullable(),
  legacy_note: z.string().optional().nullable(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
