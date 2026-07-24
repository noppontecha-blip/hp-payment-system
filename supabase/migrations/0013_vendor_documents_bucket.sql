-- Private storage bucket for vendor master-file attachments (e.g. สำเนาบัตรประชาชน for
-- individual vendors). Internal tool, matches the "authenticated full access" RLS
-- convention from 0006 — files are served via signed URLs, never public links.

insert into storage.buckets (id, name, public)
values ('vendor-documents', 'vendor-documents', false)
on conflict (id) do nothing;

create policy "authenticated read vendor documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'vendor-documents');
create policy "authenticated upload vendor documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'vendor-documents');
create policy "authenticated delete vendor documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'vendor-documents');
