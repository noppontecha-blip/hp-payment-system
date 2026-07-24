import { z } from "zod";

export const billPaymentSchema = z.object({
  hp_number: z.string().min(1),
  payment_date: z.string().min(1, "กรุณาเลือกวันที่จ่าย"),
  amount: z.coerce.number().positive("กรุณากรอกจำนวนเงิน"),
  payment_method: z.enum(["บัญชีธนาคารบริษัท", "สำรองจ่าย"]).nullable().optional(),
  notes: z.string().nullable().optional(),
  slip_path: z.string().nullable().optional(),
  slip_ocr_amount: z.coerce.number().nullable().optional(),
  slip_ocr_date: z.string().nullable().optional(),
  slip_ocr_bank: z.string().nullable().optional(),
  slip_ocr_reference: z.string().nullable().optional(),
  slip_looks_valid: z.boolean().nullable().optional(),
});

export type BillPaymentFormValues = z.infer<typeof billPaymentSchema>;
