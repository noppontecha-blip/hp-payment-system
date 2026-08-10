-- Vendor codes move from 2-digit (V01-V58, bulk-imported directly, bypassing
-- generate_next_vendor_code()) to 4-digit (V0001-V0058) for consistency. V9999 (the "ทั่วไป"
-- fallback vendor) keeps its special code untouched — it's a fixed sentinel, not part of the
-- sequence.
--
-- vendor_code_counter.last_seq was found at 21 (only real generate_next_vendor_code() calls
-- advanced it — most of the 58 imported vendors bypassed it entirely) while 58 sequential codes
-- already exist. Left as-is, the next generated code would have been V0022, colliding with the
-- real vendor V22. Reset to 58 so the next generated code is V0059.

update vendors
set code = 'V' || lpad(regexp_replace(code, '^V', '')::int::text, 4, '0')
where code ~ '^V[0-9]{2}$';

update vendor_code_counter set last_seq = 58 where id = true;

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
  return 'V' || lpad(v_seq::text, 4, '0');
end;
$$;
