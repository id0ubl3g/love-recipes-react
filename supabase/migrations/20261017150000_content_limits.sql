-- Love Recipes — limites de conteúdo (lado do servidor)
-- Os mesmos números estão no front-end em src/lib/limits.ts; mude os dois juntos.

-- ─── Listas de texto (ingredientes, passos): quantidade, tamanho e sem itens vazios ───
create function public.text_items_within(items text[], max_items integer, max_length integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(items) <= max_items
    and not exists (
      select 1 from unnest(items) as item
      where char_length(item) > max_length or btrim(item) = ''
    );
$$;

alter table public.recipes
  add constraint recipes_ingredients_limits check (
    cardinality(ingredients) >= 1 and public.text_items_within(ingredients, 50, 150)
  ),
  add constraint recipes_steps_limits check (
    cardinality(steps) >= 1 and public.text_items_within(steps, 30, 600)
  );

-- ─── No máximo 20 categorias criadas por usuário ──────────────────────────────
create function public.enforce_category_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.categories where user_id = new.user_id) >= 20 then
    raise exception 'Você chegou ao limite de 20 categorias. Exclua uma para criar outra.'
      using errcode = 'check_violation', hint = 'category_limit';
  end if;
  return new;
end;
$$;

create trigger categories_enforce_limit
before insert on public.categories
for each row execute function public.enforce_category_limit();
