-- Fixed-asset register, phase 1: record-keeping only (category + useful-life years per
-- NPAE-style practice). Automatic depreciation calculation is a deferred future phase.
-- fixed_asset_register is a live view (same convention as hp_voucher_summary, 0003) —
-- no duplicated/denormalized table, single source of truth.

alter table hp_payment_lines
  add column asset_category_id uuid references asset_categories(id),
  add column asset_useful_life_years numeric(5,1);

create index idx_hp_asset_category on hp_payment_lines(asset_category_id);

create view fixed_asset_register as
select
  l.id, l.hp_number, l.transaction_date, l.description, l.vendor_name_snapshot,
  l.vehicle_id, l.amount_before_vat, l.vat_amount, l.net_paid_amount,
  (l.amount_before_vat > 5000) as capitalized_flag,
  l.asset_category_id, ac.name as asset_category_name, l.asset_useful_life_years
from hp_payment_lines l
left join asset_categories ac on ac.id = l.asset_category_id
where l.expense_group = 'สินทรัพย์';
