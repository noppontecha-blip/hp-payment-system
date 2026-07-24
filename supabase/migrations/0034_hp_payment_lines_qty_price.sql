-- Split each line's ค่าใช้จ่าย into จำนวนหน่วย × ราคาต่อหน่วย = รวม. amount_before_vat stays the
-- field every downstream calculation (VAT, WHT, net_paid_amount, totals, PDF, reports) already
-- keys off — it's now derived (quantity * unit_price) in the UI rather than typed directly, so
-- nothing downstream needs to change. Nullable — backfilled below so existing totals are
-- preserved exactly; new saves always populate both via the Zod schema's defaults.

alter table hp_payment_lines
  add column quantity numeric(12,2),
  add column unit_price numeric(14,2);

update hp_payment_lines
set quantity = 1, unit_price = amount_before_vat
where quantity is null;
