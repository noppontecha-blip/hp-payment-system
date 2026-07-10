-- Main table: HP payment lines (flat, one hp_number can have many rows)

create table hp_payment_lines (
  id uuid primary key default gen_random_uuid(),
  hp_number text not null,
  transaction_date date not null,
  work_type text not null default 'ปกติ' check (work_type in ('ปกติ', 'สร้างสินทรัพย์')),
  asset_construction_detail text,
  special_category text,

  tax_invoice_number text,
  bill_number text,

  vendor_id uuid references vendors(id),
  vendor_name_snapshot text not null,
  description text not null,

  account_code_id uuid references chart_of_accounts(id),

  vehicle_id uuid references vehicles(id),
  related_vehicles_text text,

  amount_before_vat numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,

  requires_wht boolean not null default false,
  wht_category_id uuid references wht_categories(id),
  wht_rate_pct numeric(5,2),
  wht_payee_name text,
  wht_amount numeric(14,2),
  wht_issue_date date,

  net_paid_amount numeric(14,2) not null default 0,

  payment_account text,
  advance_payer_name text,
  spk_repaid_date date,
  accounting_office_doc_status text not null default 'ครบถ้วน'
    check (accounting_office_doc_status in ('ครบถ้วน', 'รอเอกสารจากสนง.บัญชี')),

  notes text,
  recorded_by text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_hp_number on hp_payment_lines(hp_number);
create index idx_hp_vendor on hp_payment_lines(vendor_id);
create index idx_hp_vehicle on hp_payment_lines(vehicle_id);
create index idx_hp_date on hp_payment_lines(transaction_date);
create index idx_hp_wht_pending on hp_payment_lines(requires_wht, wht_issue_date)
  where requires_wht = true;

create trigger trg_hp_payment_lines_updated_at before update on hp_payment_lines
  for each row execute function set_updated_at();
