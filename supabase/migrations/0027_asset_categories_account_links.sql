-- Link each asset category to its actual GL accounts: the fixed-asset account it
-- posts to, the accumulated-depreciation account that offsets it, and the
-- depreciation-expense account its depreciation hits. All nullable at the DB level
-- (ที่ดิน/อะไหล่ต่างๆ/งานระหว่างทำ genuinely don't depreciate, so the last two stay
-- null for those) — fixed_asset_account_id is required at the app layer instead.

alter table asset_categories
  add column fixed_asset_account_id uuid references chart_of_accounts(id),
  add column accumulated_depreciation_account_id uuid references chart_of_accounts(id),
  add column depreciation_expense_account_id uuid references chart_of_accounts(id);
