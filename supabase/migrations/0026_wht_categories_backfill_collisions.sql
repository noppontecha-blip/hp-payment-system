-- 3 of the 14 RD reference categories share an exact name with an existing legacy row
-- (ค่าโฆษณา, ค่าขนส่ง, ค่านายหน้า), so migration 0024's `on conflict (name) do nothing`
-- correctly skipped inserting duplicates — but that also skipped their corporate/
-- individual rate split. Backfill it onto the existing rows in place (same id, so
-- hp_payment_lines references and default_rate_pct are untouched) instead of creating
-- a near-duplicate category.

update wht_categories set rate_corporate_pct = 2, rate_individual_pct = 2
  where name = 'ค่าโฆษณา';
update wht_categories set rate_corporate_pct = 1, rate_individual_pct = 1
  where name = 'ค่าขนส่ง';
update wht_categories set rate_corporate_pct = 3, rate_individual_progressive = true
  where name = 'ค่านายหน้า';
