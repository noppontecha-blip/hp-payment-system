-- Read-only counterpart to generate_next_hp_number(): shows what the next HP number
-- would be, without advancing hp_number_counters. Fixes the bug where every page load
-- of /bills/new burned a real number even if the user never saved — the number should
-- only be claimed for real at save time (see saveHpBill in lib/actions/bills.ts).

create or replace function peek_next_hp_number(p_date date default current_date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year_month text;
  v_seq int;
begin
  v_year_month := lpad(((extract(year from p_date)::int + 543) % 100)::text, 2, '0')
                  || lpad(extract(month from p_date)::text, 2, '0');

  select coalesce(last_seq, 0) + 1 into v_seq
  from hp_number_counters
  where year_month = v_year_month;

  return 'HP' || v_year_month || lpad(coalesce(v_seq, 1)::text, 3, '0');
end;
$$;

revoke all on function peek_next_hp_number(date) from public;
grant execute on function peek_next_hp_number(date) to authenticated;
