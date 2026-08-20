-- ที่อยู่จดทะเบียนแบบแยกฟิลด์ (สำหรับใบ 50 ทวิ) — registered_address ยังคงอยู่และใช้เป็นค่าที่ประกอบ
-- (compose) จากฟิลด์ย่อยเหล่านี้ตอนบันทึก เพื่อไม่ต้องแก้โค้ดที่อ่าน registered_address อยู่แล้ว
-- (bill-form.tsx, wht-certificate route, fetch-expense-document.ts)
alter table vendors
  add column address_number text,
  add column address_moo text,
  add column address_village text,
  add column address_soi text,
  add column address_road text,
  add column address_subdistrict text,
  add column address_district text,
  add column address_province text,
  add column address_postal_code text;

-- สำนักงานใหญ่ / สาขา — ใช้ในใบ 50 ทวิ (เลขที่สาขาเป็นตัวเลข เช่น "00001")
alter table vendors
  add column branch_type text check (branch_type in ('สำนักงานใหญ่', 'สาขา')),
  add column branch_code text;
