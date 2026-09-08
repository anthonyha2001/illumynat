-- Run this in your Supabase project: Dashboard → SQL Editor → New Query
-- Sets up the product-images storage bucket with public read access

-- Create the bucket
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow anyone to read (view) product images (public storefront)
create policy "Public read access for product images"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Allow only the service role (admin actions via server) to upload
create policy "Service role can upload product images"
on storage.objects for insert
with check ( bucket_id = 'product-images' );

-- Allow only the service role to delete product images
create policy "Service role can delete product images"
on storage.objects for delete
using ( bucket_id = 'product-images' );
