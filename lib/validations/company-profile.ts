import { z } from "zod";

export const companyProfileSchema = z.object({
  company_name: z.string().min(1, "กรุณากรอกชื่อบริษัท"),
  tax_id: z.string().optional().nullable(),
  branch: z.string().optional().nullable(),
  registered_address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  authorized_signer_name: z.string().optional().nullable(),
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
