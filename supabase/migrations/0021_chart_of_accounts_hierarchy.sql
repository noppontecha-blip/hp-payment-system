-- Chart of Accounts hierarchy, matching the multi-level structure the owner already used in
-- Express Accounting (see Chart of Account Express.pdf): every account can sit under a "คุม"
-- (control) parent account, forming a tree. All new columns are nullable — the 26 legacy
-- accounts imported from the old Excel sheet (already referenced by real bills) are left
-- exactly as they are, sitting outside the new hierarchy as unclassified rows.

alter table chart_of_accounts
  add column name_en text,
  add column category text
    check (category in ('สินทรัพย์', 'หนี้สิน', 'ทุน', 'รายได้', 'ค่าใช้จ่าย')),
  add column account_type text check (account_type in ('คุม', 'ย่อย')),
  add column level int,
  add column parent_code text references chart_of_accounts(code);

create index idx_chart_of_accounts_parent_code on chart_of_accounts(parent_code);
