-- 001_schema.sql — schéma complet d'Izzibusiness sur Neon (PostgreSQL).
--
-- Remplace les migrations Supabase 001 à 007 (supprimées). Différences :
--   * Les comptes sont gérés par Better Auth (tables "user", "session",
--     "account", "verification") au lieu de auth.users.
--   * Pas de Row Level Security : la base n'est jamais exposée au navigateur.
--     Seul le serveur Next.js s'y connecte (DATABASE_URL, côté serveur) et
--     chaque route vérifie la session et le rôle avant toute requête.
--   * Les identifiants de compte sont des text (format Better Auth).
--
-- Tout mouvement d'argent passe par une fonction SQL atomique (une seule
-- transaction) et idempotente (transactions.reference_id unique).
--
-- Appliquée par `npm run db:migrate` (scripts/migrate.mjs), qui la rejoue
-- une seule fois grâce à la table schema_migrations.
-- Rollback : base vide → `drop schema public cascade; create schema public;`.

-- ============================================================
-- 1. Comptes (Better Auth 1.7, plugin username)
-- ============================================================
create table "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null,
  "image" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null,
  "username" text unique,
  "displayUsername" text
);

create table "session" (
  "id" text not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create table "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz not null
);

create table "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default current_timestamp not null,
  "updatedAt" timestamptz default current_timestamp not null
);

create index "session_userId_idx" on "session" ("userId");
create index "account_userId_idx" on "account" ("userId");
create index "verification_identifier_idx" on "verification" ("identifier");

create function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 2. Profils (données métier du compte ; pseudo et e-mail sont dans "user")
-- ============================================================
create table profiles (
  id text primary key references "user" ("id") on delete cascade,
  phone text not null unique check (phone ~ '^\+[0-9]{8,15}$'),
  country text not null check (country ~ '^[A-Z]{2}$'),
  role text not null default 'user' check (role in ('user', 'admin')),
  is_member boolean not null default false,
  is_banned boolean not null default false,
  referral_code text not null unique,
  referred_by text,
  avatar_url text,
  games_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_referred_by_idx on profiles (referred_by);

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

-- ============================================================
-- 3. Wallets et historique
-- ============================================================
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references "user" ("id") on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  game_balance numeric(12, 2) not null default 0 check (game_balance >= 0),
  currency text not null default 'FCFA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_wallets_updated_at
  before update on wallets
  for each row execute function update_updated_at_column();

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  type text not null check (type in (
    'deposit', 'withdraw', 'withdraw_refund', 'game_bet', 'game_win',
    'mission_reward', 'referral_bonus', 'purchase', 'membership', 'adjustment'
  )),
  amount numeric(12, 2) not null,
  balance_after numeric(12, 2) not null,
  description text,
  -- Idempotence : une référence (pd:<token>, win:<partie>…) ne sert qu'une fois.
  reference_id text unique,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index transactions_user_idx on transactions (user_id, created_at desc);
create index transactions_type_idx on transactions (type);

-- ============================================================
-- 4. Notifications, messages de contact, programme 20 jours
-- ============================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in
    ('info', 'success', 'warning', 'error', 'transaction', 'game', 'referral')),
  read boolean not null default false,
  action_url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, created_at desc);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  email text check (email is null or char_length(btrim(email)) between 5 and 120),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index contact_messages_status_idx on contact_messages (status, created_at desc);

create table program_progress (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  day integer not null check (day between 1 and 20),
  completed_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ============================================================
-- 5. Réglages modifiables par l'admin
-- ============================================================
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text references "user" ("id") on delete set null
);

insert into app_settings (key, value) values
  ('games_enabled', '{"spin": true, "apple": true, "aviator": true}'::jsonb);

-- ============================================================
-- 6. Paiements PayDunya (dépôt, adhésion) et retraits
-- ============================================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  kind text not null check (kind in ('deposit', 'membership')),
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'cancelled')),
  provider text not null default 'paydunya',
  provider_token text unique,
  checkout_url text,
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index payments_user_idx on payments (user_id, created_at desc);
create index payments_status_idx on payments (status, created_at desc);

