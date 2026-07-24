-- Vendor master-data additions for 50-ทวิ generation and DBD auto-fill.
-- tax_id (exists since 0001) is reused as-is for both a 13-digit corporate registration
-- number and a 13-digit national ID — no separate column needed, both are 13 digits.
-- registered_address is distinct from the existing mailing_address (delivery address):
-- 50-ทวิ needs the payee's legal/registered address, not where documents get mailed.
-- id_document_path stores the Supabase Storage object path for an uploaded ID-card copy
-- (individual vendors) or company registration doc (optional for juristic vendors too).

alter table vendors
  add column vendor_type text check (vendor_type in ('นิติบุคคล', 'บุคคลธรรมดา')),
  add column registered_address text,
  add column id_document_path text;
