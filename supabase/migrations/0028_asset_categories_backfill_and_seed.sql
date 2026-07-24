-- Match existing asset_categories to their chart_of_accounts triplet (by accounting
-- substance, not exact name match — e.g. "เครื่องตกแต่งและติดตั้ง" -> COA's
-- "เครื่องตกแต่งสำนักงาน" group), and add the 3 chart-of-accounts asset branches that
-- have no category yet (ที่ดิน, อะไหล่ต่างๆ, งานระหว่างทำ — none of which depreciate).
-- Updates match by id (no re-insert), so any existing hp_payment_lines.asset_category_id
-- reference is untouched.

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-02'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-02'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-02')
where name = 'อาคาร';

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-02'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-02'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-02'),
  reference_note = 'ใช้บัญชีร่วมกับ "อาคาร" — ไม่มีบัญชีแยกสำหรับส่วนปรับปรุงอาคารในผังบัญชี'
where name = 'ส่วนปรับปรุงอาคาร';

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-03'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-03'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-03'),
  reference_note = 'ใช้บัญชีร่วมกับ "อุปกรณ์สำนักงาน" — ไม่มีบัญชีแยกสำหรับเครื่องจักรในผังบัญชี'
where name = 'เครื่องจักรและอุปกรณ์';

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-04'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-04'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-04')
where name = 'เครื่องตกแต่งและติดตั้ง';

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-05'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-05'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-05')
where name = 'ยานพาหนะ';

update asset_categories set
  fixed_asset_account_id = (select id from chart_of_accounts where code = '1410-03'),
  accumulated_depreciation_account_id = (select id from chart_of_accounts where code = '1420-03'),
  depreciation_expense_account_id = (select id from chart_of_accounts where code = '5340-03')
where name = 'อุปกรณ์สำนักงาน';

insert into asset_categories (name, default_useful_life_years, fixed_asset_account_id)
values
  ('ที่ดิน', null, (select id from chart_of_accounts where code = '1410-01')),
  ('อะไหล่ต่างๆ', null, (select id from chart_of_accounts where code = '1410-06')),
  ('งานระหว่างทำ', null, (select id from chart_of_accounts where code = '1410-07'))
on conflict (name) do nothing;
