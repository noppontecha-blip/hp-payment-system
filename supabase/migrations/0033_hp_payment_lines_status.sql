-- Real document-lifecycle flags on hp_payment_lines, replacing the fake draft/final
-- split (today "บันทึกร่าง" vs "บันทึกและปิดงาน" only change client/server validation
-- strictness — nothing is persisted about which was used). Duplicated per line, same
-- convention as every other document-level flag already on this table.
--
-- is_draft: set true by saveHpBill when saved via "บันทึกร่าง", false when saved via
-- "บันทึกและปิดงาน" — so re-saving a draft as final flips it back to false.
-- is_cancelled: set by cancelHpBill (replaces hard delete — see lib/actions/bills.ts)
-- so numbering stays contiguous and the audit trail is never destroyed.

alter table hp_payment_lines
  add column is_draft boolean not null default false,
  add column is_cancelled boolean not null default false;
