-- Auto vehicle-code generator, one counter per vehicle_type (mirrors
-- generate_next_hp_number's per-year_month counter, 0004) — each type gets its own
-- independent running sequence with its own prefix/digit-width.
create table vehicle_code_counters (
  vehicle_type text primary key,
  last_seq int not null default 0
);
alter table vehicle_code_counters enable row level security;
-- no client policies — touched only via the security-definer function below.

create or replace function generate_next_vehicle_code(p_vehicle_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_digits int;
  v_seq int;
begin
  case p_vehicle_type
    when 'รถเครน' then v_prefix := 'C'; v_digits := 5;
    when 'รถบรรทุกติดเครน' then v_prefix := 'H'; v_digits := 5;
    when 'รถเทรลเลอร์' then v_prefix := 'TL'; v_digits := 5;
    when 'หางเทรลเลอร์' then v_prefix := 'TTL'; v_digits := 5;
    when 'รถ Forklift' then v_prefix := 'FL'; v_digits := 5;
    when 'Handlift' then v_prefix := 'HL'; v_digits := 4;
    when 'รถกระเช้า' then v_prefix := 'SK'; v_digits := 4;
    when 'ปิคอัพ' then v_prefix := 'PK'; v_digits := 4;
    when 'อื่นๆ' then v_prefix := 'OH'; v_digits := 4;
    else raise exception 'invalid vehicle_type: %', p_vehicle_type;
  end case;

  insert into vehicle_code_counters (vehicle_type, last_seq)
  values (p_vehicle_type, 1)
  on conflict (vehicle_type)
    do update set last_seq = vehicle_code_counters.last_seq + 1
  returning last_seq into v_seq;

  return v_prefix || lpad(v_seq::text, v_digits, '0');
end;
$$;
revoke all on function generate_next_vehicle_code(text) from public;
grant execute on function generate_next_vehicle_code(text) to authenticated;

alter table vehicles
  add column vehicle_type text
    check (vehicle_type is null or vehicle_type in (
      'รถเครน', 'รถบรรทุกติดเครน', 'รถเทรลเลอร์', 'หางเทรลเลอร์', 'รถ Forklift',
      'Handlift', 'รถกระเช้า', 'ปิคอัพ', 'อื่นๆ'
    )),
  drop column nickname,
  drop column brand;
