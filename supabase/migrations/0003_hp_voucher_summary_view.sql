-- Summary view per HP number, always fresh (no separate header table)

create view hp_voucher_summary as
select
  hp_number,
  min(transaction_date) as first_date,
  count(*) as line_count,
  sum(net_paid_amount) as total_net_paid,
  bool_or(work_type = 'สร้างสินทรัพย์') as has_asset_line,
  bool_or(accounting_office_doc_status = 'รอเอกสารจากสนง.บัญชี') as doc_pending
from hp_payment_lines
group by hp_number;
