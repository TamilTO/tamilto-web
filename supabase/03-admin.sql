-- =====================================================================
-- TamilTO admin panel extras (checklist step 19)
-- Run once: Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again.
--
-- 1. Saves each admin's email and name so the change log can say who did what.
-- 2. Lets the owner add and remove team members by email from the admin panel.
-- 3. Lets editors delete spam quote requests and tips.
-- 4. Adds two small tables the admin edits: site content (home headline, search
--    suggestions, plans, benefits, how-it-works) and the home page story circles.
-- =====================================================================
begin;

alter table public.admins add column if not exists email text not null default '';
alter table public.admins add column if not exists name  text not null default '';

-- Fill in emails for admins that already exist (you, from step 17).
update public.admins a set email = u.email
from auth.users u
where u.id = a.user_id and a.email = '';

-- Owner only: add a team member (they must already have a login under Authentication → Users).
create or replace function public.add_admin(p_email text, p_role text, p_name text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  if not public.is_owner() then raise exception 'Only the owner can add team members.'; end if;
  if p_role not in ('owner', 'editor', 'sales') then raise exception 'Role must be owner, editor or sales.'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then
    raise exception 'No login found for %. First add them in Supabase: Authentication → Users → Add user.', p_email;
  end if;
  insert into public.admins (user_id, role, email, name) values (uid, p_role, lower(trim(p_email)), coalesce(p_name, ''))
  on conflict (user_id) do update set role = excluded.role, name = excluded.name, email = excluded.email;
end $$;
revoke all on function public.add_admin(text, text, text) from public, anon;
grant execute on function public.add_admin(text, text, text) to authenticated;

-- The owner can never remove or demote the last owner (so nobody gets locked out).
create or replace function public.keep_an_owner()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.admins where role = 'owner') then
    raise exception 'There must always be at least one owner.';
  end if;
  return null;
end $$;
drop trigger if exists admins_keep_owner on public.admins;
create trigger admins_keep_owner after update or delete on public.admins
  for each statement execute function public.keep_an_owner();

-- Editors can delete spam.
drop policy if exists "Editors delete leads" on public.leads;
create policy "Editors delete leads" on public.leads for delete to authenticated using ((select public.is_editor()));
drop policy if exists "Editors delete submissions" on public.submissions;
create policy "Editors delete submissions" on public.submissions for delete to authenticated using ((select public.is_editor()));
drop policy if exists "Editors delete claims" on public.claims;
create policy "Editors delete claims" on public.claims for delete to authenticated using ((select public.is_editor()));

-- ---------- Site content (home headline, search suggestions, plans, benefits, how-it-works) ----------
create table if not exists public.site_settings (
  key        text primary key check (key in ('hero', 'searchExamples', 'plans', 'perks', 'how', 'autoStories')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Home page story circles (like Instagram Stories) ----------
create table if not exists public.home_stories (
  id         uuid primary key default gen_random_uuid(),
  label      text not null check (length(trim(label)) > 0),
  tone       text not null default '#F5B83D',
  slides     jsonb not null default '[]'::jsonb,   -- [{photo, kicker, title, text, href, cta}]
  sort       int not null default 0,
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.home_stories  enable row level security;
drop policy if exists "Public reads site content" on public.site_settings;
create policy "Public reads site content" on public.site_settings for select using (true);
drop policy if exists "Public reads stories" on public.home_stories;
create policy "Public reads stories" on public.home_stories for select using (not is_hidden or (select public.is_staff()));
do $$
declare t text;
begin
  foreach t in array array['site_settings', 'home_stories'] loop
    execute format('drop policy if exists %I on public.%I', 'Editors add ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Editors change ' || t, t);
    execute format('drop policy if exists %I on public.%I', 'Editors remove ' || t, t);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select public.is_editor()))', 'Editors add ' || t, t);
    execute format('create policy %I on public.%I for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()))', 'Editors change ' || t, t);
    execute format('create policy %I on public.%I for delete to authenticated using ((select public.is_editor()))', 'Editors remove ' || t, t);
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit()', t || '_audit', t);
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);
  end loop;
end $$;
grant select on public.site_settings, public.home_stories to anon;
grant select, insert, update, delete on public.site_settings, public.home_stories to authenticated;
grant all on public.site_settings, public.home_stories to service_role;

-- Check: you should see yourself as owner with your email.
select email, role from public.admins order by role, email;

commit;
