-- Enable UUID extension
create extension if not exists "uuid-ossp" schema extensions;

-- ─── PROFILES ────────────────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users manage own profile"
  on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
create table categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  icon       text,
  is_default boolean default false,
  type       text check (type in ('income', 'expense', 'both')) default 'both',
  created_at timestamptz default now()
);

alter table categories enable row level security;
create policy "Users manage own categories"
  on categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Default categories seeded per user
create or replace function seed_default_categories(p_user_id uuid)
returns void language plpgsql as $$
begin
  insert into categories (user_id, name, color, icon, is_default, type) values
    (p_user_id, 'Alimentação',       '#ef4444', 'utensils',        true, 'expense'),
    (p_user_id, 'Transporte',        '#f97316', 'car',             true, 'expense'),
    (p_user_id, 'Moradia',           '#eab308', 'home',            true, 'expense'),
    (p_user_id, 'Saúde',             '#22c55e', 'heart-pulse',     true, 'expense'),
    (p_user_id, 'Educação',          '#3b82f6', 'book-open',       true, 'expense'),
    (p_user_id, 'Lazer',             '#a855f7', 'gamepad-2',       true, 'expense'),
    (p_user_id, 'Vestuário',         '#ec4899', 'shirt',           true, 'expense'),
    (p_user_id, 'Assinaturas',       '#06b6d4', 'repeat',          true, 'expense'),
    (p_user_id, 'Compras Online',    '#8b5cf6', 'shopping-cart',   true, 'expense'),
    (p_user_id, 'Supermercado',      '#f59e0b', 'shopping-basket', true, 'expense'),
    (p_user_id, 'Restaurante',       '#10b981', 'coffee',          true, 'expense'),
    (p_user_id, 'Academia',          '#14b8a6', 'dumbbell',        true, 'expense'),
    (p_user_id, 'Pets',              '#f43f5e', 'paw-print',       true, 'expense'),
    (p_user_id, 'Viagem',            '#64748b', 'plane',           true, 'expense'),
    (p_user_id, 'Outros',            '#78716c', 'ellipsis',        true, 'both'),
    (p_user_id, 'Salário',           '#16a34a', 'banknote',        true, 'income'),
    (p_user_id, 'Freelance',         '#0284c7', 'laptop',          true, 'income'),
    (p_user_id, 'Investimentos',     '#7c3aed', 'trending-up',     true, 'income'),
    (p_user_id, 'Transferência',     '#0891b2', 'arrow-left-right',true, 'both'),
    (p_user_id, 'Presente',          '#db2777', 'gift',            true, 'income');
end;
$$;

-- Trigger: seed categories on new profile
create or replace function handle_new_profile()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  perform seed_default_categories(new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ─── ACCOUNTS ────────────────────────────────────────────────────────────────
create table accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  name          text not null,
  type          text check (type in ('checking', 'savings', 'cash', 'investment', 'other')) not null,
  balance       numeric(15,2) default 0,
  color         text default '#6366f1',
  icon          text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

alter table accounts enable row level security;
create policy "Users manage own accounts"
  on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── CREDIT CARDS ────────────────────────────────────────────────────────────
create table credit_cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade,
  name             text not null,
  limit_amount     numeric(15,2) default 0,
  closing_day      int check (closing_day between 1 and 31) not null,
  due_day          int check (due_day between 1 and 31) not null,
  color            text default '#6366f1',
  brand            text,
  is_active        boolean default true,
  created_at       timestamptz default now()
);

alter table credit_cards enable row level security;
create policy "Users manage own credit cards"
  on credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── CREDIT CARD INVOICES ────────────────────────────────────────────────────
create table credit_card_invoices (
  id              uuid primary key default gen_random_uuid(),
  credit_card_id  uuid references credit_cards(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  month           int check (month between 1 and 12) not null,
  year            int not null,
  status          text check (status in ('open', 'closed', 'paid')) default 'open',
  total_amount    numeric(15,2) default 0,
  paid_at         timestamptz,
  due_date        date,
  created_at      timestamptz default now(),
  unique (credit_card_id, month, year)
);

alter table credit_card_invoices enable row level security;
create policy "Users manage own invoices"
  on credit_card_invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── TRANSACTIONS ────────────────────────────────────────────────────────────
create table transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade,
  type              text check (type in ('income', 'expense')) not null,
  amount            numeric(15,2) not null,
  description       text,
  date              date not null,
  category_id       uuid references categories(id) on delete set null,
  account_id        uuid references accounts(id) on delete set null,
  invoice_id        uuid references credit_card_invoices(id) on delete set null,
  is_recurring      boolean default false,
  recurring_id      uuid,
  created_at        timestamptz default now(),
  constraint must_have_destination check (account_id is not null or invoice_id is not null)
);

alter table transactions enable row level security;
create policy "Users manage own transactions"
  on transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── RECURRING TRANSACTIONS ──────────────────────────────────────────────────
create table recurring_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  type            text check (type in ('income', 'expense')) not null,
  amount          numeric(15,2) not null,
  description     text,
  category_id     uuid references categories(id) on delete set null,
  account_id      uuid references accounts(id) on delete set null,
  credit_card_id  uuid references credit_cards(id) on delete set null,
  frequency_days  int check (frequency_days in (7, 14, 30)) not null,
  next_due_date   date not null,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

alter table recurring_transactions enable row level security;
create policy "Users manage own recurring transactions"
  on recurring_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── HELPER: update account balance on transaction ───────────────────────────
create or replace function update_account_balance()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' and NEW.account_id is not null then
    update public.accounts set balance = balance + case when NEW.type = 'income' then NEW.amount else -NEW.amount end
    where id = NEW.account_id;
  elsif TG_OP = 'DELETE' and OLD.account_id is not null then
    update public.accounts set balance = balance + case when OLD.type = 'income' then -OLD.amount else OLD.amount end
    where id = OLD.account_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.account_id is not null then
      update public.accounts set balance = balance + case when OLD.type = 'income' then -OLD.amount else OLD.amount end
      where id = OLD.account_id;
    end if;
    if NEW.account_id is not null then
      update public.accounts set balance = balance + case when NEW.type = 'income' then NEW.amount else -NEW.amount end
      where id = NEW.account_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_update_account_balance
  after insert or update or delete on transactions
  for each row execute procedure update_account_balance();

-- ─── HELPER: update invoice total on transaction ─────────────────────────────
create or replace function update_invoice_total()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' and NEW.invoice_id is not null then
    update public.credit_card_invoices set total_amount = total_amount + NEW.amount where id = NEW.invoice_id;
  elsif TG_OP = 'DELETE' and OLD.invoice_id is not null then
    update public.credit_card_invoices set total_amount = total_amount - OLD.amount where id = OLD.invoice_id;
  elsif TG_OP = 'UPDATE' then
    if OLD.invoice_id is not null then
      update public.credit_card_invoices set total_amount = total_amount - OLD.amount where id = OLD.invoice_id;
    end if;
    if NEW.invoice_id is not null then
      update public.credit_card_invoices set total_amount = total_amount + NEW.amount where id = NEW.invoice_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger trg_update_invoice_total
  after insert or update or delete on transactions
  for each row execute procedure update_invoice_total();
