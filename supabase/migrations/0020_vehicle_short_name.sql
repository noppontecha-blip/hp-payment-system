-- ชื่อย่อ: a short, memorable name used when picking a vehicle elsewhere in the app (e.g. the
-- bill-entry line-item vehicle selector) so users don't have to type/scan the longer code.
alter table vehicles add column short_name text;
