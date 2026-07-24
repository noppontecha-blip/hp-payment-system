import { z } from "zod";

export const whtCategorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดหัก ณ ที่จ่าย"),
  default_rate_pct: z.coerce.number().optional().nullable(),
  rate_corporate_pct: z.coerce.number().optional().nullable(),
  rate_corporate_progressive: z.boolean(),
  rate_individual_pct: z.coerce.number().optional().nullable(),
  rate_individual_progressive: z.boolean(),
  reference_note: z.string().optional().nullable(),
});

export type WhtCategoryFormValues = z.infer<typeof whtCategorySchema>;
