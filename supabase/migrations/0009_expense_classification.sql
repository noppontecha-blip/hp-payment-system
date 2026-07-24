-- Split expense recording into 3 top-level groups (ต้นทุนรายคัน / ค่าใช้จ่ายขายและบริหาร /
-- สินทรัพย์) requested by the owner for clearer bookkeeping and a future per-vehicle
-- profit dashboard. cost_subtype further splits ต้นทุนรายคัน into repair parts (must be
-- traceable to one vehicle) vs consumables (still a direct cost, not vehicle-traceable).
-- Cross-field enforcement (subtype ⇒ vehicle_id required) stays in Zod, matching how
-- requires_wht ⇒ wht_category_id is already enforced app-side, not at the DB level.

alter table hp_payment_lines
  add column expense_group text not null default 'ต้นทุนรายคัน'
    check (expense_group in ('ต้นทุนรายคัน', 'ค่าใช้จ่ายขายและบริหาร', 'สินทรัพย์')),
  add column cost_subtype text
    check (cost_subtype in ('อะไหล่ซ่อม/สต๊อก', 'วัสดุสิ้นเปลือง'));

-- Backfill heuristic for existing rows: nothing in the old schema distinguishes SG&A,
-- so everything defaults to ต้นทุนรายคัน except rows already flagged as asset-construction.
-- cost_subtype uses vehicle_id presence as the best available proxy. Needs a manual
-- owner/accountant review pass after migrating — see rollout notes in the plan.
update hp_payment_lines set
  expense_group = case when work_type = 'สร้างสินทรัพย์' then 'สินทรัพย์' else 'ต้นทุนรายคัน' end,
  cost_subtype = case
    when work_type = 'สร้างสินทรัพย์' then null
    when vehicle_id is not null then 'อะไหล่ซ่อม/สต๊อก'
    else 'วัสดุสิ้นเปลือง'
  end;

create index idx_hp_expense_group on hp_payment_lines(expense_group);
