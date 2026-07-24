-- Partial/split payment tracking against a bill (hp_number), kept separate
-- from hp_payment_lines' existing header-level payment_method/payment_date
-- (which describe the bill's default/primary payment info, unchanged) —
-- this table lets one bill be paid across several installments over time.

create table bill_payments (
  id uuid primary key default gen_random_uuid(),
  hp_number text not null,
  payment_date date not null,
  amount numeric(14,2) not null,
  payment_method text check (payment_method in ('บัญชีธนาคารบริษัท', 'สำรองจ่าย')),
  notes text,
  recorded_by text,
  created_at timestamptz default now()
);

create index idx_bill_payments_hp_number on bill_payments(hp_number);

alter table bill_payments enable row level security;
create policy "authenticated full access" on bill_payments
  for all to authenticated using (true) with check (true);
