-- Love Recipes — validação de e-mail no cadastro (lado do servidor)
--
-- O cadastro não exige confirmação por e-mail (o e-mail serve para recuperar a senha).
-- Este hook "Before User Created" roda dentro do Supabase Auth antes de criar cada conta
-- e recusa e-mails inválidos ou descartáveis — mesmo que alguém chame a API direto, sem o app.
-- As mesmas regras de formato existem no front-end (src/lib/validation.ts).

-- ─── Domínios bloqueados: e-mails temporários/descartáveis e domínios reservados ───
create table public.blocked_email_domains (
  domain text primary key check (domain = lower(domain)),
  reason text not null default 'descartável'
);

-- Sem políticas: ninguém lê ou altera pela API; só o Auth (via grant abaixo).
alter table public.blocked_email_domains enable row level security;

insert into public.blocked_email_domains (domain, reason) values
  -- reservados para exemplos/documentação (RFC 2606) — nunca recebem e-mail
  ('example.com', 'reservado'), ('example.org', 'reservado'), ('example.net', 'reservado'),
  ('test.com', 'reservado'), ('teste.com', 'reservado'),
  -- e-mails temporários mais comuns
  ('mailinator.com', 'descartável'), ('guerrillamail.com', 'descartável'), ('guerrillamail.net', 'descartável'),
  ('sharklasers.com', 'descartável'), ('grr.la', 'descartável'), ('10minutemail.com', 'descartável'),
  ('10minutemail.net', 'descartável'), ('temp-mail.org', 'descartável'), ('tempmail.com', 'descartável'),
  ('tempmailo.com', 'descartável'), ('tempail.com', 'descartável'), ('tempr.email', 'descartável'),
  ('yopmail.com', 'descartável'), ('yopmail.net', 'descartável'), ('trashmail.com', 'descartável'),
  ('getnada.com', 'descartável'), ('dispostable.com', 'descartável'), ('maildrop.cc', 'descartável'),
  ('throwawaymail.com', 'descartável'), ('fakeinbox.com', 'descartável'), ('mintemail.com', 'descartável'),
  ('emailondeck.com', 'descartável'), ('mohmal.com', 'descartável'), ('moakt.com', 'descartável'),
  ('burnermail.io', 'descartável'), ('mailnesia.com', 'descartável'), ('mytemp.email', 'descartável'),
  ('discard.email', 'descartável'), ('spamgourmet.com', 'descartável'), ('mailcatch.com', 'descartável'),
  ('inboxkitten.com', 'descartável'), ('emailfake.com', 'descartável'), ('mail.tm', 'descartável'),
  ('mailpoof.com', 'descartável'), ('tmail.ws', 'descartável'), ('linshiyouxiang.net', 'descartável');

grant select on public.blocked_email_domains to supabase_auth_admin;
-- Com RLS ligado, até o Auth precisa de uma política para enxergar a lista.
create policy "auth lê domínios bloqueados" on public.blocked_email_domains
  for select to supabase_auth_admin using (true);

-- ─── Hook: valida o e-mail (e o nome, se vier) antes de criar a conta ───────────
create or replace function public.hook_validate_signup(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
  v_domain text := split_part(v_email, '@', 2);
  v_local text := split_part(v_email, '@', 1);
  v_name text := trim(coalesce(
    event -> 'user' -> 'user_metadata' ->> 'full_name',
    event -> 'user' -> 'raw_user_meta_data' ->> 'full_name',
    ''
  ));
begin
  -- Contas sem e-mail (ex.: login social sem e-mail) não passam por aqui.
  if v_email = '' then
    return '{}'::jsonb;
  end if;

  if char_length(v_email) > 254 or char_length(v_local) > 64
     or v_email !~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$'
     or v_email like '%..%' or v_local like '.%' or v_local like '%.' then
    return jsonb_build_object('error', jsonb_build_object(
      'message', 'Digite um e-mail válido, como voce@email.com.',
      'http_code', 400
    ));
  end if;

  -- Bloqueia o domínio e qualquer subdomínio dele (ex.: x.mailinator.com).
  if exists (
    select 1 from public.blocked_email_domains b
    where v_domain = b.domain or v_domain like '%.' || b.domain
  ) then
    return jsonb_build_object('error', jsonb_build_object(
      'message', 'Use um e-mail pessoal de verdade — e-mails temporários não são aceitos.',
      'http_code', 400
    ));
  end if;

  -- Nome é opcional para o Auth, mas quando vem do app precisa respeitar as regras.
  if v_name <> '' and (char_length(v_name) < 2 or char_length(v_name) > 50) then
    return jsonb_build_object('error', jsonb_build_object(
      'message', 'O nome precisa ter entre 2 e 50 caracteres.',
      'http_code', 400
    ));
  end if;

  return '{}'::jsonb;
end;
$$;

-- Só o Supabase Auth pode executar o hook.
grant execute on function public.hook_validate_signup(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_validate_signup(jsonb) from authenticated, anon, public;

-- Depois de aplicar: ative em Authentication → Hooks → "Before User Created" → Postgres
-- → função public.hook_validate_signup (ou via Management API: hook_before_user_created_*).
