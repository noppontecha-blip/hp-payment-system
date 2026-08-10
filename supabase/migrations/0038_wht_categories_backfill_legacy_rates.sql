-- 4 legacy wht_categories rows (from before the นิติบุคคล/บุคคลธรรมดา rate split was added)
-- have a flat default_rate_pct but null rate_corporate_pct/rate_individual_pct — the vendor
-- form's rate display reads only the corporate/individual columns, so selecting one of these
-- shows "ไม่มีข้อมูล" even though a real rate exists. Confirmed all 4 historically applied the
-- same flat rate regardless of payee type, so backfilling both columns from default_rate_pct is
-- correct. Other null rows (เงินเดือน, ไม่ต้องหัก..., อื่นๆ...) are legitimately rate-less and
-- are not touched.

update wht_categories
set rate_corporate_pct = default_rate_pct,
    rate_individual_pct = default_rate_pct
where name in ('ค่าเช่า', 'ค่าบริการ/ค่าจ้างทำของ', 'ค่าเบี้ยประกันภัย/ค่านายหน้าประกัน', 'ดอกเบี้ย');
