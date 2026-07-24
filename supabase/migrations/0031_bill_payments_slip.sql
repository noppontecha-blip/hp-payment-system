-- Payment-slip attachment + AI-read fields on bill_payments, the "one row per actual
-- payment" table. All nullable — a payment can exist without a slip attached.

alter table bill_payments
  add column slip_path text,
  add column slip_ocr_amount numeric(14,2),
  add column slip_ocr_date date,
  add column slip_ocr_bank text,
  add column slip_ocr_reference text,
  add column slip_looks_valid boolean;
