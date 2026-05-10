create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  color text not null default '#3b82f6',
  icon text not null default 'circle-dollar-sign',
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  payment_method text not null default 'Card',
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists expenses_user_date_idx on public.expenses(user_id, expense_date desc);
create index if not exists expenses_category_id_idx on public.expenses(category_id);

alter table public.categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Users can read own categories" on public.categories;
drop policy if exists "Users can insert own categories" on public.categories;
drop policy if exists "Users can update own categories" on public.categories;
drop policy if exists "Users can delete own categories" on public.categories;

create policy "Users can read own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read own expenses" on public.expenses;
drop policy if exists "Users can insert own expenses" on public.expenses;
drop policy if exists "Users can update own expenses" on public.expenses;
drop policy if exists "Users can delete own expenses" on public.expenses;

create policy "Users can read own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.categories
      where categories.id = expenses.category_id
      and categories.user_id = auth.uid()
    )
  );

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.categories
      where categories.id = expenses.category_id
      and categories.user_id = auth.uid()
    )
  );

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.expenses;
exception
  when duplicate_object then null;
end $$;
