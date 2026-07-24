-- Fixed placeholder vendor for freeform bill-entry payees that aren't in the vendor
-- master list — VendorCombobox already supports typing a name with no matching vendor;
-- this gives that path a real, joinable vendor_id instead of leaving it null.
-- default_account_code_id stays null: nullable at the DB level (only required by the
-- vendor form's own Zod schema), and this system row bypasses that form entirely.

insert into vendors (code, name)
values ('V9999', 'ทั่วไป')
on conflict (code) do nothing;
