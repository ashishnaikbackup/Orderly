-- Orderly Supabase schema
-- Public customer ordering + authenticated restaurant staff operations.
-- Never put a service_role/secret key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, created_at timestamptz not null default now()
);
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_no text not null, qr_token text not null unique default encode(gen_random_bytes(12),'hex'), is_active boolean not null default true,
  created_at timestamptz not null default now(), unique(restaurant_id,table_no)
);
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null, description text, price numeric(10,2) not null check(price>=0), category text not null default 'Menu',
  image_url text, is_available boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  table_id uuid references public.tables(id) on delete set null, table_no text not null, guest_name text not null, phone text,
  items jsonb not null default '[]'::jsonb, total numeric(10,2) not null check(total>=0),
  status text not null default 'new' check(status in ('new','preparing','ready','completed','cancelled')),
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.restaurant_staff (
  user_id uuid not null references auth.users(id) on delete cascade, restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  role text not null default 'manager' check(role in ('owner','manager','kitchen')), created_at timestamptz not null default now(),
  primary key(user_id,restaurant_id)
);

create index if not exists orders_restaurant_created_idx on public.orders(restaurant_id,created_at desc);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_table_idx on public.orders(table_id);
create index if not exists tables_restaurant_idx on public.tables(restaurant_id);
create index if not exists menu_items_restaurant_idx on public.menu_items(restaurant_id,category);
create index if not exists restaurant_staff_restaurant_idx on public.restaurant_staff(restaurant_id);
create index if not exists restaurant_staff_user_idx on public.restaurant_staff(user_id);

alter table public.restaurants enable row level security;
alter table public.tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.restaurant_staff enable row level security;

drop policy if exists "public read restaurants" on public.restaurants;
drop policy if exists "staff read restaurant" on public.restaurants;
create policy "public read restaurants" on public.restaurants for select to anon using(true);
create policy "staff read restaurant" on public.restaurants for select to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=restaurants.id));

drop policy if exists "public read active tables" on public.tables;
drop policy if exists "staff read tables" on public.tables;
drop policy if exists "staff insert tables" on public.tables;
drop policy if exists "staff update tables" on public.tables;
drop policy if exists "staff delete tables" on public.tables;
create policy "public read active tables" on public.tables for select to anon using(is_active=true);
create policy "staff read tables" on public.tables for select to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=tables.restaurant_id));
create policy "staff insert tables" on public.tables for insert to authenticated with check(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=tables.restaurant_id and s.role in ('owner','manager')));
create policy "staff update tables" on public.tables for update to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=tables.restaurant_id and s.role in ('owner','manager'))) with check(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=tables.restaurant_id and s.role in ('owner','manager')));
create policy "staff delete tables" on public.tables for delete to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=tables.restaurant_id and s.role='owner'));

drop policy if exists "public read available menu" on public.menu_items;
drop policy if exists "staff read menu" on public.menu_items;
drop policy if exists "staff insert menu" on public.menu_items;
drop policy if exists "staff update menu" on public.menu_items;
drop policy if exists "staff delete menu" on public.menu_items;
create policy "public read available menu" on public.menu_items for select to anon using(is_available=true);
create policy "staff read menu" on public.menu_items for select to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=menu_items.restaurant_id));
create policy "staff insert menu" on public.menu_items for insert to authenticated with check(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=menu_items.restaurant_id and s.role in ('owner','manager')));
create policy "staff update menu" on public.menu_items for update to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=menu_items.restaurant_id and s.role in ('owner','manager'))) with check(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=menu_items.restaurant_id and s.role in ('owner','manager')));
create policy "staff delete menu" on public.menu_items for delete to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=menu_items.restaurant_id and s.role in ('owner','manager')));

drop policy if exists "guest create valid orders" on public.orders;
drop policy if exists "staff read orders" on public.orders;
drop policy if exists "staff update orders" on public.orders;
drop policy if exists "staff delete orders" on public.orders;
create policy "guest create valid orders" on public.orders for insert to anon with check(
  table_id is not null and
  exists(select 1 from public.tables t where t.id=orders.table_id and t.restaurant_id=orders.restaurant_id and t.table_no=orders.table_no and t.is_active=true) and
  exists(select 1 from public.restaurants r where r.id=orders.restaurant_id)
);
create policy "staff read orders" on public.orders for select to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=orders.restaurant_id));
create policy "staff update orders" on public.orders for update to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=orders.restaurant_id and s.role in ('owner','manager','kitchen'))) with check(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=orders.restaurant_id and s.role in ('owner','manager','kitchen')));
create policy "staff delete orders" on public.orders for delete to authenticated using(exists(select 1 from public.restaurant_staff s where s.user_id=(select auth.uid()) and s.restaurant_id=orders.restaurant_id and s.role in ('owner','manager')));

drop policy if exists "staff self read" on public.restaurant_staff;
create policy "staff self read" on public.restaurant_staff for select to authenticated using((select auth.uid())=user_id);

revoke select,insert,update,delete on public.orders from anon;
grant insert on public.orders to anon;
grant select,update,delete on public.orders to authenticated;
grant select on public.restaurants to anon,authenticated;
grant select,insert,update,delete on public.tables to authenticated;
grant select,insert,update,delete on public.menu_items to authenticated;
grant select on public.restaurant_staff to authenticated;

do $$
begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then alter publication supabase_realtime add table public.orders; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='menu_items') then alter publication supabase_realtime add table public.menu_items; end if;
end $$;

insert into public.restaurants(name,slug) values('Orderly Demo Restaurant','orderly-demo') on conflict(slug) do nothing;
insert into public.tables(restaurant_id,table_no)
select r.id,v.table_no from public.restaurants r cross join (values('T1'),('T2'),('T3'),('T4'),('T5'),('T6')) v(table_no)
where r.slug='orderly-demo' on conflict(restaurant_id,table_no) do nothing;
insert into public.menu_items(restaurant_id,name,description,price,category)
select r.id,v.name,v.description,v.price,v.category from public.restaurants r cross join (values
('Masala Dosa','Crispy dosa with potato filling',120::numeric,'South Indian'),
('Cold Coffee','Chilled, creamy and refreshing',80::numeric,'Drinks'),
('Paneer Butter Masala','Rich tomato gravy with paneer',210::numeric,'Main Course'),
('Margherita Pizza','Thin crust with mozzarella and basil',250::numeric,'Pizza'),
('Veg Hakka Noodles','Wok-tossed noodles with vegetables',170::numeric,'Main Course'),
('Masala Fries','Crispy fries with house seasoning',90::numeric,'Sides'))
v(name,description,price,category)
where r.slug='orderly-demo' and not exists(select 1 from public.menu_items m where m.restaurant_id=r.id and m.name=v.name);