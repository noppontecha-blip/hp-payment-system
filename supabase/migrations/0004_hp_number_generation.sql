-- HP number generation: HP + 2-digit BE year + 2-digit month + 3-digit running seq per month
-- e.g. July 2568 (2025), 15th bill of the month -> HP6807015
--
-- Uses a dedicated counter table with an atomic upsert (insert ... on conflict ... returning)
-- instead of `select max(hp_number) ... for update` -- one statement, no table-wide lock,
-- safe under concurrent calls.

create table hp_number_counters (
  year_month text primary key,  -- e.g. '6807'
  last_seq int not null default 0
);

create or replace function generate_next_hp_number(p_date date default current_date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year_month text;
  v_prefix text;
  v_seq int;
begin
  v_year_month := lpad(((extract(year from p_date)::int + 543) % 100)::text, 2, '0')
                  || lpad(extract(month from p_date)::text, 2, '0');
  v_prefix := 'HP' || v_year_month;

  insert into hp_number_counters (year_month, last_seq)
  values (v_year_month, 1)
  on conflict (year_month)
    do update set last_seq = hp_number_counters.last_seq + 1
  returning last_seq into v_seq;

  return v_prefix || lpad(v_seq::text, 3, '0');
end;
$$;

revoke all on function generate_next_hp_number(date) from public;
grant execute on function generate_next_hp_number(date) to authenticated;
