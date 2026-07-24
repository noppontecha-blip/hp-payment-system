-- Snapshots which government withholding-tax form a withheld line belongs to, at save time —
-- ภ.ง.ด.53 for นิติบุคคล payees, ภ.ง.ด.3 for บุคคลธรรมดา payees. Snapshotted (not derived live
-- from vendors.vendor_type) so correcting a vendor's type later doesn't retroactively reclassify
-- already-filed historical documents — same rationale as vendor_name_snapshot. Nullable: only
-- set when requires_wht is true and the vendor's type is known at save time.

alter table hp_payment_lines
  add column wht_pnd_form text check (wht_pnd_form in ('ภ.ง.ด.3', 'ภ.ง.ด.53'));
