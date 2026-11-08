-- =====================================================================
-- TamilTO database setup (checklist step 15)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run once on a new, empty project.
--
-- What it creates:
--   • the "shelves": categories, areas, businesses, photos, events, articles,
--     lists, life moments, quote requests, claims, tips, activity, admins
--   • security rules: visitors can only READ what is published; only TamilTO
--     admins can change anything; private data (quote requests, claims,
--     tips, activity) is visible to admins only
--   • a "media" storage bucket for photos
-- =====================================================================

begin;

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- admins (who can use the admin panel) ----------
create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'editor', 'sales')),
  created_at timestamptz not null default now()
);

-- Role checks used by the security rules. "security definer" lets them read the
-- admins table even though visitors can't.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()) and a.role in ('owner', 'editor'))
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()) and a.role = 'owner')
$$;

-- ---------- categories (14) and areas (7) ----------
create table public.categories (
  key        text primary key check (key ~ '^[a-z0-9-]+$'),
  label      text not null,
  colour     text not null default '#F5B83D' check (colour ~ '^#[0-9A-Fa-f]{6}$'),
  sort       int  not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.neighbourhoods (
  key         text primary key check (key ~ '^[a-z0-9-]+$'),
  name        text not null,
  tagline     text not null default '',
  description text not null default '',
  colour      text not null default '#F5B83D' check (colour ~ '^#[0-9A-Fa-f]{6}$'),
  lat         numeric(8,5) not null,
  lng         numeric(8,5) not null,
  match       text not null default '',          -- words that map a question to this area
  cities      text[] not null default '{}',      -- city names that belong to this area
  sort        int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- businesses ----------
create table public.businesses (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- the address: tamilto.com/b/<slug>
  name               text not null check (length(trim(name)) > 0),
  category_key       text not null references public.categories(key) on update cascade,
  listed_as          text not null default '',      -- original category from the source list, e.g. "Wedding Caterers"
  neighbourhood_key  text not null references public.neighbourhoods(key) on update cascade,
  city               text not null default '',
  address            text not null default '',
  lat                numeric(8,5),
  lng                numeric(8,5),
  geocoded           boolean not null default false, -- true once lat/lng come from a real address lookup
  contact_name       text not null default '',
  phone              text not null default '' check (phone = '' or phone ~ '^[0-9]{10}$'),
  cell               text not null default '' check (cell  = '' or cell  ~ '^[0-9]{10}$'),
  fax                text not null default '' check (fax   = '' or fax   ~ '^[0-9]{10}$'),
  email              text not null default '',
  website            text not null default '',
  short_description  text not null default '',
  deal               text not null default '',
  jobs               text[] not null default '{}',
  google_maps_url    text not null default '',
  google_reviews_url text not null default '',
  social             jsonb not null default '{}'::jsonb,   -- {instagram, facebook, tiktok, youtube, x, linkedin}
  hours              jsonb,                                -- 7 entries Sun..Sat of {"open":"09:00","close":"18:00"} or null
  by_appointment     boolean not null default false,
  plan               text not null default 'free' check (plan in ('free', 'featured', 'partner')),
  is_featured        boolean not null default false,
  featured_until     date,
  is_verified        boolean not null default false,      -- "Verified Tamil-owned": only after the owner confirms
  verified_at        timestamptz,
  verified_by        uuid references auth.users(id) on delete set null,
  accepts_quotes     boolean not null default false,
  speaks_tamil       boolean not null default false,
  is_hidden          boolean not null default true,       -- new listings start hidden
  owner_user_id      uuid references auth.users(id) on delete set null,
  recommendations    int not null default 0 check (recommendations >= 0),
  tone               text not null default '#1F4E5F',
  seed               bigint not null default 0,           -- keeps each map pin's animation steady
  source             text not null default '',            -- where the listing came from, e.g. "Vanikam list"
  search             tsvector generated always as (
                       to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(listed_as, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(city, '') || ' ' || coalesce(contact_name, ''))
                     ) stored,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (lat is null or lat between 40 and 50),
  check (lng is null or lng between -85 and -75),
  check (not is_verified or verified_at is not null)
);
create index businesses_category_idx      on public.businesses (category_key) where not is_hidden;
create index businesses_neighbourhood_idx on public.businesses (neighbourhood_key) where not is_hidden;
create index businesses_owner_idx         on public.businesses (owner_user_id) where owner_user_id is not null;
create index businesses_search_idx        on public.businesses using gin (search);

create table public.business_photos (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  storage_path text not null unique,          -- path inside the "media" bucket
  sort         int  not null default 0,       -- 0 = cover photo
  alt          text not null default '',
  created_at   timestamptz not null default now()
);
create index business_photos_business_idx on public.business_photos (business_id, sort);

-- A business needs at least 3 photos before it can go live.
create or replace function public.check_business_photos()
returns trigger language plpgsql as $$
declare n int;
begin
  if not new.is_hidden and (tg_op = 'INSERT' or old.is_hidden) then
    select count(*) into n from public.business_photos where business_id = new.id;
    if n < 3 then
      raise exception 'Add at least 3 photos before showing "%" on the site (it has %).', new.name, n
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger businesses_need_photos before insert or update of is_hidden on public.businesses
  for each row execute function public.check_business_photos();

-- Removing photos from a live business can't take it below 3.
create or replace function public.keep_three_photos()
returns trigger language plpgsql as $$
declare n int; live boolean;
begin
  select not b.is_hidden into live from public.businesses b where b.id = old.business_id;
  if coalesce(live, false) then
    select count(*) into n from public.business_photos where business_id = old.business_id;
    if n < 3 then
      raise exception 'A live business must keep at least 3 photos. Hide it first, or add a photo before removing this one.'
        using errcode = 'check_violation';
    end if;
  end if;
  return null;
end $$;
create trigger business_photos_keep_three after delete on public.business_photos
  for each row execute function public.keep_three_photos();

-- ---------- events ----------
create table public.events (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title             text not null,
  type              text not null default 'Culture' check (type in ('Festival', 'Culture', 'Concert', 'Food', 'Film', 'Sports', 'Community')),
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  venue             text not null default '',
  address           text not null default '',
  neighbourhood_key text references public.neighbourhoods(key) on update cascade,
  price             numeric(8,2) not null default 0 check (price >= 0),   -- 0 = free
  sold_out          boolean not null default false,
  description       text not null default '',
  ticket_url        text not null default '',
  host_business_id  uuid references public.businesses(id) on delete set null,
  tone              text not null default '#1F4E5F',
  is_hidden         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);
create index events_starts_idx on public.events (starts_at) where not is_hidden;

create table public.event_photos (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  storage_path text not null unique,
  sort         int  not null default 0,
  alt          text not null default '',
  created_at   timestamptz not null default now()
);
create index event_photos_event_idx on public.event_photos (event_id, sort);

-- ---------- articles (Eat, Culture, People, Guides, Business) ----------
create table public.articles (
  id            uuid primary key default gen_random_uuid(),
  section       text not null check (section in ('eat', 'culture', 'people', 'guides', 'business', 'events')),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null,
  dek           text not null default '',
  body          jsonb not null default '[]'::jsonb,    -- rich text blocks (paragraphs, headings, lists, best-of lists...)
  hero_image    text not null default '',              -- path inside the "media" bucket
  hero_alt      text not null default '',
  hero_caption  text not null default '',
  hero_credit   text not null default '',
  tags          text[] not null default '{}',
  neighbourhood text not null default '',
  author        text not null default 'TamilTO',
  publish_at    timestamptz not null default now(),    -- a future date schedules it
  sponsored     boolean not null default false,
  sponsor_name  text not null default '',
  sponsor_url   text not null default '',
  is_featured   boolean not null default false,
  is_trending   boolean not null default false,
  sort          int not null default 0,
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (not sponsored or length(sponsor_name) > 0)    -- paid stories always name the sponsor
);
create index articles_section_idx on public.articles (section, publish_at desc) where not is_hidden;

-- ---------- cousin-approved lists ----------
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  curated_by  text not null default 'The TamilTO team',
  description text not null default '',
  sort        int not null default 0,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table public.collection_items (
  collection_id uuid not null references public.collections(id) on delete cascade,
  business_id   uuid not null references public.businesses(id) on delete cascade,
  sort          int not null default 0,
  primary key (collection_id, business_id)
);
create index collection_items_business_idx on public.collection_items (business_id);

-- ---------- life moments (wedding, baby, new home) ----------
create table public.journeys (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  tamil_name  text not null default '',
  quote_label text not null default 'Quote request',
  description text not null default '',
  tone        text not null default '#8A3B52',
  sort        int not null default 0,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table public.journey_steps (
  id         uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  sort       int not null default 0,
  when_label text not null default '',
  title      text not null,
  tip        text not null default ''
);
create index journey_steps_journey_idx on public.journey_steps (journey_id, sort);
create table public.journey_step_businesses (
  step_id     uuid not null references public.journey_steps(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  sort        int not null default 0,
  primary key (step_id, business_id)
);
create index journey_step_businesses_business_idx on public.journey_step_businesses (business_id);

-- ---------- quote requests ----------
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'Quote request',
  name        text not null,
  phone       text not null,
  email       text not null default '',
  event_date  date,
  guests      int check (guests is null or guests between 1 and 100000),
  message     text not null default '',
  source_page text not null default '',
  created_at  timestamptz not null default now()
);
create index leads_created_idx on public.leads (created_at desc);
create table public.lead_recipients (
  lead_id     uuid not null references public.leads(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  status      text not null default 'new' check (status in ('new', 'replied', 'booked', 'closed')),
  notified_at timestamptz,
  primary key (lead_id, business_id)
);
create index lead_recipients_business_idx on public.lead_recipients (business_id);

-- ---------- claims ("this is my business" / "add my business") ----------
create table public.claims (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid references public.businesses(id) on delete set null,  -- empty for a brand-new business
  details               jsonb not null default '{}'::jsonb,                        -- everything from the form
  contact_name          text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  plan                  text not null default 'free' check (plan in ('free', 'featured', 'partner')),
  tamil_owned_confirmed boolean not null default false,
  user_id               uuid references auth.users(id) on delete set null,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  notes                 text not null default '',
  created_at            timestamptz not null default now()
);
create index claims_status_idx on public.claims (status, created_at desc);

-- ---------- reader submissions (tips, events, ad enquiries) ----------
create table public.submissions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('tip', 'event', 'listing', 'ad')),
  title       text not null default '',
  name        text not null default '',
  email       text not null default '',
  payload     jsonb not null default '{}'::jsonb,
  photo_path  text not null default '',
  consent_at  timestamptz,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes       text not null default '',
  created_at  timestamptz not null default now()
);
create index submissions_status_idx on public.submissions (status, created_at desc);

-- ---------- activity (page views, WhatsApp taps, calls...). No names, emails, phone numbers or IPs. ----------
create table public.activity_events (
  id           bigint generated always as identity primary key,
  occurred_at  timestamptz not null default now(),
  kind         text not null check (kind in ('view', 'search', 'whatsapp', 'call', 'directions', 'reviews', 'website', 'social', 'email', 'save', 'share', 'quote', 'listing')),
  business_id  uuid references public.businesses(id) on delete set null,
  path         text not null default '',
  ref          text not null default '',
  query        text not null default '',
  session_hash text not null default '',   -- changes every day, so visitors can't be followed across days
  device       text not null default '' check (device in ('', 'm', 'd'))
);
create index activity_events_time_idx     on public.activity_events (occurred_at);
create index activity_events_business_idx on public.activity_events (business_id, occurred_at) where business_id is not null;
create index activity_events_kind_idx     on public.activity_events (kind, occurred_at);

create table public.activity_daily (
  day         date not null,
  business_id uuid references public.businesses(id) on delete cascade,
  kind        text not null,
  count       int  not null default 0,
  visitors    int  not null default 0,
  unique nulls not distinct (day, business_id, kind)
);

-- ---------- change log (feeds "Recent changes" in the admin) ----------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  action     text not null,
  entity     text not null,
  entity_id  text not null default '',
  diff       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare rec jsonb; prev jsonb; diff jsonb;
begin
  rec  := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  prev := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(k, jsonb_build_object('from', prev -> k, 'to', rec -> k)), '{}'::jsonb) into diff
    from jsonb_object_keys(rec) k
    where k not in ('updated_at', 'search') and (prev -> k) is distinct from (rec -> k);
    if diff = '{}'::jsonb then return null; end if;
  else
    diff := rec - 'search';
  end if;
  insert into public.audit_log (user_id, action, entity, entity_id, diff)
  values ((select auth.uid()), lower(tg_op), tg_table_name, coalesce(rec ->> 'slug', rec ->> 'id', rec ->> 'key', ''), diff);
  return null;
end $$;

-- ---------- triggers: updated_at and change log ----------
do $$
declare t text;
begin
  foreach t in array array['categories', 'neighbourhoods', 'businesses', 'events', 'articles', 'collections', 'journeys'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
  foreach t in array array['categories', 'neighbourhoods', 'businesses', 'business_photos', 'events', 'articles', 'collections', 'collection_items', 'journeys', 'journey_steps', 'journey_step_businesses', 'claims', 'admins'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit()', t || '_audit', t);
  end loop;
end $$;

-- =====================================================================
-- Security rules (Row Level Security). Every table is locked by default;
-- the policies below open exactly what each kind of person may do.
-- The website's server code uses the secret key for quote requests, claims,
-- tips and activity, so visitors never write to the database directly.
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['admins', 'categories', 'neighbourhoods', 'businesses', 'business_photos', 'events', 'event_photos', 'articles', 'collections', 'collection_items', 'journeys', 'journey_steps', 'journey_step_businesses', 'leads', 'lead_recipients', 'claims', 'submissions', 'activity_events', 'activity_daily', 'audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public content: anyone can read what is published; staff can read everything; editors can change it.
create policy "Public reads categories" on public.categories for select using (true);
create policy "Public reads areas"      on public.neighbourhoods for select using (true);
create policy "Public reads live businesses" on public.businesses for select using (not is_hidden or (select public.is_staff()));
create policy "Public reads photos of live businesses" on public.business_photos for select
  using (exists (select 1 from public.businesses b where b.id = business_id and not b.is_hidden) or (select public.is_staff()));
create policy "Public reads events" on public.events for select using (not is_hidden or (select public.is_staff()));
create policy "Public reads event photos" on public.event_photos for select
  using (exists (select 1 from public.events e where e.id = event_id and not e.is_hidden) or (select public.is_staff()));
create policy "Public reads published articles" on public.articles for select using ((not is_hidden and publish_at <= now()) or (select public.is_staff()));
create policy "Public reads lists" on public.collections for select using (not is_hidden or (select public.is_staff()));
create policy "Public reads list items" on public.collection_items for select
  using (exists (select 1 from public.collections c where c.id = collection_id and not c.is_hidden) or (select public.is_staff()));
create policy "Public reads life moments" on public.journeys for select using (not is_hidden or (select public.is_staff()));
create policy "Public reads life moment steps" on public.journey_steps for select
  using (exists (select 1 from public.journeys j where j.id = journey_id and not j.is_hidden) or (select public.is_staff()));
create policy "Public reads life moment businesses" on public.journey_step_businesses for select using (true);

do $$
declare t text;
begin
  foreach t in array array['categories', 'neighbourhoods', 'businesses', 'business_photos', 'events', 'event_photos', 'articles', 'collections', 'collection_items', 'journeys', 'journey_steps', 'journey_step_businesses'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_editor()))', 'Editors add ' || t, t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()))', 'Editors change ' || t, t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_editor()))', 'Editors remove ' || t, t);
  end loop;
end $$;

-- Private data: staff (owner, editor, sales) can read; editors can update status and notes; nobody else sees it.
do $$
declare t text;
begin
  foreach t in array array['leads', 'lead_recipients', 'claims', 'submissions', 'activity_events', 'activity_daily', 'audit_log'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select public.is_staff()))', 'Staff read ' || t, t);
  end loop;
  foreach t in array array['lead_recipients', 'claims', 'submissions'] loop
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()))', 'Editors update ' || t, t);
  end loop;
