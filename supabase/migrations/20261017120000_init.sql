-- Love Recipes — esquema inicial
-- Cada usuário logado só enxerga e altera as próprias linhas (RLS).

-- ─── Perfil: marca que a conta já foi preparada (importação da versão antiga) ─
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ─── Categorias criadas pelo usuário (as padrão vivem no app) ────────────────
create table public.categories (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  label text not null check (char_length(label) between 1 and 24),
  icon text not null default 'utensils',
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ─── Receitas ────────────────────────────────────────────────────────────────
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 160),
  category text not null,
  image_url text,
  prep_minutes integer not null default 0 check (prep_minutes between 0 and 9999),
  oven_minutes integer not null default 0 check (oven_minutes between 0 and 9999),
  fridge_minutes integer not null default 0 check (fridge_minutes between 0 and 9999),
  rest_minutes integer not null default 0 check (rest_minutes between 0 and 9999),
  servings integer not null default 1 check (servings between 1 and 999),
  difficulty text not null default 'facil' check (difficulty in ('facil', 'medio', 'dificil')),
  ingredients text[] not null default '{}',
  steps text[] not null default '{}',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_user_created_idx on public.recipes (user_id, created_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

-- ─── Acesso via Data API ─────────────────────────────────────────────────────
grant select, insert, update, delete on public.profiles, public.categories, public.recipes to authenticated;

-- ─── RLS: cada um com o seu ──────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.recipes enable row level security;

create policy "profiles: dono lê" on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "profiles: dono cria" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "categories: dono lê" on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "categories: dono cria" on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "categories: dono altera" on public.categories for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories: dono exclui" on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "recipes: dono lê" on public.recipes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "recipes: dono cria" on public.recipes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "recipes: dono altera" on public.recipes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recipes: dono exclui" on public.recipes for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ─── Fotos: bucket público para leitura; cada um grava só na própria pasta ───
-- Caminho dos arquivos: <user_id>/<arquivo>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-images', 'recipe-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "recipe-images: dono envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recipe-images: dono substitui" on storage.objects for update to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "recipe-images: dono exclui" on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
