-- Love Recipes — fotos privadas
-- O bucket deixa de ser público: cada usuário só lê as próprias fotos, por URL assinada.
-- No banco, image_url passa a guardar só o caminho no bucket (<user_id>/<arquivo>.jpg).

update storage.buckets set public = false where id = 'recipe-images';

create policy "recipe-images: dono lê" on storage.objects for select to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Fotos já enviadas: troca a URL pública pelo caminho.
update public.recipes
set image_url = substring(image_url from '/storage/v1/object/public/recipe-images/([^?]+)$')
where image_url like '%/storage/v1/object/public/recipe-images/%';

-- A foto precisa estar na pasta do dono da receita.
alter table public.recipes
  add constraint recipes_image_in_owner_folder check (
    image_url is null or starts_with(image_url, user_id::text || '/')
  );
