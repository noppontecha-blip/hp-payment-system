import { z } from "zod";

export const assetCategorySchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหมวดสินทรัพย์"),
  default_useful_life_years: z.coerce.number().optional().nullable(),
  fixed_asset_account_id: z.string().uuid("กรุณาเลือกบัญชีสินทรัพย์"),
  accumulated_depreciation_account_id: z.string().uuid().optional().nullable(),
  depreciation_expense_account_id: z.string().uuid().optional().nullable(),
  reference_note: z.string().optional().nullable(),
});

export type AssetCategoryFormValues = z.infer<typeof assetCategorySchema>;
