-- Fixed-asset category lookup, same shape as wht_categories (0001/0005).
-- Seed list is a best-guess NPAE-style grouping based on the owner's own examples
-- (อาคาร, ส่วนปรับปรุงอาคาร, อุปกรณ์สำนักงาน) — editable later via the asset-categories
-- admin page; owner should review names/useful-life defaults before relying on them.

create table asset_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  default_useful_life_years numeric(5,1),
  reference_note text,
  created_at timestamptz default now()
);

insert into asset_categories (name, default_useful_life_years, reference_note) values
  ('อาคาร', 20, null),
  ('ส่วนปรับปรุงอาคาร', 5, null),
  ('เครื่องจักรและอุปกรณ์', 5, null),
  ('เครื่องตกแต่งและติดตั้ง', 5, null),
  ('อุปกรณ์สำนักงาน', 5, null),
  ('ยานพาหนะ', 5, null),
  ('อื่นๆ (ระบุในหมายเหตุ)', null, null);
