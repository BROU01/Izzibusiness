-- 007_payments_games_missions.sql
-- But : paiements PayDunya (dépôt, adhésion), retraits avec validation admin,
--       jeux à mises réelles tirés côté serveur, missions rémunérées,
--       réglages admin et bannissement de compte.
--
-- Principe : tout mouvement d'argent passe par une fonction SECURITY DEFINER
-- exécutable uniquement par service_role, atomique (une transaction SQL) et
-- idempotente (reference_id unique dans transactions, cf. migration 006).
--
-- Rollback : bloc « ROLLBACK » en fin de fichier.

begin;

-- ============================================================
-- 0. Types de transaction supplémentaires
-- ============================================================
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check
  check (type in (
    'deposit', 'withdraw', 'withdraw_refund', 'game_bet', 'game_win',
    'mission_reward', 'referral_bonus', 'purchase', 'membership', 'adjustment'
  ));

-- ============================================================
-- 1. Profils : bannissement et accord jeux d'argent
-- ============================================================
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists games_accepted_at timestamptz;

-- ============================================================
-- 2. Réglages modifiables par l'admin (interrupteurs des jeux…)
-- ============================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

create policy "app_settings_read_authenticated"
  on public.app_settings for select
  to authenticated
  using (true);

revoke insert, update, delete on public.app_settings from anon, authenticated;

insert into public.app_settings (key, value) values
  ('games_enabled', '{"spin": true, "apple": true, "aviator": true}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- 3. Paiements entrants PayDunya (dépôt wallet, adhésion)
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

create index if not exists payments_user_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

alter table public.payments enable row level security;

create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);
create policy "payments_admin_select" on public.payments
  for select using (public.is_admin());

revoke insert, update, delete on public.payments from anon, authenticated;

-- ============================================================
-- 4. Retraits (montant bloqué à la demande, payé après validation admin)
-- ============================================================
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists withdrawals_user_idx on public.withdrawals (user_id, created_at desc);
create index if not exists withdrawals_status_idx on public.withdrawals (status, created_at);

drop trigger if exists update_withdrawals_updated_at on public.withdrawals;
create trigger update_withdrawals_updated_at
  before update on public.withdrawals
  for each row execute function update_updated_at_column();

alter table public.withdrawals enable row level security;

create policy "withdrawals_select_own" on public.withdrawals
  for select using (auth.uid() = user_id);
create policy "withdrawals_admin_select" on public.withdrawals
  for select using (public.is_admin());

revoke insert, update, delete on public.withdrawals from anon, authenticated;

-- ============================================================
-- 5. Parties de jeu (résultat tiré par le serveur)
-- ============================================================
create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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

create index if not exists game_rounds_user_idx on public.game_rounds (user_id, started_at desc);
create index if not exists game_rounds_game_idx on public.game_rounds (game, started_at desc);
-- Une seule partie en cours par jeu et par joueur.
create unique index if not exists game_rounds_one_active
  on public.game_rounds (user_id, game) where status = 'active';

alter table public.game_rounds enable row level security;

create policy "game_rounds_select_own" on public.game_rounds
  for select using (auth.uid() = user_id);
create policy "game_rounds_admin_select" on public.game_rounds
  for select using (public.is_admin());

-- Le joueur ne lit jamais la graine ni l'état secret via l'API REST.
revoke all on public.game_rounds from anon, authenticated;
grant select (id, user_id, game, bet, status, multiplier, payout, public_state,
              server_seed_hash, started_at, settled_at)
  on public.game_rounds to authenticated;

-- ============================================================
-- 6. Missions rémunérées
-- ============================================================
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  proof_instructions text not null check (char_length(btrim(proof_instructions)) between 5 and 500),
  reward numeric(12, 2) not null check (reward > 0),
  max_completions integer check (max_completions is null or max_completions > 0),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists update_missions_updated_at on public.missions;
create trigger update_missions_updated_at
  before update on public.missions
  for each row execute function update_updated_at_column();

create table if not exists public.mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proof text not null check (char_length(btrim(proof)) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (mission_id, user_id)
);

