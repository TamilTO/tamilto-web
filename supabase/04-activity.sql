-- =====================================================================
-- TamilTO website activity (checklist step 20)
-- Run once: Supabase → SQL Editor → New query → paste → Run. Safe to run again.
--
-- 1. record_activity: the website calls this for every page view, search,
--    WhatsApp tap, call, direction, save, share and quote request.
--    No names, emails, phone numbers or IP addresses are stored: only what
--    happened, on which page, and a code that changes every day.
-- 2. activity_summary and business_activity: the numbers behind the admin's
--    "Website activity" and "Business reports" pages. Only the team can run them.
-- 3. Old activity is deleted automatically after 400 days.
-- =====================================================================
begin;

create index if not exists activity_events_session_idx on public.activity_events (occurred_at, session_hash);

create or replace function public.record_activity(
  p_kind text, p_business text default '', p_path text default '', p_ref text default '',
  p_query text default '', p_session text default '', p_device text default ''
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.activity_events (kind, business_id, path, ref, query, session_hash, device)
  values (
    p_kind,
    (select b.id from public.businesses b where b.slug = nullif(p_business, '') and not b.is_hidden),
    left(coalesce(p_path, ''), 200),
    left(coalesce(p_ref, ''), 120),
    left(coalesce(p_query, ''), 100),
    left(coalesce(p_session, ''), 32),
    case when p_device in ('m', 'd') then p_device else '' end
  );
  -- Now and then, delete activity older than 400 days.
  if random() < 0.002 then
    delete from public.activity_events where occurred_at < now() - interval '400 days';
  end if;
end $$;
revoke all on function public.record_activity(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_activity(text, text, text, text, text, text, text) to service_role;

-- Website-wide numbers for a period (Toronto days).
create or replace function public.activity_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare out jsonb;
begin
  if not public.is_staff() then raise exception 'Only the TamilTO team can see activity.'; end if;
  with e as (
    select kind, business_id, path, ref, query, session_hash, device,
           (occurred_at at time zone 'America/Toronto')::date as d
    from public.activity_events where occurred_at >= p_from and occurred_at < p_to
  )
  select jsonb_build_object(
    'total', (select count(*) from e),
    'kinds', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from e group by kind) x), '{}'::jsonb),
    'visitors', (select count(distinct (d, session_hash)) from e where session_hash <> ''),
    'bizViews', (select count(*) from e where kind = 'view' and business_id is not null),
    'days', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'views', views, 'visitors', visitors, 'bviews', bviews, 'whatsapp', wa, 'call', call, 'directions', dir, 'quote', quote, 'search', search) order by d) from (
      select d, count(*) filter (where kind = 'view') views, count(distinct session_hash) filter (where session_hash <> '') visitors,
             count(*) filter (where kind = 'view' and business_id is not null) bviews, count(*) filter (where kind = 'whatsapp') wa,
             count(*) filter (where kind = 'call') call, count(*) filter (where kind = 'directions') dir, count(*) filter (where kind = 'quote') quote,
             count(*) filter (where kind = 'search') search
      from e group by d) x), '[]'::jsonb),
    'biz', coalesce((select jsonb_agg(jsonb_build_object('id', business_id, 'total', total, 'kinds', kinds) order by total desc) from (
      select business_id, sum(n) total, jsonb_object_agg(kind, n) kinds from (select business_id, kind, count(*) n from e where business_id is not null group by 1, 2) y group by business_id) x), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('p', p, 'n', n) order by n desc) from (
      select split_part(trim(leading '/' from path), '/', 1) p, count(*) n from e where kind = 'view' and business_id is null group by 1) x), '[]'::jsonb),
    'searches', coalesce((select jsonb_agg(jsonb_build_object('q', q, 'n', n) order by n desc) from (
      select lower(trim(query)) q, count(*) n from e where kind = 'search' and trim(query) <> '' group by 1 order by 2 desc limit 50) x), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(dev, n) from (
      select case when device = 'm' then 'm' else 'd' end dev, count(distinct (d, session_hash)) n from e where session_hash <> '' group by 1) x), '{}'::jsonb),
    'refs', coalesce((select jsonb_agg(jsonb_build_object('r', ref, 'n', n) order by n desc) from (
      select ref, count(*) n from e where kind = 'view' and ref <> '' group by 1 order by 2 desc limit 30) x), '[]'::jsonb)
  ) into out;
  return out;
end $$;
revoke all on function public.activity_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.activity_summary(timestamptz, timestamptz) to authenticated;

-- One business: numbers, days, where views came from and the latest actions.
create or replace function public.business_activity(p_business uuid, p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare out jsonb;
begin
  if not public.is_staff() then raise exception 'Only the TamilTO team can see activity.'; end if;
  with e as (
    select occurred_at, kind, ref, device, (occurred_at at time zone 'America/Toronto')::date as d
    from public.activity_events where business_id = p_business and occurred_at >= p_from and occurred_at < p_to
  )
  select jsonb_build_object(
    'kinds', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from e group by kind) x), '{}'::jsonb),
    'days', coalesce((select jsonb_agg(jsonb_build_object('d', d, 'kinds', kinds) order by d) from (
      select d, jsonb_object_agg(kind, n) kinds from (select d, kind, count(*) n from e group by 1, 2) y group by d) x), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(jsonb_build_object('r', ref, 'n', n) order by n desc) from (
      select ref, count(*) n from e where kind = 'view' group by 1) x), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('at', occurred_at, 'kind', kind, 'ref', ref, 'device', device) order by occurred_at desc) from (
      select * from e order by occurred_at desc limit 12) x), '[]'::jsonb)
  ) into out;
  return out;
end $$;
revoke all on function public.business_activity(uuid, timestamptz, timestamptz) from public, anon;
grant execute on function public.business_activity(uuid, timestamptz, timestamptz) to authenticated;

-- Check: should say 0 (no activity yet) the first time.
select count(*) as activity_so_far from public.activity_events;

commit;
