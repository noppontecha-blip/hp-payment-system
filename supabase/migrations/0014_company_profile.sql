-- Payer (company) header info for the 50-ทวิ withholding-tax certificate PDF.
-- Singleton by convention only (one seeded row, /settings always reads/writes it) — no
-- DB-level singleton enforcement, matching this codebase's preference for simplicity.

create table company_profile (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'บริษัท เอสพีเค เครน จำกัด',
  tax_id text,
  branch text default 'สำนักงานใหญ่',
  registered_address text,
  phone text,
  authorized_signer_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into company_profile (company_name) values ('บริษัท เอสพีเค เครน จำกัด');

create trigger trg_company_profile_updated_at before update on company_profile
  for each row execute function set_updated_at();
