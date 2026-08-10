-- "registered_under" never matched what the field is actually used for (the vehicle's brand,
-- shown in the UI as "รายละเอียดรถ") — renaming to "brand" now while only 1 real vehicle row
-- exists keeps the schema honest instead of leaving a mismatched column name.

alter table vehicles rename column registered_under to brand;
