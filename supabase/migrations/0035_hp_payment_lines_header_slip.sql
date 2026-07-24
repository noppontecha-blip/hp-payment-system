-- Payment-slip attachment on the document's main "วิธีการจ่ายเงิน" header fields
-- (payment_method/payment_date), separate from the per-installment slips already on
-- bill_payments (migration 0031) — mirrors those same columns so the same
-- /api/bill-payments/scan-slip route (path-based, not actually bill-payment-specific)
-- can be reused here unchanged. All nullable — a document can exist without a slip.

alter table hp_payment_lines
  add column slip_path text,
  add column slip_ocr_amount numeric(14,2),
  add column slip_ocr_date date,
  add column slip_ocr_bank text,
  add column slip_ocr_reference text,
  add column slip_looks_valid boolean;
