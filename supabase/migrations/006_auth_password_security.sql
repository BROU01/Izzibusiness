-- 006_auth_password_security.sql
-- But : passer à l'authentification par mot de passe (pseudo + pays) et
--       fermer les failles RLS / RPC des migrations 001 à 005.
--
-- Failles corrigées :
--   1. profiles « Public can view minimal profile » USING (true) exposait
--      téléphone, e-mail et rôle de tous les comptes  → vue public_profiles.
--   2. profiles « Users can update own profile » permettait de se donner
--      role = 'admin' ou is_member = true           → UPDATE limité aux colonnes name/avatar_url.
--   3. Policies admin qui relisent profiles depuis profiles (récursion RLS)
--      → fonction is_admin() SECURITY DEFINER.
--   4. wallets/transactions : l'utilisateur pouvait modifier son solde ou
--      insérer ses propres transactions                → écriture réservée au service_role.
--   5. Fonctions SECURITY DEFINER (credit_wallet, debit_wallet, jeux,
--      notifications, parrainage, programme) appelables par n'importe qui
--      via /rest/v1/rpc avec un p_user_id arbitraire  → EXECUTE réservé au service_role.
--   6. debit_wallet / place_game_bet : lecture puis écriture séparées
--      (double débit possible)                           → UPDATE ... WHERE balance >= montant.
--   7. Aucune clé d'idempotence sur les paiements       → index unique sur transactions.reference_id.
--   8. Vues unread_notification_counts / user_program_streaks exécutées
--      avec les droits du propriétaire (fuite inter-comptes) → security_invoker.
--   9. handle_new_user insérait phone = '' (violait la contrainte) et ne
--      créait pas le wallet                              → trigger réécrit.
--
-- Rollback : exécuter le bloc « ROLLBACK » en fin de fichier (recrée les
-- policies d'origine, retire les colonnes/fonctions ajoutées). Les
-- comptes créés entre-temps gardent leur pseudo dans auth.users.raw_user_meta_data.

begin;

-- ============================================================
-- 1. Rôle admin sans récursion RLS
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ============================================================
-- 2. Profils : pseudo, pays, lecture publique minimale
-- ============================================================
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists country text;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,20}$');

alter table public.profiles drop constraint if exists profiles_country_format;
alter table public.profiles
  add constraint profiles_country_format
  check (country is null or country ~ '^[A-Z]{2}$');

create unique index if not exists profiles_username_key on public.profiles (username);

drop policy if exists "Public can view minimal profile" on public.profiles;
drop policy if exists "Admins manage all profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Un utilisateur ne modifie que son nom affiché et son avatar :
-- role, is_member, referral_code, phone, email restent sous contrôle serveur.
revoke update on public.profiles from anon, authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;

-- Lecture publique (boutiques, classement) : uniquement des champs non sensibles.
-- Vue exécutée avec les droits du propriétaire pour contourner la RLS de
-- profiles, mais elle n'expose ni téléphone, ni e-mail, ni rôle.
create or replace view public.public_profiles
with (security_invoker = false) as
  select id, username, avatar_url, created_at
  from public.profiles
  where username is not null;

revoke all on public.public_profiles from public;
grant select on public.public_profiles to anon, authenticated;

-- ============================================================
-- 3. Wallets & transactions : lecture par le propriétaire,
--    écriture uniquement par le serveur (service_role / fonctions)
-- ============================================================
drop policy if exists "Users can update own wallet" on public.wallets;
drop policy if exists "Users can insert own wallet" on public.wallets;
drop policy if exists "Admins can view all wallets" on public.wallets;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Admins can view all transactions" on public.transactions;

create policy "wallets_admin_select"
  on public.wallets for select
  using (public.is_admin());

create policy "transactions_admin_select"
  on public.transactions for select
  using (public.is_admin());

revoke insert, update, delete on public.wallets from anon, authenticated;
revoke insert, update, delete on public.transactions from anon, authenticated;

-- Idempotence : une référence de paiement externe ne peut être créditée qu'une fois.
create unique index if not exists transactions_reference_id_key
  on public.transactions (reference_id)
  where reference_id is not null;

-- ============================================================
-- 4. Notifications : créées par le serveur, l'utilisateur ne
--    peut que les marquer lues ou les supprimer
-- ============================================================
drop policy if exists "Users can insert own notifications" on public.notifications;
revoke insert on public.notifications from anon, authenticated;
revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- ============================================================
-- 5. Vues : appliquer la RLS de l'appelant
-- ============================================================
alter view if exists public.unread_notification_counts set (security_invoker = true);
alter view if exists public.user_program_streaks set (security_invoker = true);

-- ============================================================
-- 6. Fonctions de solde : atomiques, montants positifs, idempotentes
-- ============================================================
create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount decimal,
  p_type text,
  p_description text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance decimal;
  v_wallet_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Montant invalide');
  end if;

  if p_reference_id is not null and exists (
    select 1 from transactions where reference_id = p_reference_id
  ) then
    return jsonb_build_object('success', true, 'duplicate', true);
  end if;

  insert into wallets (user_id, balance) values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update wallets
  set balance = balance + p_amount
  where user_id = p_user_id
  returning balance, id into v_new_balance, v_wallet_id;

  -- L'index unique sur reference_id annule toute la fonction en cas de course.
  insert into transactions (user_id, type, amount, balance_after, description, reference_id, metadata)
  values (p_user_id, p_type, p_amount, v_new_balance, p_description, p_reference_id, p_metadata);

  return jsonb_build_object('success', true, 'new_balance', v_new_balance, 'wallet_id', v_wallet_id);
