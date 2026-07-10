-- Master data tables: vendors, vehicles, chart_of_accounts, wht_categories

create extension if not exists pgcrypto;

create table vendors (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  account_code_hint text,
  payment_method text,
  default_wht_pct numeric(5,2),
  default_wht_category text,
  wht_certificate_name text,
  bank_account text,
  document_source text,
  contact_info text,
  work_type text,
  delivery_method text,
  mailing_address text,
  tax_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  vat_eligible boolean,
  registered_under text,
  plate_number text,
  size text,
  nickname text,
  brand text,
  model text,
  chassis_number text,
  engine_number text,
  serial_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  legacy_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table wht_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  default_rate_pct numeric(5,2),
  reference_note text,
  created_at timestamptz default now()
);

-- keep updated_at fresh on row updates
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_vendors_updated_at before update on vendors
  for each row execute function set_updated_at();
create trigger trg_vehicles_updated_at before update on vehicles
  for each row execute function set_updated_at();
create trigger trg_chart_of_accounts_updated_at before update on chart_of_accounts
  for each row execute function set_updated_at();
