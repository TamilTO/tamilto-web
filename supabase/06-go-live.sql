-- =====================================================================
-- TamilTO: show the business directory on the website (basic listings)
-- Run ONCE, AFTER 02-businesses parts 1–5 and 05-marketplace.sql.
-- Supabase → SQL Editor → New query → paste all of this → Run.
--
-- What it does
--   1. Businesses no longer need 3 photos to be shown. A listing without photos
--      shows a coloured pattern and an "Unclaimed listing — claim it" button.
--   2. Personal details stay private: the public website can no longer read the
--      email address or contact person's name of a business, unless the owner has
--      claimed it and you've marked it Verified in the admin.
--   3. Every imported business goes live.
-- Safe to run twice. To hide everything again: update public.businesses set is_hidden = true;
-- =====================================================================
begin;

-- 1. Photos become optional for going live.
drop trigger if exists businesses_need_photos on public.businesses;
drop trigger if exists business_photos_keep_three on public.business_photos;

-- 2. The public (not-signed-in) website reads every business column except the
--    email and the contact person's name. Signed-in admin logins still see everything.
revoke select on public.businesses from anon;
grant select (id, slug, name, category_key, listed_as, neighbourhood_key, city, address, lat, lng, geocoded,
  phone, cell, fax, website, short_description, deal, jobs, google_maps_url, google_reviews_url, social, hours,
  by_appointment, plan, is_featured, featured_until, is_verified, accepts_quotes, speaks_tamil, recommendations,
  tone, seed, is_hidden, created_at, updated_at) on public.businesses to anon;

-- Email and contact name are shared only for live businesses the owner has claimed (Verified).
create or replace function public.verified_contacts()
returns table (slug text, email text, contact_name text)
language sql stable security definer set search_path = public as $$
  select b.slug, b.email, b.contact_name from public.businesses b where b.is_verified and not b.is_hidden
$$;
revoke all on function public.verified_contacts() from public;
grant execute on function public.verified_contacts() to anon, authenticated;

-- 3. Go live.
update public.businesses set is_hidden = false where is_hidden;

commit;

-- Check. Expected: businesses = live, and a "permission denied" note is NOT shown.
select
  (select count(*) from public.businesses) as businesses,
  (select count(*) from public.businesses where not is_hidden) as live,
  (select count(*) from public.verified_contacts()) as verified_with_contacts;