end;
$$;

create or replace function public.debit_wallet(
  p_user_id uuid,
  p_amount decimal,
  p_type text,
  p_description text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance decimal;
  v_wallet_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Montant invalide');
  end if;

  -- Vérification et débit en une seule instruction : pas de double débit concurrent.
  update wallets
  set balance = balance - p_amount
  where user_id = p_user_id and balance >= p_amount
  returning balance, id into v_new_balance, v_wallet_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Solde insuffisant');
  end if;

  insert into transactions (user_id, type, amount, balance_after, description, reference_id, metadata)
  values (p_user_id, p_type, -p_amount, v_new_balance, p_description, p_reference_id, p_metadata);

  return jsonb_build_object('success', true, 'new_balance', v_new_balance, 'wallet_id', v_wallet_id);
end;
$$;

create or replace function public.place_game_bet(
  p_user_id uuid,
  p_amount decimal,
  p_game text,
  p_metadata jsonb default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_balance decimal;
  v_new_game_balance decimal;
begin
  if p_amount is null or p_amount <= 0 then
    return jsonb_build_object('success', false, 'error', 'Montant invalide');
  end if;

  update wallets
  set balance = balance - p_amount,
      game_balance = game_balance + p_amount
  where user_id = p_user_id and balance >= p_amount
  returning balance, game_balance into v_new_balance, v_new_game_balance;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Solde insuffisant');
  end if;

  insert into transactions (user_id, type, amount, balance_after, description, metadata)
  values (p_user_id, 'game_bet', -p_amount, v_new_balance, 'Mise : ' || p_game, p_metadata);

  return jsonb_build_object('success', true, 'new_balance', v_new_balance, 'game_balance', v_new_game_balance);
end;
$$;

-- ============================================================
-- 7. Fonctions SECURITY DEFINER : exécution réservée au serveur
--    (Supabase accorde EXECUTE à anon/authenticated par défaut)
-- ============================================================
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.credit_wallet(uuid, numeric, text, text, text, jsonb)',
    'public.debit_wallet(uuid, numeric, text, text, text, jsonb)',
    'public.place_game_bet(uuid, numeric, text, jsonb)',
    'public.collect_game_win(uuid, numeric, text, jsonb)',
    'public.credit_referral_bonus(text, numeric)',
    'public.create_notification(uuid, text, text, text, text, jsonb)',
    'public.mark_all_notifications_read(uuid)',
    'public.toggle_program_day(uuid, integer)',
    'public.cleanup_resolved_contact_messages()',
    'public.generate_referral_code()',
    'public.handle_new_user()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
    execute format('alter function %s set search_path = public', fn);
  end loop;
end;
$$;

-- ============================================================
-- 8. Création du compte : profil + wallet depuis les métadonnées
--    passées à supabase.auth.signUp (route /api/auth/register)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(nullif(btrim(new.raw_user_meta_data->>'username'), ''));
  v_country text := upper(nullif(btrim(new.raw_user_meta_data->>'country'), ''));
  v_phone text := coalesce(nullif(btrim(new.raw_user_meta_data->>'phone'), ''), new.phone);
  v_referred_by text := upper(nullif(btrim(new.raw_user_meta_data->>'referred_by'), ''));
begin
  if v_referred_by is not null
     and not exists (select 1 from profiles where referral_code = v_referred_by) then
    v_referred_by := null;
  end if;

  insert into profiles (id, username, name, email, phone, country, referral_code, referred_by)
  values (
    new.id,
    v_username,
    coalesce(v_username, 'membre'),
    lower(new.email),
    v_phone,
    v_country,
    generate_referral_code(),
    v_referred_by
  )
  on conflict (id) do nothing;

  insert into wallets (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Garde profiles.email aligné quand l'utilisateur change d'adresse.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

revoke execute on function public.handle_user_email_change() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

commit;

-- ============================================================
-- ROLLBACK (à exécuter manuellement si nécessaire)
-- ============================================================
-- begin;
--   drop trigger if exists on_auth_user_email_changed on auth.users;
--   drop function if exists public.handle_user_email_change();
--   drop view if exists public.public_profiles;
--   drop policy if exists "profiles_update_own" on public.profiles;
--   drop policy if exists "profiles_admin_all" on public.profiles;
--   drop policy if exists "wallets_admin_select" on public.wallets;
--   drop policy if exists "transactions_admin_select" on public.transactions;
--   drop index if exists public.transactions_reference_id_key;
--   drop index if exists public.profiles_username_key;
--   alter table public.profiles drop constraint if exists profiles_username_format;
--   alter table public.profiles drop constraint if exists profiles_country_format;
--   alter table public.profiles drop column if exists username;
--   alter table public.profiles drop column if exists country;
--   alter view public.unread_notification_counts reset (security_invoker);
--   alter view public.user_program_streaks reset (security_invoker);
--   -- puis rejouer les CREATE POLICY / CREATE FUNCTION d'origine de 001, 002 et 004.
--   drop function if exists public.is_admin();
-- commit;
