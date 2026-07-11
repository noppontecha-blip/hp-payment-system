-- วันที่ในใบกำกับภาษี (เฉพาะกรณี document_type = 'ใบกำกับภาษี') — ต้องใช้ทำรายงานภาษีซื้อ
-- แยกจาก transaction_date เพราะวันบันทึกบัญชีกับวันที่บนใบกำกับภาษีอาจไม่ตรงกัน

alter table hp_payment_lines
  add column document_invoice_date date;

create index idx_hp_document_invoice_date on hp_payment_lines(document_invoice_date)
  where document_type = 'ใบกำกับภาษี';
