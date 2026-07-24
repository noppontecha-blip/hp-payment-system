-- Reverting part of 0018: the owner wants the vehicle code entered manually (only the
-- type-prefix letters should auto-fill in the UI) instead of a fully auto-generated
-- sequential code. Drop the now-unused auto-generator plumbing. Also drops vat_eligible
-- ("เข้าเกณฑ์ VAT") — removed from the form entirely, no other code references it.

drop function if exists generate_next_vehicle_code(text);
drop table if exists vehicle_code_counters;

alter table vehicles
  drop column vat_eligible;
