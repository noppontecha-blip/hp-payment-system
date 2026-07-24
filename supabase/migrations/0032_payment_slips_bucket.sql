-- Private storage bucket for uploaded payment-slip images, same shape as
-- vendor-documents (0013_vendor_documents_bucket.sql).

insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

create policy "authenticated read payment slips"
  on storage.objects for select to authenticated
  using (bucket_id = 'payment-slips');
create policy "authenticated upload payment slips"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-slips');
create policy "authenticated delete payment slips"
  on storage.objects for delete to authenticated
  using (bucket_id = 'payment-slips');
