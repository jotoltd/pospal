-- POSpal Supabase Schema
-- Run this in your Supabase SQL editor at https://supabase.com/dashboard

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- VENUES (one per restaurant/takeaway)
-- ============================================================
create table if not exists venues (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Restaurant',
  address text default '',
  phone text default '',
  plan text not null default 'trial', -- trial, starter, pro, enterprise
  plan_expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- SETTINGS (per venue)
-- ============================================================
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  key text not null,
  value text not null default '',
  unique (venue_id, key)
);

-- ============================================================
-- STAFF (per venue)
-- ============================================================
create table if not exists staff (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  pin text not null,
  role text not null default 'staff',
  is_manager boolean default false,
  active boolean default true,
  hourly_rate numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES (per venue)
-- ============================================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- MENU ITEMS (per venue)
-- ============================================================
create table if not exists menu_items (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  price numeric(10,2) not null default 0,
  description text default '',
  available boolean default true,
  stock_count integer default -1,
  track_stock boolean default false,
  low_stock_threshold integer default 10,
  modifiers jsonb default '[]',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ORDERS (per venue)
-- ============================================================
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  order_number text not null,
  customer_name text default '',
  customer_phone text default '',
  order_type text not null default 'collection',
  status text not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  discount_code text default '',
  delivery_fee numeric(10,2) default 0,
  service_charge numeric(10,2) default 0,
  tip numeric(10,2) default 0,
  split_cash numeric(10,2) default 0,
  split_card numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  payment_method text default 'cash',
  transaction_code text default '',
  notes text default '',
  table_number text default '',
  delivery_address text default '',
  staff_id uuid references staff(id),
  refund_amount numeric(10,2) default 0,
  refund_reason text default '',
  loyalty_points_earned integer default 0,
  loyalty_points_redeemed integer default 0,
  created_at timestamptz default now(),
  completed_at timestamptz,
  unique (venue_id, order_number)
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  quantity integer not null default 1,
  notes text default '',
  modifiers jsonb default '[]'
);

-- ============================================================
-- CUSTOMERS (per venue)
-- ============================================================
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  phone text not null,
  email text default '',
  address text default '',
  is_vip boolean default false,
  allergies text default '',
  notes text default '',
  loyalty_points integer default 0,
  total_orders integer default 0,
  total_spent numeric(10,2) default 0,
  total_visits integer default 0,
  created_at timestamptz default now(),
  unique (venue_id, phone)
);

-- ============================================================
-- DISCOUNT CODES (per venue)
-- ============================================================
create table if not exists discount_codes (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  code text not null,
  type text not null default 'percentage',
  value numeric(10,2) not null,
  min_order_value numeric(10,2) default 0,
  max_uses integer default null,
  uses_count integer default 0,
  valid_from timestamptz default now(),
  valid_until timestamptz default null,
  is_happy_hour boolean default false,
  happy_hour_start text default null,
  happy_hour_end text default null,
  active boolean default true,
  created_at timestamptz default now(),
  unique (venue_id, code)
);

-- ============================================================
-- REFUNDS (per venue)
-- ============================================================
create table if not exists refunds (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  amount numeric(10,2) not null,
  reason text default '',
  staff_id uuid references staff(id),
  created_at timestamptz default now()
);

-- ============================================================
-- PARKED ORDERS (per venue)
-- ============================================================
create table if not exists parked_orders (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  order_name text not null,
  customer_name text default '',
  customer_phone text default '',
  order_type text default 'collection',
  table_number text default '',
  delivery_address text default '',
  subtotal numeric(10,2) not null,
  tax numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  service_charge numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  notes text default '',
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

-- ============================================================
-- SHIFTS / TIMESHEETS (per venue)
-- ============================================================
create table if not exists shifts (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  staff_id uuid not null references staff(id) on delete cascade,
  staff_name text not null,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  duration_minutes integer,
  notes text default ''
);

-- ============================================================
-- ROW LEVEL SECURITY
-- All tables are scoped to the authenticated user's venues only
-- ============================================================

alter table venues enable row level security;
alter table settings enable row level security;
alter table staff enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table customers enable row level security;
alter table discount_codes enable row level security;
alter table refunds enable row level security;
alter table parked_orders enable row level security;
alter table shifts enable row level security;

-- Venues: owner only
drop policy if exists "venues_owner" on venues;
create policy "venues_owner" on venues
  for all using (auth.uid() = owner_id);

-- Helper function: check if the current user owns the venue
create or replace function user_owns_venue(v_id uuid)
returns boolean as $$
  select exists (
    select 1 from venues where id = v_id and owner_id = auth.uid()
  );
$$ language sql security definer;

-- Per-table RLS policies using the helper
drop policy if exists "settings_venue" on settings;
create policy "settings_venue" on settings
  for all using (user_owns_venue(venue_id));

drop policy if exists "staff_venue" on staff;
create policy "staff_venue" on staff
  for all using (user_owns_venue(venue_id));

drop policy if exists "categories_venue" on categories;
create policy "categories_venue" on categories
  for all using (user_owns_venue(venue_id));

drop policy if exists "menu_items_venue" on menu_items;
create policy "menu_items_venue" on menu_items
  for all using (user_owns_venue(venue_id));

drop policy if exists "orders_venue" on orders;
create policy "orders_venue" on orders
  for all using (user_owns_venue(venue_id));

drop policy if exists "order_items_venue" on order_items;
create policy "order_items_venue" on order_items
  for all using (user_owns_venue(venue_id));

drop policy if exists "customers_venue" on customers;
create policy "customers_venue" on customers
  for all using (user_owns_venue(venue_id));

drop policy if exists "discount_codes_venue" on discount_codes;
create policy "discount_codes_venue" on discount_codes
  for all using (user_owns_venue(venue_id));

drop policy if exists "refunds_venue" on refunds;
create policy "refunds_venue" on refunds
  for all using (user_owns_venue(venue_id));

drop policy if exists "parked_orders_venue" on parked_orders;
create policy "parked_orders_venue" on parked_orders
  for all using (user_owns_venue(venue_id));

drop policy if exists "shifts_venue" on shifts;
create policy "shifts_venue" on shifts
  for all using (user_owns_venue(venue_id));
