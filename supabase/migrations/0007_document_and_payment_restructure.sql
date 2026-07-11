-- Bill header restructure:
--   1. เอกสารซื้อ (ใบกำกับภาษี/บิลเงินสด/ยังไม่มีเอกสาร) replaces the old free-text
--      tax_invoice_number + bill_number pair with a single type + optional number.
--   2. วิธีการจ่ายเงิน (บัญชีธนาคารบริษัท/สำรองจ่าย) replaces the old free-text payment_account.
--   3. accounting_office_doc_status is dropped — document tracking now runs off document_type.

alter table hp_payment_lines
  add column document_type text not null default 'ยังไม่มีเอกสาร'
    check (document_type in ('ใบกำกับภาษี', 'บิลเงินสด', 'ยังไม่มีเอกสาร')),
  add column document_number text,
  add column payment_method text
    check (payment_method in ('บัญชีธนาคารบริษัท', 'สำรองจ่าย')),
  add column payment_date date;

update hp_payment_lines set
  document_type = case
    when tax_invoice_number is not null and tax_invoice_number <> '' then 'ใบกำกับภาษี'
    when bill_number is not null and bill_number <> '' then 'บิลเงินสด'
    else 'ยังไม่มีเอกสาร'
  end,
  document_number = coalesce(nullif(tax_invoice_number, ''), nullif(bill_number, '')),
  payment_method = case when advance_payer_name is not null and advance_payer_name <> ''
    then 'สำรองจ่าย' else 'บัญชีธนาคารบริษัท' end;

-- hp_voucher_summary depends on accounting_office_doc_status — repoint it at document_type
-- before dropping the old columns.
create or replace view hp_voucher_summary as
select
  hp_number,
  min(transaction_date) as first_date,
  count(*) as line_count,
  sum(net_paid_amount) as total_net_paid,
  bool_or(work_type = 'สร้างสินทรัพย์') as has_asset_line,
  bool_or(document_type = 'ยังไม่มีเอกสาร') as doc_pending
from hp_payment_lines
group by hp_number;

alter table hp_payment_lines
  drop column tax_invoice_number,
  drop column bill_number,
  drop column payment_account,
  drop column accounting_office_doc_status;

create index idx_hp_doc_pending on hp_payment_lines(document_type)
  where document_type = 'ยังไม่มีเอกสาร';