create table withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  fee numeric(12, 2) not null default 0 check (fee >= 0),
  phone text not null,
  withdraw_mode text not null,
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'paid', 'rejected', 'failed')),
  disburse_token text,
  provider_ref text,
  provider_payload jsonb,
  admin_note text,
  reviewed_by text references "user" ("id") on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index withdrawals_user_idx on withdrawals (user_id, created_at desc);
create index withdrawals_status_idx on withdrawals (status, created_at);
-- Un seul retrait en cours par membre.
create unique index withdrawals_one_open
  on withdrawals (user_id) where status in ('requested', 'processing');

create trigger update_withdrawals_updated_at
  before update on withdrawals
  for each row execute function update_updated_at_column();

-- ============================================================
-- 7. Parties de jeu (résultat tiré par le serveur)
-- ============================================================
create table game_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  game text not null check (game in ('spin', 'apple', 'aviator')),
  bet numeric(12, 2) not null check (bet > 0),
  status text not null default 'active' check (status in ('active', 'won', 'lost')),
  multiplier numeric(10, 2) not null default 0,
  payout numeric(12, 2) not null default 0 check (payout >= 0),
  public_state jsonb not null default '{}',
  -- Secret tant que la partie est active (point de crash, cases pourries).
  secret_state jsonb not null default '{}',
  server_seed text not null,
  server_seed_hash text not null,
  version integer not null default 0,
  started_at timestamptz not null default now(),
  settled_at timestamptz
);

create index game_rounds_user_idx on game_rounds (user_id, started_at desc);
create index game_rounds_game_idx on game_rounds (game, started_at desc);
-- Une seule partie en cours par jeu et par joueur.
create unique index game_rounds_one_active
  on game_rounds (user_id, game) where status = 'active';

-- ============================================================
-- 8. Missions rémunérées
-- ============================================================
create table missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  proof_instructions text not null check (char_length(btrim(proof_instructions)) between 5 and 500),
  reward numeric(12, 2) not null check (reward > 0),
  max_completions integer check (max_completions is null or max_completions > 0),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_by text references "user" ("id") on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_missions_updated_at
  before update on missions
  for each row execute function update_updated_at_column();

create table mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references missions (id) on delete cascade,
  user_id text not null references "user" ("id") on delete cascade,
  proof text not null check (char_length(btrim(proof)) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by text references "user" ("id") on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (mission_id, user_id)
);

create index mission_submissions_status_idx on mission_submissions (status, created_at);

