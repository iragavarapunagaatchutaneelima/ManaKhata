-- Kinfold v2 schema (Supabase / Postgres 17)
-- Every row belongs to a household. Row Level Security limits each signed-in
-- user to the household they are a member of; privileged actions (approvals,
-- wallet moves, chore payouts, settle-ups) go through SECURITY DEFINER
-- functions that re-check the caller's role.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Core: profiles, households, members
-- ─────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 80),
  email       text,
  phone       text check (phone is null or char_length(phone) <= 20),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.households (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 80),
  currency     text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  invite_code  text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now()
);

create table public.household_members (
  household_id         uuid not null references public.households(id) on delete cascade,
  user_id              uuid not null references auth.users(id) on delete cascade,
  role                 text not null check (role in ('HOUSEHEAD', 'PARENT', 'ADULT_CHILD', 'STUDENT')),
  monthly_income       numeric(14,2) not null default 0 check (monthly_income >= 0),
  can_view_analytics   boolean not null default true,
  can_manage_expenses  boolean not null default true,
  joined_at            timestamptz not null default now(),
  primary key (household_id, user_id)
);
-- v2 keeps it simple: one household per person.
create unique index household_members_one_per_user on public.household_members(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper functions used by policies (SECURITY DEFINER avoids policy recursion)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.is_member(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = auth.uid())
$$;

create or replace function public.is_member_of(hid uuid, uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from household_members where household_id = hid and user_id = uid)
$$;

create or replace function public.is_manager(hid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from household_members
    where household_id = hid and user_id = auth.uid() and role in ('HOUSEHEAD', 'PARENT')
  )
$$;

create or replace function public.shares_household(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select uid = auth.uid() or exists (
    select 1 from household_members a
    join household_members b on a.household_id = b.household_id
    where a.user_id = auth.uid() and b.user_id = uid
  )
$$;

-- New auth user -> profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Money
-- ─────────────────────────────────────────────────────────────────────────────

create table public.recurring_bills (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  amount         numeric(14,2) not null check (amount > 0),
  category       text not null default 'OTHER',
  frequency      text not null default 'MONTHLY' check (frequency in ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
  next_due_date  date not null,
  owner_id       uuid references auth.users(id) on delete set null,
  is_active      boolean not null default true,
  created_by     uuid not null default auth.uid() references auth.users(id),
  created_at     timestamptz not null default now()
);

create table public.expenses (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  paid_by          uuid not null references auth.users(id),
  created_by       uuid not null default auth.uid() references auth.users(id),
  amount           numeric(14,2) not null check (amount > 0),
  description      text not null check (char_length(description) between 1 and 200),
  category         text not null default 'OTHER',
  visibility       text not null default 'HOUSEHOLD' check (visibility in ('HOUSEHOLD', 'PERSONAL')),
  expense_date     date not null default current_date,
  payment_method   text not null default 'UPI' check (payment_method in ('UPI', 'CARD', 'CASH', 'BANK', 'WALLET', 'OTHER')),
  is_reimbursable  boolean not null default false,
  notes            text check (notes is null or char_length(notes) <= 500),
  bill_id          uuid references public.recurring_bills(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index expenses_household_date on public.expenses(household_id, expense_date desc);

create table public.incomes (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  user_id       uuid not null references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  source        text not null check (char_length(source) between 1 and 80),
  income_date   date not null default current_date,
  notes         text check (notes is null or char_length(notes) <= 500),
  created_at    timestamptz not null default now()
);
create index incomes_household_date on public.incomes(household_id, income_date desc);

create table public.expense_splits (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  expense_id    uuid not null references public.expenses(id) on delete cascade,
  owed_by       uuid not null references auth.users(id),
  owed_to       uuid not null references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  settled_at    timestamptz,
  created_at    timestamptz not null default now(),
  check (owed_by <> owed_to)
);
create index expense_splits_household on public.expense_splits(household_id);

create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  from_user     uuid not null references auth.users(id),
  to_user       uuid not null references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  note          text,
  created_by    uuid not null default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now()
);

create table public.reimbursements (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  requested_by  uuid not null default auth.uid() references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  description   text not null check (char_length(description) between 1 and 200),
  category      text not null default 'OTHER',
  paid_date     date not null default current_date,
  status        text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'SETTLED')),
  decided_by    uuid references auth.users(id),
  decided_at    timestamptz,
  settled_at    timestamptz,
  created_at    timestamptz not null default now()
);

create table public.budgets (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  user_id           uuid references auth.users(id) on delete cascade,  -- null = household budget
  category          text not null,
  monthly_limit     numeric(14,2) not null check (monthly_limit > 0),
  alert_at_percent  integer not null default 80 check (alert_at_percent between 1 and 100),
  created_at        timestamptz not null default now(),
  unique nulls not distinct (household_id, user_id, category)
);

create table public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  from_user     uuid references auth.users(id),
  to_user       uuid references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  kind          text not null check (kind in ('TOP_UP', 'ALLOCATION', 'TRANSFER', 'CHORE_REWARD', 'WITHDRAWAL')),
  note          text check (note is null or char_length(note) <= 200),
  created_by    uuid not null default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now(),
  check (from_user is not null or to_user is not null)
);
create index wallet_transactions_household on public.wallet_transactions(household_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Household life
-- ─────────────────────────────────────────────────────────────────────────────

create table public.goals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  description    text,
  target_amount  numeric(14,2) not null check (target_amount > 0),
  target_date    date,
  created_by     uuid not null default auth.uid() references auth.users(id),
  created_at     timestamptz not null default now()
);

create table public.goal_contributions (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  goal_id       uuid not null references public.goals(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id),
  amount        numeric(14,2) not null check (amount > 0),
  note          text,
  created_at    timestamptz not null default now()
);

create table public.grocery_lists (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 80),
  created_by    uuid not null default auth.uid() references auth.users(id),
  completed_at  timestamptz,
  expense_id    uuid references public.expenses(id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.grocery_items (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  list_id          uuid not null references public.grocery_lists(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 80),
  quantity         numeric(10,2) not null default 1 check (quantity > 0),
  unit             text not null default 'pcs',
  estimated_price  numeric(14,2) not null default 0 check (estimated_price >= 0),
  category         text,
  is_checked       boolean not null default false,
  created_at       timestamptz not null default now()
);

create table public.chores (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 80),
  description    text,
  reward_amount  numeric(14,2) not null default 0 check (reward_amount >= 0),
  assigned_to    uuid not null references auth.users(id),
  due_date       date,
  status         text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'APPROVED', 'REJECTED')),
  created_by     uuid not null default auth.uid() references auth.users(id),
  completed_at   timestamptz,
  decided_at     timestamptz,
  created_at     timestamptz not null default now()
);

