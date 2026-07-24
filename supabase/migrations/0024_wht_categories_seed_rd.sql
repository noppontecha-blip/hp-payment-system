-- Seed the 14 WHT categories from the owner's RD reference table, as new rows
-- alongside the 9 legacy spreadsheet-derived rows (left untouched — several are
-- already referenced by real hp_payment_lines). `on conflict (name) do nothing`
-- makes this safe to re-run.
--
-- default_rate_pct (the flat rate components/bills/bill-form.tsx already reads for
-- its single per-bill WHT selection) is set to the shared rate where corporate and
-- individual rates match, to the corporate rate for ค่านายหน้า, and left null for
-- เงินเดือน and ดอกเบี้ยจ่าย where no single flat rate is a sensible default.

insert into wht_categories
  (name, default_rate_pct, rate_corporate_pct, rate_corporate_progressive, rate_individual_pct, rate_individual_progressive, reference_note)
values
  ('เงินเดือน', null, null, false, null, true, 'นิติบุคคลไม่ต้องหัก ณ ที่จ่ายเงินเดือน / บุคคลธรรมดาใช้อัตราก้าวหน้าตามตารางภาษีเงินได้'),
  ('ค่าเช่าอาคาร', 5, 5, false, 5, false, null),
  ('ค่าเช่ารถ', 5, 5, false, 5, false, null),
  ('ค่าซ่อมแซม', 3, 3, false, 3, false, null),
  ('ค่าทำบัญชี', 3, 3, false, 3, false, null),
  ('ค่าสอบบัญชี', 3, 3, false, 3, false, null),
  ('ค่าโฆษณา', 2, 2, false, 2, false, null),
  ('ค่าขนส่ง', 1, 1, false, 1, false, null),
  ('ค่านายหน้า', 3, 3, false, null, true, 'บุคคลธรรมดาใช้อัตราก้าวหน้า'),
  ('ค่าจ้างทำของ', 3, 3, false, 3, false, null),
  ('ค่าส่งเสริมการขาย', 3, 3, false, 3, false, null),
  ('ค่าที่ปรึกษาบัญชี/กฎหมาย', 3, 3, false, 3, false, null),
  ('เงินปันผล', 10, 10, false, 10, false, null),
  ('ดอกเบี้ยจ่าย', null, 1, false, 15, false, 'อัตรานิติบุคคล 1% / บุคคลธรรมดา 15%')
on conflict (name) do nothing;