end $$;

-- Admin list: staff can see who the admins are; only the owner can add or remove admins.
create policy "Staff read admins"   on public.admins for select to authenticated using ((select public.is_staff()));
create policy "Owner adds admins"   on public.admins for insert to authenticated with check ((select public.is_owner()));
create policy "Owner changes admins" on public.admins for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "Owner removes admins" on public.admins for delete to authenticated using ((select public.is_owner()));

-- Table permissions for Supabase's API (Row Level Security above still decides which rows).
grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.neighbourhoods, public.businesses, public.business_photos, public.events, public.event_photos,
  public.articles, public.collections, public.collection_items, public.journeys, public.journey_steps, public.journey_step_businesses to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
revoke all on public.leads, public.lead_recipients, public.claims, public.submissions, public.activity_events, public.activity_daily, public.audit_log, public.admins from anon;
revoke execute on function public.is_staff(), public.is_editor(), public.is_owner() from anon;

-- =====================================================================
-- Photo storage: a public "media" bucket. Anyone can view photos by their
-- link; only editors can upload, replace or delete them. Max 10 MB, images only.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Editors upload media"  on storage.objects for insert to authenticated with check (bucket_id = 'media' and (select public.is_editor()));
create policy "Editors replace media" on storage.objects for update to authenticated using (bucket_id = 'media' and (select public.is_editor())) with check (bucket_id = 'media' and (select public.is_editor()));
create policy "Editors delete media"  on storage.objects for delete to authenticated using (bucket_id = 'media' and (select public.is_editor()));

