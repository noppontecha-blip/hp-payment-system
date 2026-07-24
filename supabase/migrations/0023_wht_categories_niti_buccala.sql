-- Split wht_categories rates by payee type (นิติบุคคล vs บุคคลธรรมดา), matching the
-- owner's RD reference table. All nullable/additive — the 9 legacy rows (some already
-- referenced by real hp_payment_lines) are untouched by this migration.
--
-- The *_progressive flags cover "อัตราก้าวหน้า" cases (เงินเดือน, ค่านายหน้าสำหรับ
-- บุคคลธรรมดา) where there's no flat percentage to store in the numeric rate column.

alter table wht_categories
  add column rate_corporate_pct numeric(5,2),
  add column rate_corporate_progressive boolean not null default false,
  add column rate_individual_pct numeric(5,2),
  add column rate_individual_progressive boolean not null default false;