create index if not exists mission_submissions_status_idx
  on public.mission_submissions (status, created_at);

alter table public.missions enable row level security;
alter table public.mission_submissions enable row level security;

create policy "missions_select_open" on public.missions
  for select to authenticated using (status = 'open');
create policy "missions_admin_select" on public.missions
  for select using (public.is_admin());

create policy "mission_submissions_select_own" on public.mission_submissions
  for select using (auth.uid() = user_id);
create policy "mission_submissions_admin_select" on public.mission_submissions
  for select using (public.is_admin());

revoke insert, update, delete on public.missions from anon, authenticated;
revoke insert, update, delete on public.mission_submissions from anon, authenticated;

-- ============================================================
-- 6b. Formations : catalogue et demandes d'inscription
--     (tables lues/écrites par src/app/formations/page.tsx)
-- ============================================================
create table if not exists public.courses (
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

alter table public.courses enable row level security;

create policy "courses_select_published" on public.courses
  for select to authenticated using (is_published);
create policy "courses_admin_select" on public.courses
  for select using (public.is_admin());

revoke insert, update, delete on public.courses from anon, authenticated;

create table if not exists public.course_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  phone text not null check (char_length(btrim(phone)) between 6 and 20),
  goal text check (goal is null or char_length(goal) <= 1000),
  level text not null default 'debutant',
  formation text not null check (char_length(btrim(formation)) between 1 and 80),
  payment_method text,
  status text not null default 'new' check (status in ('new', 'contacted', 'enrolled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists course_registrations_created_idx
  on public.course_registrations (created_at desc);

alter table public.course_registrations enable row level security;

create policy "course_registrations_insert_own" on public.course_registrations
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'new');
create policy "course_registrations_select_own" on public.course_registrations
  for select using (auth.uid() = user_id);
create policy "course_registrations_admin_select" on public.course_registrations
  for select using (public.is_admin());

revoke update, delete on public.course_registrations from anon, authenticated;

-- ============================================================
-- 7. Messages de contact : lisibles par l'admin
-- ============================================================
create policy "contact_messages_admin_select" on public.contact_messages
  for select using (public.is_admin());

-- ============================================================
-- 8. Fonctions d'argent (service_role uniquement)
-- ============================================================

-- 8.1 Paiement PayDunya confirmé : crédit wallet ou activation adhésion.
create or replace function public.complete_payment(
  p_token text,
  p_payload jsonb default '{}',
  p_referral_bonus numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_sponsor_code text;
  v_sponsor_id uuid;
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

create or replace function public.fail_payment(p_token text, p_status text, p_payload jsonb default '{}')
returns void
language sql
security definer
set search_path = public
as $$
  update payments
  set status = p_status, provider_payload = p_payload
  where provider_token = p_token and status = 'pending'
    and p_status in ('failed', 'cancelled');
$$;

-- 8.2 Adhésion payée avec le solde du wallet.
create or replace function public.pay_membership_from_wallet(
  p_user_id uuid,
  p_fee numeric,
  p_referral_bonus numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile profiles%rowtype;
  v_debit jsonb;
  v_sponsor_id uuid;
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

-- 8.3 Demande de retrait : montant + frais bloqués immédiatement.
create or replace function public.request_withdrawal(
  p_user_id uuid,
  p_amount numeric,
  p_fee numeric,
  p_phone text,
  p_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.4 Retrait refusé ou échoué : remboursement intégral (une seule fois).
create or replace function public.refund_withdrawal(
  p_id uuid,
  p_status text,
  p_note text,
  p_admin uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.5 Jeu instantané (roue) : mise, tirage et gain dans une seule transaction.
create or replace function public.play_instant_round(
  p_user_id uuid,
  p_game text,
  p_bet numeric,
  p_multiplier numeric,
  p_public_state jsonb,
  p_server_seed text,
  p_server_seed_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.6 Jeu en plusieurs étapes : ouverture de partie (mise débitée).
create or replace function public.open_round(
  p_user_id uuid,
  p_game text,
  p_bet numeric,
  p_public_state jsonb,
  p_secret_state jsonb,
  p_server_seed text,
  p_server_seed_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.7 Clôture d'une partie : gagnée (gain crédité) ou perdue. Une seule fois.
create or replace function public.settle_round(
  p_round_id uuid,
  p_status text,
  p_multiplier numeric,
  p_public_state jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.8 Avancée d'une partie sans clôture (case révélée) : verrou optimiste.
create or replace function public.advance_round(
  p_round_id uuid,
  p_expected_version integer,
  p_public_state jsonb
)
returns boolean
language sql
security definer
set search_path = public
as $$
  with updated as (
    update game_rounds
    set public_state = p_public_state, version = version + 1
    where id = p_round_id and status = 'active' and version = p_expected_version
    returning 1
  )
  select exists (select 1 from updated);
$$;

-- 8.9 Mission validée : récompense créditée une seule fois.
create or replace function public.review_mission_submission(
  p_submission_id uuid,
  p_approve boolean,
  p_note text,
  p_admin uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- 8.10 Ajustement manuel de solde par l'admin (trace obligatoire).
create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_reason text,
  p_admin uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
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

-- ============================================================
-- 9. Statistiques admin (droits de l'appelant : la RLS is_admin()
--    donne tout à l'admin, un membre ne verrait que ses propres lignes)
-- ============================================================
create or replace function public.admin_stats(p_since timestamptz default now() - interval '30 days')
returns jsonb
language sql
stable
security invoker
set search_path = public
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

revoke execute on function public.admin_stats(timestamptz) from public, anon;
grant execute on function public.admin_stats(timestamptz) to authenticated, service_role;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.complete_payment(text, jsonb, numeric)',
    'public.fail_payment(text, text, jsonb)',
    'public.pay_membership_from_wallet(uuid, numeric, numeric)',
    'public.request_withdrawal(uuid, numeric, numeric, text, text)',
    'public.refund_withdrawal(uuid, text, text, uuid)',
    'public.play_instant_round(uuid, text, numeric, numeric, jsonb, text, text)',
    'public.open_round(uuid, text, numeric, jsonb, jsonb, text, text)',
    'public.settle_round(uuid, text, numeric, jsonb)',
    'public.advance_round(uuid, integer, jsonb)',
    'public.review_mission_submission(uuid, boolean, text, uuid)',
    'public.admin_adjust_balance(uuid, numeric, text, uuid)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

commit;

-- ============================================================
-- ROLLBACK (à exécuter manuellement si nécessaire)
-- ============================================================
-- begin;
--   drop function if exists public.admin_stats(timestamptz);
--   drop function if exists public.admin_adjust_balance(uuid, numeric, text, uuid);
--   drop function if exists public.review_mission_submission(uuid, boolean, text, uuid);
--   drop function if exists public.advance_round(uuid, integer, jsonb);
--   drop function if exists public.settle_round(uuid, text, numeric, jsonb);
--   drop function if exists public.open_round(uuid, text, numeric, jsonb, jsonb, text, text);
--   drop function if exists public.play_instant_round(uuid, text, numeric, numeric, jsonb, text, text);
--   drop function if exists public.refund_withdrawal(uuid, text, text, uuid);
--   drop function if exists public.request_withdrawal(uuid, numeric, numeric, text, text);
--   drop function if exists public.pay_membership_from_wallet(uuid, numeric, numeric);
--   drop function if exists public.fail_payment(text, text, jsonb);
--   drop function if exists public.complete_payment(text, jsonb, numeric);
--   drop policy if exists "contact_messages_admin_select" on public.contact_messages;
--   drop table if exists public.course_registrations, public.courses,
--     public.mission_submissions, public.missions, public.game_rounds,
--     public.withdrawals, public.payments, public.app_settings;
--   alter table public.profiles drop column if exists is_banned, drop column if exists games_accepted_at;
--   alter table public.transactions drop constraint if exists transactions_type_check;
--   alter table public.transactions add constraint transactions_type_check check (type in
--     ('deposit','withdraw','game_bet','game_win','mission_reward','referral_bonus','purchase'));
-- commit;
