-- RLS: internal tool, single org, no fine-grained roles for this phase (see spec section 8).
-- Any authenticated user can read/write all business tables.

alter table vendors enable row level security;
alter table vehicles enable row level security;
alter table chart_of_accounts enable row level security;
alter table wht_categories enable row level security;
alter table hp_payment_lines enable row level security;

create policy "authenticated full access" on vendors
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on vehicles
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on chart_of_accounts
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on wht_categories
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on hp_payment_lines
  for all to authenticated using (true) with check (true);

-- hp_number_counters is only ever touched through generate_next_hp_number() (security definer,
-- owned by the migration role which bypasses RLS as table owner). No direct client policies.
alter table hp_number_counters enable row level security;
