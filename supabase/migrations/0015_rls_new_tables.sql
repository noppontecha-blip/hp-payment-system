-- Same "authenticated full access" convention as 0006 — without this, asset_categories
-- and company_profile would be invisible to the app's authenticated Supabase client
-- despite existing.

alter table asset_categories enable row level security;
alter table company_profile enable row level security;

create policy "authenticated full access" on asset_categories
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on company_profile
  for all to authenticated using (true) with check (true);
