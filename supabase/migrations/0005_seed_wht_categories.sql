-- Seed data distilled from real usage of the legacy spreadsheet (not textbook categories)

insert into wht_categories (name, default_rate_pct, reference_note) values
  ('ค่าบริการ/ค่าจ้างทำของ', 3, 'ใช้บ่อยที่สุด — มาตรา 3 เตรส'),
  ('ค่าเบี้ยประกันภัย/ค่านายหน้าประกัน', 1, null),
  ('ค่านายหน้า', 3, 'ไม่ใช่ค่านายหน้าประกัน'),
  ('ค่าเช่า', 5, null),
  ('ไม่ต้องหัก (ยอดไม่ถึงเกณฑ์)', 0, 'ปกติยอดก่อน VAT ไม่ถึง 1,000 บาท'),
  ('ค่าขนส่ง', 1, 'เผื่อไว้ เฉพาะนิติบุคคลขนส่ง'),
  ('ค่าโฆษณา', 2, 'เผื่อไว้'),
  ('ดอกเบี้ย', 1, 'เผื่อไว้'),
  ('อื่นๆ (ระบุในหมายเหตุ)', null, null);