create table public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  sender_id     uuid not null default auth.uid() references auth.users(id),
  channel       text not null default 'general' check (channel in ('general', 'expenses', 'plans')),
  content       text not null check (char_length(content) between 1 and 2000),
  created_at    timestamptz not null default now()
);
create index chat_messages_household on public.chat_messages(household_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Assets & planning
-- ─────────────────────────────────────────────────────────────────────────────

create table public.vehicles (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null references public.households(id) on delete cascade,
  owner_id             uuid references auth.users(id) on delete set null,
  name                 text not null check (char_length(name) between 1 and 80),
  registration_number  text,
  vehicle_type         text not null default 'CAR' check (vehicle_type in ('CAR', 'BIKE', 'SCOOTER', 'CYCLE', 'EV', 'OTHER')),
  make                 text,
  model                text,
  year                 integer check (year is null or year between 1950 and 2100),
  fuel_type            text,
  is_shared            boolean not null default true,
  created_at           timestamptz not null default now()
);

create table public.vehicle_expenses (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  expense_type  text not null check (expense_type in ('FUEL', 'SERVICE', 'REPAIR', 'INSURANCE', 'TYRES', 'PUC', 'PARKING_TOLL', 'WASH', 'OTHER')),
  amount        numeric(14,2) not null check (amount > 0),
  odometer_km   integer check (odometer_km is null or odometer_km >= 0),
  litres        numeric(8,2) check (litres is null or litres > 0),
  expense_date  date not null default current_date,
  notes         text,
  created_at    timestamptz not null default now()
);

create table public.trips (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  destination    text not null check (char_length(destination) between 1 and 80),
  start_date     date not null,
  end_date       date not null,
  budget         numeric(14,2) not null check (budget > 0),
  base_currency  text not null default 'INR' check (base_currency ~ '^[A-Z]{3}$'),
  created_at     timestamptz not null default now(),
  check (end_date >= start_date)
);

create table public.trip_expenses (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references public.households(id) on delete cascade,
  trip_id        uuid not null references public.trips(id) on delete cascade,
  description    text not null check (char_length(description) between 1 and 120),
  amount         numeric(14,2) not null check (amount > 0),
  currency_code  text not null default 'INR' check (currency_code ~ '^[A-Z]{3}$'),
  exchange_rate  numeric(14,6) not null default 1 check (exchange_rate > 0),  -- 1 unit of currency_code in trip base currency
  paid_by        uuid not null default auth.uid() references auth.users(id),
  expense_date   date not null default current_date,
  created_at     timestamptz not null default now()
);

create table public.investments (
  id                uuid primary key default gen_random_uuid(),
  household_id      uuid not null references public.households(id) on delete cascade,
  owner_id          uuid references auth.users(id) on delete set null,
  name              text not null check (char_length(name) between 1 and 80),
  asset_type        text not null check (asset_type in ('MUTUAL_FUND', 'STOCK', 'FIXED_DEPOSIT', 'RECURRING_DEPOSIT', 'PPF', 'EPF', 'NPS', 'GOLD', 'REAL_ESTATE', 'CRYPTO', 'BOND', 'OTHER')),
  invested_amount   numeric(14,2) not null check (invested_amount >= 0),
  current_value     numeric(14,2) not null check (current_value >= 0),
  investment_date   date,
  platform          text,
  created_at        timestamptz not null default now()
);

create table public.insurance_policies (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references public.households(id) on delete cascade,
  owner_id         uuid references auth.users(id) on delete set null,
  provider         text not null check (char_length(provider) between 1 and 80),
  policy_number    text,
  policy_type      text not null check (policy_type in ('HEALTH', 'TERM_LIFE', 'LIFE', 'VEHICLE', 'HOME', 'TRAVEL', 'OTHER')),
  coverage_amount  numeric(14,2) not null check (coverage_amount >= 0),
  premium_amount   numeric(14,2) not null default 0 check (premium_amount >= 0),
  premium_frequency text not null default 'YEARLY' check (premium_frequency in ('MONTHLY', 'QUARTERLY', 'YEARLY')),
  expiry_date      date,
  created_at       timestamptz not null default now()
);

create table public.tax_documents (
  id              uuid primary key default gen_random_uuid(),
  household_id    uuid not null references public.households(id) on delete cascade,
  owner_id        uuid not null default auth.uid() references auth.users(id),
  document_name   text not null check (char_length(document_name) between 1 and 120),
  section         text not null check (section in ('80C', '80D_SELF', '80D_PARENTS', '80CCD_1B', '24B', '80E', '80G', '80TTA', 'HRA', 'OTHER')),
  amount          numeric(14,2) not null check (amount > 0),
  financial_year  text not null check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  created_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Integrity triggers: referenced users and parent rows must be in the same household
-- ─────────────────────────────────────────────────────────────────────────────

-- TG_ARGV = user-id columns that must belong to NEW.household_id
create or replace function public.validate_member_refs()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  col text;
  uid uuid;
begin
  foreach col in array TG_ARGV loop
    uid := (to_jsonb(new) ->> col)::uuid;
    if uid is not null and not is_member_of(new.household_id, uid) then
      raise exception '% must be a member of this household', col using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;

-- TG_ARGV[0] = parent table, TG_ARGV[1] = FK column
create or replace function public.validate_parent_household()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_household uuid;
begin
  execute format('select household_id from public.%I where id = $1', TG_ARGV[0])
    into parent_household using (to_jsonb(new) ->> TG_ARGV[1])::uuid;
  if parent_household is distinct from new.household_id then
    raise exception 'parent row belongs to a different household' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger expenses_members before insert or update on public.expenses
  for each row execute function public.validate_member_refs('paid_by');
create trigger incomes_members before insert or update on public.incomes
  for each row execute function public.validate_member_refs('user_id');
create trigger splits_members before insert or update on public.expense_splits
  for each row execute function public.validate_member_refs('owed_by', 'owed_to');
create trigger splits_parent before insert or update on public.expense_splits
  for each row execute function public.validate_parent_household('expenses', 'expense_id');
create trigger budgets_members before insert or update on public.budgets
  for each row execute function public.validate_member_refs('user_id');
create trigger bills_members before insert or update on public.recurring_bills
  for each row execute function public.validate_member_refs('owner_id');
create trigger contributions_parent before insert or update on public.goal_contributions
  for each row execute function public.validate_parent_household('goals', 'goal_id');
create trigger grocery_items_parent before insert or update on public.grocery_items
  for each row execute function public.validate_parent_household('grocery_lists', 'list_id');
create trigger chores_members before insert or update on public.chores
  for each row execute function public.validate_member_refs('assigned_to');
create trigger vehicles_members before insert or update on public.vehicles
  for each row execute function public.validate_member_refs('owner_id');
create trigger vehicle_expenses_parent before insert or update on public.vehicle_expenses
  for each row execute function public.validate_parent_household('vehicles', 'vehicle_id');
create trigger trip_expenses_parent before insert or update on public.trip_expenses
  for each row execute function public.validate_parent_household('trips', 'trip_id');
create trigger trip_expenses_members before insert or update on public.trip_expenses
  for each row execute function public.validate_member_refs('paid_by');
create trigger investments_members before insert or update on public.investments
  for each row execute function public.validate_member_refs('owner_id');
create trigger policies_members before insert or update on public.insurance_policies
  for each row execute function public.validate_member_refs('owner_id');

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

create policy "profiles: read self and co-members" on public.profiles
  for select to authenticated using (shares_household(id));
create policy "profiles: update self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "households: members read" on public.households
  for select to authenticated using (is_member(id));
create policy "households: managers update" on public.households
  for update to authenticated using (is_manager(id)) with check (is_manager(id));

create policy "members: read own household" on public.household_members
  for select to authenticated using (is_member(household_id));

-- Plain household-scoped tables: any member can read and write.
do $$
declare t text;
begin
  foreach t in array array[
    'recurring_bills', 'incomes', 'expense_splits', 'settlements', 'budgets',
    'goals', 'goal_contributions', 'grocery_lists', 'grocery_items', 'chat_messages',
    'vehicles', 'vehicle_expenses', 'trips', 'trip_expenses', 'investments',
    'insurance_policies', 'tax_documents'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members read" on public.%I for select to authenticated using (is_member(household_id))', t);
    execute format('create policy "members insert" on public.%I for insert to authenticated with check (is_member(household_id))', t);
    execute format('create policy "members update" on public.%I for update to authenticated using (is_member(household_id)) with check (is_member(household_id))', t);
    execute format('create policy "members delete" on public.%I for delete to authenticated using (is_member(household_id))', t);
  end loop;
end $$;

-- Chat: you can only post as yourself and only delete your own messages.
drop policy "members insert" on public.chat_messages;
drop policy "members update" on public.chat_messages;
drop policy "members delete" on public.chat_messages;
create policy "chat: post as self" on public.chat_messages
  for insert to authenticated with check (is_member(household_id) and sender_id = auth.uid());
create policy "chat: delete own" on public.chat_messages
  for delete to authenticated using (sender_id = auth.uid());

-- Settlements are written by settle_up() only.
drop policy "members insert" on public.settlements;
drop policy "members update" on public.settlements;
drop policy "members delete" on public.settlements;

-- Expenses: personal expenses are private to whoever paid/recorded them.
alter table public.expenses enable row level security;
create policy "expenses: read" on public.expenses
  for select to authenticated
  using (is_member(household_id) and (visibility = 'HOUSEHOLD' or paid_by = auth.uid() or created_by = auth.uid()));
create policy "expenses: insert" on public.expenses
  for insert to authenticated with check (is_member(household_id) and created_by = auth.uid());
create policy "expenses: update" on public.expenses
  for update to authenticated
  using (is_member(household_id) and (created_by = auth.uid() or paid_by = auth.uid() or is_manager(household_id)))
  with check (is_member(household_id));
create policy "expenses: delete" on public.expenses
  for delete to authenticated
  using (is_member(household_id) and (created_by = auth.uid() or paid_by = auth.uid() or is_manager(household_id)));

-- Reimbursements: anyone can request; status changes go through decide_reimbursement().
alter table public.reimbursements enable row level security;
create policy "reimbursements: read" on public.reimbursements
  for select to authenticated using (is_member(household_id));
create policy "reimbursements: request" on public.reimbursements
  for insert to authenticated
  with check (is_member(household_id) and requested_by = auth.uid() and status = 'PENDING');
create policy "reimbursements: withdraw own pending" on public.reimbursements
  for delete to authenticated using (requested_by = auth.uid() and status = 'PENDING');

-- Wallet ledger is append-only and written by wallet functions.
alter table public.wallet_transactions enable row level security;
create policy "wallet: read" on public.wallet_transactions
  for select to authenticated using (is_member(household_id));

-- Chores: managers create/delete; status changes go through set_chore_status().
alter table public.chores enable row level security;
create policy "chores: read" on public.chores
  for select to authenticated using (is_member(household_id));
create policy "chores: managers create" on public.chores
  for insert to authenticated with check (is_manager(household_id));
create policy "chores: managers delete" on public.chores
  for delete to authenticated using (is_manager(household_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions (RPC)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.create_household(p_name text, p_currency text default 'INR', p_monthly_income numeric default 0)
returns public.households language plpgsql security definer set search_path = public as $$
declare h households;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'You already belong to a household';
  end if;
  insert into households (name, currency, created_by) values (trim(p_name), upper(p_currency), auth.uid()) returning * into h;
  insert into household_members (household_id, user_id, role, monthly_income)
  values (h.id, auth.uid(), 'HOUSEHEAD', greatest(coalesce(p_monthly_income, 0), 0));
  return h;
end $$;

create or replace function public.join_household(p_code text, p_role text default 'ADULT_CHILD', p_monthly_income numeric default 0)
returns public.households language plpgsql security definer set search_path = public as $$
declare h households;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_role not in ('PARENT', 'ADULT_CHILD', 'STUDENT') then raise exception 'Invalid role'; end if;
  if exists (select 1 from household_members where user_id = auth.uid()) then
    raise exception 'You already belong to a household';
  end if;
  select * into h from households where invite_code = upper(trim(p_code));
  if h.id is null then raise exception 'Invite code not found'; end if;
  insert into household_members (household_id, user_id, role, monthly_income, can_view_analytics)
  values (h.id, auth.uid(), p_role, greatest(coalesce(p_monthly_income, 0), 0), p_role <> 'STUDENT');
  return h;
end $$;

create or replace function public.regenerate_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare hid uuid; code text;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if not is_manager(hid) then raise exception 'Only the household head or a parent can do this'; end if;
  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update households set invite_code = code where id = hid;
  return code;
end $$;

-- Update a member. Managers may change anyone (except promote to HOUSEHEAD);
-- everyone may change their own monthly income.
create or replace function public.update_member(
  p_user uuid,
  p_role text default null,
  p_monthly_income numeric default null,
  p_can_view_analytics boolean default null,
  p_can_manage_expenses boolean default null
) returns void language plpgsql security definer set search_path = public as $$
declare hid uuid; target_role text;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  select role into target_role from household_members where household_id = hid and user_id = p_user;
  if target_role is null then raise exception 'Member not found'; end if;
  if p_user <> auth.uid() and not is_manager(hid) then raise exception 'Not allowed'; end if;
  if (p_role is not null or p_can_view_analytics is not null or p_can_manage_expenses is not null) and not is_manager(hid) then
    raise exception 'Only the household head or a parent can change roles and permissions';
  end if;
  if p_role is not null and (p_role = 'HOUSEHEAD' or target_role = 'HOUSEHEAD') then
    raise exception 'The household head role cannot be changed here';
  end if;
  update household_members set
    role = coalesce(p_role, role),
    monthly_income = coalesce(greatest(p_monthly_income, 0), monthly_income),
    can_view_analytics = coalesce(p_can_view_analytics, can_view_analytics),
    can_manage_expenses = coalesce(p_can_manage_expenses, can_manage_expenses)
  where household_id = hid and user_id = p_user;
end $$;

create or replace function public.remove_member(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if p_user <> auth.uid() and not exists (
    select 1 from household_members where household_id = hid and user_id = auth.uid() and role = 'HOUSEHEAD'
  ) then raise exception 'Only the household head can remove members'; end if;
  if exists (select 1 from household_members where household_id = hid and user_id = p_user and role = 'HOUSEHEAD')
     and (select count(*) from household_members where household_id = hid) > 1 then
    raise exception 'Hand over the household head role before leaving';
  end if;
  delete from household_members where household_id = hid and user_id = p_user;
  if not exists (select 1 from household_members where household_id = hid) then
    delete from households where id = hid;
  end if;
end $$;

create or replace function public.transfer_headship(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from household_members where user_id = auth.uid() and role = 'HOUSEHEAD';
  if hid is null then raise exception 'Only the household head can do this'; end if;
  if not is_member_of(hid, p_user) or p_user = auth.uid() then raise exception 'Pick another member'; end if;
  update household_members set role = 'PARENT' where household_id = hid and user_id = auth.uid();
  update household_members set role = 'HOUSEHEAD' where household_id = hid and user_id = p_user;
end $$;

-- Permanently delete the caller's account (DPDP / GDPR "right to erasure").
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare hid uuid; heir uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is not null then
    if exists (select 1 from household_members where household_id = hid and user_id = auth.uid() and role = 'HOUSEHEAD') then
      select user_id into heir from household_members
      where household_id = hid and user_id <> auth.uid()
      order by (role = 'PARENT') desc, joined_at asc limit 1;
      if heir is not null then
        update household_members set role = 'HOUSEHEAD' where household_id = hid and user_id = heir;
      end if;
    end if;
    delete from household_members where household_id = hid and user_id = auth.uid();
    if not exists (select 1 from household_members where household_id = hid) then
      delete from households where id = hid;
    end if;
  end if;
  -- Rows in other members' shared history keep the amounts but lose the link to this user.
  delete from auth.users where id = auth.uid();
end $$;

-- Wallet ----------------------------------------------------------------------

create or replace function public.wallet_balance(p_household uuid, p_user uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(sum(case when to_user = p_user then amount else 0 end), 0)
       - coalesce(sum(case when from_user = p_user then amount else 0 end), 0)
  from wallet_transactions where household_id = p_household
$$;

create or replace function public.wallet_top_up(p_amount numeric, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if hid is null then raise exception 'Join a household first'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  insert into wallet_transactions (household_id, from_user, to_user, amount, kind, note)
  values (hid, null, auth.uid(), round(p_amount, 2), 'TOP_UP', p_note);
end $$;

create or replace function public.wallet_withdraw(p_amount numeric, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  perform pg_advisory_xact_lock(hashtext(hid::text || auth.uid()::text));
  if wallet_balance(hid, auth.uid()) < p_amount then raise exception 'Not enough balance in your wallet'; end if;
  insert into wallet_transactions (household_id, from_user, to_user, amount, kind, note)
  values (hid, auth.uid(), null, round(p_amount, 2), 'WITHDRAWAL', p_note);
end $$;

-- Managers "allocate" pocket money; everyone else "transfers".
create or replace function public.wallet_transfer(p_to uuid, p_amount numeric, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare hid uuid;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if not is_member_of(hid, p_to) or p_to = auth.uid() then raise exception 'Pick another member of your household'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  perform pg_advisory_xact_lock(hashtext(hid::text || auth.uid()::text));
  if wallet_balance(hid, auth.uid()) < p_amount then raise exception 'Not enough balance in your wallet'; end if;
  insert into wallet_transactions (household_id, from_user, to_user, amount, kind, note)
  values (hid, auth.uid(), p_to, round(p_amount, 2), case when is_manager(hid) then 'ALLOCATION' else 'TRANSFER' end, p_note);
end $$;

-- Reimbursements ---------------------------------------------------------------

create or replace function public.decide_reimbursement(p_id uuid, p_action text)
returns void language plpgsql security definer set search_path = public as $$
declare r reimbursements;
begin
  select * into r from reimbursements where id = p_id for update;
  if r.id is null or not is_manager(r.household_id) then raise exception 'Only the household head or a parent can do this'; end if;
  if p_action = 'APPROVE' and r.status = 'PENDING' then
    update reimbursements set status = 'APPROVED', decided_by = auth.uid(), decided_at = now() where id = p_id;
  elsif p_action = 'REJECT' and r.status = 'PENDING' then
    update reimbursements set status = 'REJECTED', decided_by = auth.uid(), decided_at = now() where id = p_id;
  elsif p_action = 'SETTLE' and r.status = 'APPROVED' then
    update reimbursements set status = 'SETTLED', settled_at = now() where id = p_id;
  else
    raise exception 'Cannot % a % request', lower(p_action), lower(r.status);
  end if;
end $$;

-- Chores -----------------------------------------------------------------------

create or replace function public.set_chore_status(p_id uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare c chores;
begin
  select * into c from chores where id = p_id for update;
  if c.id is null or not is_member(c.household_id) then raise exception 'Chore not found'; end if;
  if p_status = 'COMPLETED' then
    if c.assigned_to <> auth.uid() and not is_manager(c.household_id) then raise exception 'Only the assignee can mark this done'; end if;
    if c.status not in ('PENDING', 'REJECTED') then raise exception 'Chore is already %', lower(c.status); end if;
    update chores set status = 'COMPLETED', completed_at = now() where id = p_id;
  elsif p_status in ('APPROVED', 'REJECTED') then
    if not is_manager(c.household_id) then raise exception 'Only the household head or a parent can review chores'; end if;
    if c.status <> 'COMPLETED' then raise exception 'Chore has not been marked done yet'; end if;
    update chores set status = p_status, decided_at = now() where id = p_id;
    if p_status = 'APPROVED' and c.reward_amount > 0 then
      perform pg_advisory_xact_lock(hashtext(c.household_id::text || auth.uid()::text));
      if wallet_balance(c.household_id, auth.uid()) < c.reward_amount then
        raise exception 'Top up your wallet to pay this reward (%)', c.reward_amount;
      end if;
      insert into wallet_transactions (household_id, from_user, to_user, amount, kind, note)
      values (c.household_id, auth.uid(), c.assigned_to, c.reward_amount, 'CHORE_REWARD', 'Chore: ' || c.title);
    end if;
  elsif p_status = 'PENDING' then
    if not is_manager(c.household_id) then raise exception 'Not allowed'; end if;
    update chores set status = 'PENDING', completed_at = null, decided_at = null where id = p_id and status <> 'APPROVED';
  else
    raise exception 'Unknown status';
  end if;
end $$;

-- Splits ----------------------------------------------------------------------

-- Settle every open split where p_debtor owes p_creditor. Either party may record it.
create or replace function public.settle_up(p_debtor uuid, p_creditor uuid, p_note text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare hid uuid; total numeric;
begin
  select household_id into hid from household_members where user_id = auth.uid();
  if auth.uid() not in (p_debtor, p_creditor) and not is_manager(hid) then
    raise exception 'Only the people involved can settle this';
  end if;
  select coalesce(sum(amount), 0) into total from expense_splits
  where household_id = hid and owed_by = p_debtor and owed_to = p_creditor and settled_at is null;
  if total <= 0 then return 0; end if;
  update expense_splits set settled_at = now()
  where household_id = hid and owed_by = p_debtor and owed_to = p_creditor and settled_at is null;
  insert into settlements (household_id, from_user, to_user, amount, note) values (hid, p_debtor, p_creditor, total, p_note);
  return total;
end $$;

-- Bills -----------------------------------------------------------------------

-- Record this period's payment as an expense and move the bill to its next due date.
create or replace function public.pay_bill(p_bill uuid, p_paid_on date default current_date)
returns uuid language plpgsql security definer set search_path = public as $$
declare b recurring_bills; new_id uuid;
begin
  select * into b from recurring_bills where id = p_bill for update;
  if b.id is null or not is_member(b.household_id) then raise exception 'Bill not found'; end if;
  insert into expenses (household_id, paid_by, created_by, amount, description, category, expense_date, bill_id)
  values (b.household_id, auth.uid(), auth.uid(), b.amount, b.name, b.category, p_paid_on, b.id)
  returning id into new_id;
  update recurring_bills set next_due_date = (case frequency
      when 'WEEKLY' then next_due_date + interval '7 days'
      when 'MONTHLY' then next_due_date + interval '1 month'
      when 'QUARTERLY' then next_due_date + interval '3 months'
      else next_due_date + interval '1 year' end)::date
  where id = p_bill;
  return new_id;
end $$;

-- Only signed-in users may call these.
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.create_household(text, text, numeric),
  public.join_household(text, text, numeric),
  public.regenerate_invite_code(),
  public.update_member(uuid, text, numeric, boolean, boolean),
  public.remove_member(uuid),
  public.transfer_headship(uuid),
  public.delete_my_account(),
  public.wallet_balance(uuid, uuid),
  public.wallet_top_up(numeric, text),
  public.wallet_withdraw(numeric, text),
  public.wallet_transfer(uuid, numeric, text),
  public.decide_reimbursement(uuid, text),
  public.set_chore_status(uuid, text),
  public.settle_up(uuid, uuid, text),
  public.pay_bill(uuid, date),
  public.is_member(uuid),
  public.is_member_of(uuid, uuid),
  public.is_manager(uuid),
  public.shares_household(uuid)
to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime: family members see each other's changes live
-- ─────────────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table
  public.expenses, public.incomes, public.expense_splits, public.settlements,
  public.reimbursements, public.budgets, public.recurring_bills, public.wallet_transactions,
  public.goals, public.goal_contributions, public.grocery_lists, public.grocery_items,
  public.chores, public.chat_messages, public.household_members;
