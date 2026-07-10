import { z } from "zod";

export const accountSchema = z.object({
  code: z.string().min(1, "กรุณากรอกรหัสบัญชี"),
  name: z.string().min(1, "กรุณากรอกชื่อบัญชี"),
  legacy_note: z.string().optional().nullable(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