-- ============================================================
-- 9. Formations : catalogue et demandes d'inscription
-- ============================================================
create table courses (
  slug text primary key check (slug ~ '^[a-z0-9-]{3,80}$'),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '',
  duration_weeks integer not null default 1 check (duration_weeks between 1 and 52),
  price_fcfa numeric(12, 2) not null default 0 check (price_fcfa >= 0),
  level text not null default 'debutant',
  category text not null default 'general',
  image_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table course_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user" ("id") on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone text not null check (char_length(btrim(phone)) between 6 and 20),
  goal text check (goal is null or char_length(goal) <= 1000),
  level text not null default 'debutant',
  formation text not null check (char_length(btrim(formation)) between 1 and 80),
  payment_method text,
  status text not null default 'new' check (status in ('new', 'contacted', 'enrolled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index course_registrations_created_idx on course_registrations (created_at desc);

-- ============================================================
-- 10. Fonctions métier
-- ============================================================

-- 10.1 Code de parrainage unique (IZZ + 6 caractères).
create function generate_referral_code()
returns text
language plpgsql
as $$
declare
  v_code text;
begin
  loop
    v_code := 'IZZ' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from profiles where referral_code = v_code);
  end loop;
  return v_code;
end;
$$;

-- 10.2 Création du profil et du wallet juste après l'inscription Better Auth.
create function create_member(
  p_user_id text,
  p_phone text,
  p_country text,
  p_referred_by text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_referred_by text := upper(nullif(btrim(p_referred_by), ''));
  v_code text;
begin
  if v_referred_by is not null
     and not exists (select 1 from profiles where referral_code = v_referred_by) then
    v_referred_by := null;
  end if;

  insert into profiles (id, phone, country, referral_code, referred_by)
  values (p_user_id, p_phone, upper(p_country), generate_referral_code(), v_referred_by)
  returning referral_code into v_code;

  insert into wallets (user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  return jsonb_build_object('success', true, 'referral_code', v_code);
end;
$$;

-- 10.3 Crédit et débit du wallet : atomiques, montants positifs, idempotents.
create function credit_wallet(
  p_user_id text,
  p_amount numeric,
  p_type text,
  p_description text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'
)
returns jsonb
language plpgsql
as $$
declare
  v_new_balance numeric;
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

  insert into wallets (user_id) values (p_user_id)
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

create function debit_wallet(
  p_user_id text,
  p_amount numeric,
  p_type text,
  p_description text default null,
  p_reference_id text default null,
  p_metadata jsonb default '{}'
)
returns jsonb
language plpgsql
as $$
declare
  v_new_balance numeric;
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

-- 10.4 Notification.
create function create_notification(
  p_user_id text,
  p_title text,
  p_message text,
  p_type text default 'info',
  p_action_url text default null,
  p_metadata jsonb default '{}'
)
returns uuid
language sql
as $$
  insert into notifications (user_id, title, message, type, action_url, metadata)
  values (p_user_id, p_title, p_message, p_type, p_action_url, p_metadata)
  returning id;
$$;

-- 10.5 Paiement PayDunya confirmé : crédit wallet ou activation adhésion.
create function complete_payment(
  p_token text,
  p_payload jsonb default '{}',
  p_referral_bonus numeric default 0
)
returns jsonb
language plpgsql
as $$
declare
  v_payment payments%rowtype;
  v_sponsor_code text;
  v_sponsor_id text;
begin
  -- Verrou de ligne : deux IPN simultanées ne créditent qu'une fois.
  select * into v_payment from payments where provider_token = p_token for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Paiement inconnu');
  end if;
  if v_payment.status = 'completed' then
    return jsonb_build_object('success', true, 'duplicate', true);
  end if;

  update payments
  set status = 'completed', completed_at = now(), provider_payload = p_payload
  where id = v_payment.id;

  if v_payment.kind = 'deposit' then
    perform credit_wallet(v_payment.user_id, v_payment.amount, 'deposit',
      'Dépôt PayDunya', 'pd:' || p_token, jsonb_build_object('payment_id', v_payment.id));
  else
    -- Adhésion payée directement chez PayDunya : le wallet n'est pas touché,
    -- la trace est la ligne payments.
    update profiles set is_member = true where id = v_payment.user_id
    returning referred_by into v_sponsor_code;

    select id into v_sponsor_id from profiles where referral_code = v_sponsor_code;
    if v_sponsor_id is not null and p_referral_bonus > 0 then
      perform credit_wallet(v_sponsor_id, p_referral_bonus, 'referral_bonus',
        'Bonus parrainage : filleul adhérent', 'ref-bonus:' || v_payment.user_id, '{}');
    end if;
  end if;

  return jsonb_build_object('success', true, 'kind', v_payment.kind, 'user_id', v_payment.user_id);
end;
$$;

create function fail_payment(p_token text, p_status text, p_payload jsonb default '{}')
returns void
language sql
as $$
  update payments
  set status = p_status, provider_payload = p_payload
  where provider_token = p_token and status = 'pending'
    and p_status in ('failed', 'cancelled');
$$;

-- 10.6 Adhésion payée avec le solde du wallet.
create function pay_membership_from_wallet(
  p_user_id text,
  p_fee numeric,
  p_referral_bonus numeric
)
returns jsonb
language plpgsql
as $$
declare
  v_profile profiles%rowtype;
  v_debit jsonb;
  v_sponsor_id text;
begin
  select * into v_profile from profiles where id = p_user_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Profil introuvable');
  end if;
  if v_profile.is_member then
    return jsonb_build_object('success', false, 'error', 'Adhésion déjà active');
  end if;

  v_debit := debit_wallet(p_user_id, p_fee, 'membership', 'Adhésion Izzibusiness',
    'membership:' || p_user_id, '{}');
  if not (v_debit->>'success')::boolean then
    return v_debit;
  end if;

  update profiles set is_member = true where id = p_user_id;

  select id into v_sponsor_id from profiles where referral_code = v_profile.referred_by;
  if v_sponsor_id is not null and p_referral_bonus > 0 then
    perform credit_wallet(v_sponsor_id, p_referral_bonus, 'referral_bonus',
      'Bonus parrainage : filleul adhérent', 'ref-bonus:' || p_user_id, '{}');
  end if;

  return jsonb_build_object('success', true, 'new_balance', v_debit->'new_balance');
end;
$$;

-- 10.7 Demande de retrait : montant + frais bloqués immédiatement.
create function request_withdrawal(
  p_user_id text,
  p_amount numeric,
  p_fee numeric,
  p_phone text,
  p_mode text
)
returns jsonb
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
  v_debit jsonb;
begin
  if exists (
    select 1 from withdrawals
    where user_id = p_user_id and status in ('requested', 'processing')
  ) then
    return jsonb_build_object('success', false, 'error', 'Un retrait est déjà en cours');
  end if;

  v_debit := debit_wallet(p_user_id, p_amount + p_fee, 'withdraw',
    'Retrait Mobile Money', 'wd:' || v_id,
    jsonb_build_object('amount', p_amount, 'fee', p_fee));
  if not (v_debit->>'success')::boolean then
    return v_debit;
  end if;

  insert into withdrawals (id, user_id, amount, fee, phone, withdraw_mode)
  values (v_id, p_user_id, p_amount, p_fee, p_phone, p_mode);

  return jsonb_build_object('success', true, 'withdrawal_id', v_id,
    'new_balance', v_debit->'new_balance');
end;
$$;

-- 10.8 Retrait refusé ou échoué : remboursement intégral (une seule fois).
create function refund_withdrawal(
  p_id uuid,
  p_status text,
  p_note text,
  p_admin text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_wd withdrawals%rowtype;
begin
  if p_status not in ('rejected', 'failed') then
    return jsonb_build_object('success', false, 'error', 'Statut invalide');
  end if;

  select * into v_wd from withdrawals where id = p_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Retrait introuvable');
  end if;
  if v_wd.status not in ('requested', 'processing') then
    return jsonb_build_object('success', false, 'error', 'Retrait déjà clôturé');
  end if;

  update withdrawals
  set status = p_status, admin_note = p_note, reviewed_by = coalesce(p_admin, reviewed_by)
  where id = p_id;

  perform credit_wallet(v_wd.user_id, v_wd.amount + v_wd.fee, 'withdraw_refund',
    'Retrait annulé : montant restitué', 'wd-refund:' || p_id, '{}');

  return jsonb_build_object('success', true);
end;
$$;

-- 10.9 Jeu instantané (roue) : mise, tirage et gain dans une seule transaction.
create function play_instant_round(
  p_user_id text,
  p_game text,
  p_bet numeric,
  p_multiplier numeric,
  p_public_state jsonb,
  p_server_seed text,
  p_server_seed_hash text
)
returns jsonb
language plpgsql
as $$
declare
  v_round_id uuid := gen_random_uuid();
  v_debit jsonb;
  v_payout numeric := round(p_bet * p_multiplier, 2);
  v_balance numeric;
begin
  v_debit := debit_wallet(p_user_id, p_bet, 'game_bet', 'Mise : ' || p_game,
    'bet:' || v_round_id, '{}');
  if not (v_debit->>'success')::boolean then
    return v_debit;
  end if;
  v_balance := (v_debit->>'new_balance')::numeric;

  insert into game_rounds (id, user_id, game, bet, status, multiplier, payout,
    public_state, server_seed, server_seed_hash, settled_at)
  values (v_round_id, p_user_id, p_game, p_bet,
    case when v_payout > 0 then 'won' else 'lost' end,
    p_multiplier, v_payout, p_public_state, p_server_seed, p_server_seed_hash, now());

  if v_payout > 0 then
    v_balance := ((credit_wallet(p_user_id, v_payout, 'game_win', 'Gain : ' || p_game,
      'win:' || v_round_id, '{}'))->>'new_balance')::numeric;
  end if;

  return jsonb_build_object('success', true, 'round_id', v_round_id,
    'payout', v_payout, 'new_balance', v_balance);
end;
$$;

-- 10.10 Jeu en plusieurs étapes : ouverture de partie (mise débitée).
create function open_round(
  p_user_id text,
  p_game text,
  p_bet numeric,
  p_public_state jsonb,
  p_secret_state jsonb,
  p_server_seed text,
  p_server_seed_hash text
)
returns jsonb
language plpgsql
as $$
declare
  v_round_id uuid := gen_random_uuid();
  v_debit jsonb;
begin
  if exists (select 1 from game_rounds where user_id = p_user_id and game = p_game and status = 'active') then
    return jsonb_build_object('success', false, 'error', 'Une partie est déjà en cours');
  end if;

  v_debit := debit_wallet(p_user_id, p_bet, 'game_bet', 'Mise : ' || p_game,
    'bet:' || v_round_id, '{}');
  if not (v_debit->>'success')::boolean then
    return v_debit;
  end if;

  insert into game_rounds (id, user_id, game, bet, public_state, secret_state,
    server_seed, server_seed_hash)
  values (v_round_id, p_user_id, p_game, p_bet, p_public_state, p_secret_state,
    p_server_seed, p_server_seed_hash);

  return jsonb_build_object('success', true, 'round_id', v_round_id,
    'new_balance', v_debit->'new_balance', 'started_at', now());
end;
$$;

-- 10.11 Clôture d'une partie : gagnée (gain crédité) ou perdue. Une seule fois.
create function settle_round(
  p_round_id uuid,
  p_status text,
  p_multiplier numeric,
  p_public_state jsonb
)
returns jsonb
language plpgsql
as $$
declare
  v_round game_rounds%rowtype;
  v_payout numeric := 0;
  v_balance numeric;
begin
  if p_status not in ('won', 'lost') then
    return jsonb_build_object('success', false, 'error', 'Statut invalide');
  end if;

  select * into v_round from game_rounds where id = p_round_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Partie introuvable');
  end if;
  if v_round.status <> 'active' then
    return jsonb_build_object('success', false, 'error', 'Partie déjà terminée',
      'status', v_round.status);
  end if;

  if p_status = 'won' then
    v_payout := round(v_round.bet * p_multiplier, 2);
  end if;

  update game_rounds
  set status = p_status,
      multiplier = case when p_status = 'won' then p_multiplier else 0 end,
      payout = v_payout,
      public_state = p_public_state,
      settled_at = now()
  where id = p_round_id;

  if v_payout > 0 then
    v_balance := ((credit_wallet(v_round.user_id, v_payout, 'game_win',
      'Gain : ' || v_round.game, 'win:' || p_round_id, '{}'))->>'new_balance')::numeric;
  end if;

  return jsonb_build_object('success', true, 'payout', v_payout, 'new_balance', v_balance);
end;
$$;

-- 10.12 Avancée d'une partie sans clôture (case révélée) : verrou optimiste.
create function advance_round(
  p_round_id uuid,
  p_expected_version integer,
  p_public_state jsonb
)
returns boolean
language sql
as $$
  with updated as (
    update game_rounds
    set public_state = p_public_state, version = version + 1
    where id = p_round_id and status = 'active' and version = p_expected_version
    returning 1
  )
  select exists (select 1 from updated);
$$;

-- 10.13 Mission validée : récompense créditée une seule fois.
create function review_mission_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_note text,
  p_admin text
)
returns jsonb
language plpgsql
as $$
declare
  v_sub mission_submissions%rowtype;
  v_mission missions%rowtype;
begin
  select * into v_sub from mission_submissions where id = p_submission_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Soumission introuvable');
  end if;
  if v_sub.status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Soumission déjà traitée');
  end if;

  select * into v_mission from missions where id = v_sub.mission_id;

  update mission_submissions
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = p_note, reviewed_by = p_admin, reviewed_at = now()
  where id = p_submission_id;

  if p_approve then
    perform credit_wallet(v_sub.user_id, v_mission.reward, 'mission_reward',
      'Mission : ' || v_mission.title, 'mission:' || p_submission_id, '{}');
  end if;

  return jsonb_build_object('success', true, 'user_id', v_sub.user_id,
    'reward', case when p_approve then v_mission.reward else 0 end);
end;
$$;

-- 10.14 Ajustement manuel de solde par l'admin (trace obligatoire).
create function admin_adjust_balance(
  p_user_id text,
  p_amount numeric,
  p_reason text,
  p_admin text
)
returns jsonb
language plpgsql
as $$
declare
  v_ref text := 'adjust:' || gen_random_uuid();
  v_meta jsonb := jsonb_build_object('admin', p_admin, 'reason', p_reason);
begin
  if p_amount = 0 or p_reason is null or char_length(btrim(p_reason)) < 5 then
    return jsonb_build_object('success', false, 'error', 'Montant ou motif invalide');
  end if;
  if p_amount > 0 then
    return credit_wallet(p_user_id, p_amount, 'adjustment', 'Ajustement : ' || p_reason, v_ref, v_meta);
  end if;
  return debit_wallet(p_user_id, -p_amount, 'adjustment', 'Ajustement : ' || p_reason, v_ref, v_meta);
end;
$$;

-- 10.15 Statistiques du tableau de bord admin.
create function admin_stats(p_since timestamptz default now() - interval '30 days')
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'users', (select count(*) from profiles),
    'members', (select count(*) from profiles where is_member),
    'banned', (select count(*) from profiles where is_banned),
    'balances', (select coalesce(sum(balance), 0) from wallets),
    'deposits', (select coalesce(sum(amount), 0) from payments
                 where kind = 'deposit' and status = 'completed' and completed_at >= p_since),
    'memberships', (select coalesce(sum(amount), 0) from payments
                    where kind = 'membership' and status = 'completed' and completed_at >= p_since),
    'withdrawals_paid', (select coalesce(sum(amount), 0) from withdrawals
                         where status = 'paid' and updated_at >= p_since),
    'withdrawals_pending', (select count(*) from withdrawals where status in ('requested', 'processing')),
    'withdrawals_pending_amount', (select coalesce(sum(amount), 0) from withdrawals
                                   where status in ('requested', 'processing')),
    'game_bets', (select coalesce(sum(bet), 0) from game_rounds where started_at >= p_since),
    'game_payouts', (select coalesce(sum(payout), 0) from game_rounds where started_at >= p_since),
    'game_rounds', (select count(*) from game_rounds where started_at >= p_since),
    'missions_open', (select count(*) from missions where status = 'open'),
    'submissions_pending', (select count(*) from mission_submissions where status = 'pending'),
    'messages_new', (select count(*) from contact_messages where status = 'new'),
    'registrations_new', (select count(*) from course_registrations where status = 'new')
  );
$$;

-- ============================================================
-- 11. Limitation de débit (connexion, inscription, mot de passe oublié)
-- ============================================================
create table rate_limits (
  key text primary key,
  hits integer not null,
  reset_at timestamptz not null
);

-- Compte une tentative ; renvoie false si la limite de la fenêtre est dépassée.
create function hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language sql
as $$
  insert into rate_limits as r (key, hits, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update
    set hits = case when r.reset_at < now() then 1 else r.hits + 1 end,
        reset_at = case when r.reset_at < now()
                        then now() + make_interval(secs => p_window_seconds)
                        else r.reset_at end
  returning hits <= p_max;
$$;