-- =====================================================================
-- Starter data: the 14 categories and 7 areas from the TamilTO 3.0 design.
-- Businesses come in the next file (02-businesses.sql, step 16).
-- =====================================================================
insert into public.categories (key, label, colour, sort) values
  ('realestate', 'Real estate & homes', '#F5B83D', 0),
  ('finance', 'Insurance, mortgage & finance', '#6EA8F0', 1),
  ('legal', 'Lawyers & claims', '#9C86F0', 2),
  ('home', 'Renovation & interiors', '#A5C25A', 3),
  ('trades', 'Trades, moving & repairs', '#4FC9B5', 4),
  ('auto', 'Auto & driving schools', '#FF9A66', 5),
  ('food', 'Food, catering & groceries', '#FF6B5E', 6),
  ('events', 'Weddings & events', '#F5C443', 7),
  ('beauty', 'Beauty, fashion & jewellery', '#E2629B', 8),
  ('health', 'Health & care', '#5FC98A', 9),
  ('learn', 'Education & classes', '#C77BD8', 10),
  ('media', 'Media, print & tech', '#4FB6DE', 11),
  ('travel', 'Travel, shipping & money transfer', '#E8C15A', 12),
  ('community', 'Community & other services', '#C9B7A0', 13);

insert into public.neighbourhoods (key, name, tagline, description, colour, lat, lng, match, cities, sort) values
  ('scarborough', 'Scarborough', 'Where it all started.', 'The heart of Tamil Toronto, with more Tamil businesses than anywhere else in the GTA.', '#FF6B7D', 43.776, -79.235, 'scarb|stc|malvern|agincourt|morningside', '{Scarborough}', 0),
  ('markham', 'Markham', 'Suburban, and growing fast.', 'Realtors, caterers, renovators and professionals across Markham and Unionville.', '#F5B83D', 43.868, -79.31, 'markham|unionville', '{Markham}', 1),
  ('toronto', 'Toronto', 'The city, Etobicoke and North York.', 'Tamil businesses across the old city, Etobicoke and North York.', '#5EC2D1', 43.68, -79.40, 'downtown|toronto|north york|etobicoke|midtown', '{Toronto,Etobicoke,"North York"}', 2),
  ('brampton', 'Brampton', 'The west-end hub.', 'Tamil businesses across Brampton and Caledon.', '#7FCB8C', 43.715, -79.76, 'brampton|bramalea|bolton|caledon', '{Brampton,Bolton}', 3),
  ('mississauga', 'Mississauga', 'West of the city.', 'Tamil businesses across Mississauga.', '#C6A3F0', 43.598, -79.64, 'mississauga|sauga|square one', '{Mississauga}', 4),
  ('durham', 'Durham', 'Ajax, Pickering, Whitby and Oshawa.', 'The east keeps growing: Tamil businesses from Pickering to Oshawa.', '#FF9A66', 43.87, -79.02, 'ajax|pickering|durham|whitby|oshawa', '{Ajax,Pickering,Whitby,Oshawa}', 5),
  ('york', 'Vaughan & York', 'Vaughan, Thornhill and Stouffville.', 'Tamil businesses north of the city.', '#E2629B', 43.83, -79.50, 'vaughan|thornhill|stouffville|richmond hill|york region', '{Vaughan,Thornhill,"Whitchurch - Stouffville"}', 6);

commit;
