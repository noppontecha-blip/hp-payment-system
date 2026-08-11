-- วันที่ได้รับใบกำกับภาษีจริง — แยกจาก document_invoice_date (วันที่พิมพ์บนใบกำกับภาษี) เพราะ
-- ใบกำกับภาษีมักมาถึงช้ากว่าวันที่จ่ายเงิน/วันที่ในใบกำกับ ทำให้ยื่นภาษีซื้อไม่ทันเดือนนั้น
-- รายงานภาษีซื้อจะยึดเดือนนี้เป็นหลัก (ถ้ามีค่า) ตามหลักสรรพากรที่ให้เคลมภาษีซื้อในเดือนที่ได้รับ
-- ใบกำกับจริง ย้อนหลังได้ไม่เกิน 6 เดือนจากวันที่ในใบกำกับ
alter table hp_payment_lines
  add column document_received_date date;

create index idx_hp_document_received_date on hp_payment_lines(document_received_date)
  where document_type = 'ใบกำกับภาษี';
