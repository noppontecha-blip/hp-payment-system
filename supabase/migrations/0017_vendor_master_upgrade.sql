-- Auto vendor-code generator, mirroring generate_next_hp_number()'s pattern (0004): a
-- dedicated single-row counter + atomic UPDATE...RETURNING, no client-writable table.
create table vendor_code_counter (
  id boolean primary key default true check (id),
  last_seq int not null default 0
);
insert into vendor_code_counter (id, last_seq) values (true, 0);
alter table vendor_code_counter enable row level security;
-- no client policies — touched only via the security-definer function below, same as
-- hp_number_counters (0006's documented pattern).

create or replace function generate_next_vendor_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq int;
begin
  update vendor_code_counter set last_seq = last_seq + 1 where id = true returning last_seq into v_seq;
  return 'V' || lpad(v_seq::text, 5, '0');
end;
$$;
revoke all on function generate_next_vendor_code() from public;
grant execute on function generate_next_vendor_code() to authenticated;

-- one legacy row has work_type = '' rather than null — normalize before the check constraint.
update vendors set work_type = null where work_type = '';

-- account_code_hint and contact_info are both 100% empty in production — dropped outright
-- in favor of the structured replacements below (same convention as migration 0007).
alter table vendors
  add column default_account_code_id uuid references chart_of_accounts(id),
  add column bank_name text,
  add column bank_account_name text,
  add column contact_name text,
  add column contact_phone text,
  add column contact_email text,
  drop column account_code_hint,
  drop column contact_info,
  add constraint vendors_work_type_check
    check (work_type is null or work_type in ('งานซ่อม', 'อะไหล่รอซ่อม', 'รถร่วม', 'ค่าใช้จ่าย', 'ต้นทุนขาย'));
