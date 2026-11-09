-- =====================================================================
-- TamilTO Marketplace (Plan an event, Requests, Creators, Awards, Jobs,
-- Classifieds, Deals, Partners, Advertise)
-- Run once: Supabase → SQL Editor → New query → paste → Run. Safe to run again.
--
-- 1. market_items: every marketplace entry (hub pages, vendor types, event
--    types, request categories, requests, creators, packages, jobs,
--    classifieds, deals, partners, ad options, sponsored spots).
-- 2. award_votes and request_replies: votes and business replies sent from
--    the website. Only the website (secret key) can add them; only the team can read them.
-- 3. More kinds of reader submissions (requests, jobs, classifieds, creator
--    applications, creator bookings, award nominations).
-- 4. Starting content from the TamilTO 3.0 design (no made-up businesses or people).
-- =====================================================================
begin;

create table if not exists public.market_items (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('vertical', 'vendorType', 'eventType', 'requestCat', 'request', 'creator', 'package', 'job', 'classified', 'deal', 'partner', 'adOption', 'sponsor')),
  slug          text not null default '',
  data          jsonb not null default '{}'::jsonb,
  sort          int not null default 0,
  is_hidden     boolean not null default false,
  expires_on    date,                       -- jobs, classifieds and deals disappear after this day
  submission_id uuid references public.submissions(id) on delete set null,  -- the reader post it came from (private)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists market_items_kind_idx on public.market_items (kind, sort);

create table if not exists public.award_votes (
  id          bigserial primary key,
  category    text not null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  voter       text not null,               -- a one-way code, not a name, email or IP address
  created_at  timestamptz not null default now(),
  unique (category, voter)
);

create table if not exists public.request_replies (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.market_items(id) on delete cascade,
  business_name text not null,
  phone         text not null,
  message       text not null default '',
  business_id   uuid references public.businesses(id) on delete set null,
  notified_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.market_items    enable row level security;
alter table public.award_votes     enable row level security;
alter table public.request_replies enable row level security;

drop policy if exists "Public reads marketplace" on public.market_items;
create policy "Public reads marketplace" on public.market_items for select
  using ((not is_hidden and (expires_on is null or expires_on >= (now() at time zone 'America/Toronto')::date)) or (select public.is_staff()));
drop policy if exists "Editors add marketplace" on public.market_items;
create policy "Editors add marketplace" on public.market_items for insert to authenticated with check ((select public.is_editor()));
drop policy if exists "Editors change marketplace" on public.market_items;
create policy "Editors change marketplace" on public.market_items for update to authenticated using ((select public.is_editor())) with check ((select public.is_editor()));
drop policy if exists "Editors remove marketplace" on public.market_items;
create policy "Editors remove marketplace" on public.market_items for delete to authenticated using ((select public.is_editor()));

drop policy if exists "Staff read votes" on public.award_votes;
create policy "Staff read votes" on public.award_votes for select to authenticated using ((select public.is_staff()));
drop policy if exists "Editors remove votes" on public.award_votes;
create policy "Editors remove votes" on public.award_votes for delete to authenticated using ((select public.is_editor()));
drop policy if exists "Staff read replies" on public.request_replies;
create policy "Staff read replies" on public.request_replies for select to authenticated using ((select public.is_staff()));
drop policy if exists "Editors remove replies" on public.request_replies;
create policy "Editors remove replies" on public.request_replies for delete to authenticated using ((select public.is_editor()));

grant select on public.market_items to anon;
grant select, insert, update, delete on public.market_items to authenticated;
grant select, delete on public.award_votes, public.request_replies to authenticated;
grant all on public.market_items, public.award_votes, public.request_replies to service_role;
grant usage, select on sequence public.award_votes_id_seq to service_role;

drop trigger if exists market_items_audit on public.market_items;
create trigger market_items_audit after insert or update or delete on public.market_items for each row execute function public.write_audit();
drop trigger if exists market_items_updated_at on public.market_items;
create trigger market_items_updated_at before update on public.market_items for each row execute function public.set_updated_at();

-- Public numbers: votes per nominee and replies per request (no names or contact details).
create or replace function public.market_counts()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'votes', coalesce((select jsonb_object_agg(category, x) from (
      select v.category, jsonb_object_agg(b.slug, v.n) x from (select category, business_id, count(*) n from public.award_votes group by 1, 2) v
      join public.businesses b on b.id = v.business_id and not b.is_hidden group by v.category) y), '{}'::jsonb),
    'replies', coalesce((select jsonb_object_agg(item_id, n) from (select item_id, count(*) n from public.request_replies group by 1) z), '{}'::jsonb)
  )
$$;
grant execute on function public.market_counts() to anon, authenticated;

-- More kinds of reader submissions.
alter table public.submissions drop constraint if exists submissions_kind_check;
alter table public.submissions add constraint submissions_kind_check
  check (kind in ('tip', 'event', 'listing', 'ad', 'request', 'job', 'classified', 'creator', 'booking', 'nomination'));

-- More site content the admin can edit.
alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('hero', 'searchExamples', 'plans', 'perks', 'how', 'autoStories', 'pages', 'notices', 'newsletter', 'awards'));

-- ---------- Starting content from the TamilTO 3.0 design ----------
insert into public.market_items (kind, slug, data, sort)
select v.kind, v.slug, v.data, v.sort from (values
  ('vertical', 'weddings', '{"id": "weddings", "t": "Weddings", "ta": "கல்யாணம்", "tone": "#8A3B52", "d": "Every vendor for the big day, from the hall and the caterer to the nadaswaram.", "journey": "wedding", "seasonal": {"months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "on": "Wedding expo, spring 2027: vendor booths are open for enquiries.", "off": ""}, "groups": [{"l": "Catering", "kw": "cater"}, {"l": "Halls & venues", "kw": "hall,banquet,venue,mahal"}, {"l": "Decor & stages", "kw": "decor,stage,flower,manavarai"}, {"l": "Photo & video", "kw": "photo,video,film,studio"}, {"l": "Sarees & fashion", "kw": "saree,silk,textile,fashion,boutique"}, {"l": "Jewellery", "kw": "jewel,gold,thaali"}, {"l": "Makeup & mehndi", "kw": "makeup,mehndi,bridal,beauty,salon,hair"}, {"l": "DJ & music", "kw": "dj,music,band,sound,orchestra"}, {"l": "Nadaswaram & thavil", "kw": "nadaswaram,nathaswaram,natheswara,nathaswara,nadhaswaram,nadaswara,thavil"}]}'::jsonb, 0),
  ('vertical', 'realestate', '{"id": "realestate", "t": "Real estate", "ta": "வீடு", "tone": "#1F4E5F", "d": "Tamil-speaking realtors and mortgage brokers who can explain it all to your parents too.", "journey": "home", "notice": "Agents supply their own listings. TamilTO does not republish MLS® listings.", "groups": [{"l": "Realtors", "kw": "realtor,realty,real estate"}, {"l": "Mortgage brokers", "kw": "mortgage"}, {"l": "Closing lawyers", "kw": "lawyer,law office,legal,notary"}, {"l": "Inspection & reno", "kw": "inspect,renovat,contractor,reno"}]}'::jsonb, 1),
  ('vertical', 'pros', '{"id": "pros", "t": "Professional services", "ta": "சேவைகள்", "tone": "#2F5D50", "d": "Accountants, lawyers, immigration consultants, insurance agents, driving schools and tutors.", "seasonal": {"months": [2, 3, 4], "on": "Tax season is here. Book a Tamil-speaking accountant before April 30.", "off": "Tax season starts in February. Get on a Tamil-speaking accountant’s list early."}, "groups": [{"l": "Accountants & tax", "kw": "account,tax,bookkeep,cpa"}, {"l": "Lawyers", "kw": "lawyer,law office,legal,paralegal,notary"}, {"l": "Immigration", "kw": "immigra,visa"}, {"l": "Insurance", "kw": "insur"}, {"l": "Driving schools", "kw": "driving"}, {"l": "Tutors", "kw": "tutor,tuition"}]}'::jsonb, 2),
  ('vertical', 'classes', '{"id": "classes", "t": "Classes & education", "ta": "கல்வி", "tone": "#4A3B6B", "d": "Bharatanatyam, Carnatic music, Tamil school and tuition centres for every age.", "seasonal": {"months": [8, 9], "on": "Back to Class: September enrolment is open at schools across the GTA.", "off": "Back to Class returns every September. Find a class now and beat the waitlists."}, "groups": [{"l": "Dance", "kw": "dance,bharat,natya"}, {"l": "Carnatic music", "kw": "music,veena,mridang,violin,carnatic,vocal"}, {"l": "Tamil school", "kw": "tamil school,padasalai,language"}, {"l": "Tuition centres", "kw": "tutor,tuition,learning,academy"}]}'::jsonb, 3),
  ('vendorType', 'halls-venues', '{"l": "Halls & venues", "kw": "hall,halls,banquet,banquets,venue,venues,mahal,convention centre,convention center,reception hall"}'::jsonb, 0),
  ('vendorType', 'catering', '{"l": "Catering", "kw": "cater,caters,catering,caterer,caterers", "neg": "grocer,grocery,groceries,cash & carry,cash and carry,supermarket"}'::jsonb, 1),
  ('vendorType', 'decor-stages', '{"l": "Decor & stages", "kw": "decor,decors,decoration,decorations,decorator,decorators,stage,stages,florist,florists,flowers,manavarai,balloon,balloons", "neg": "cake,cakes,bakery,bakers,sweets"}'::jsonb, 2),
  ('vendorType', 'photo-video', '{"l": "Photo & video", "kw": "photo,photos,photography,photographer,photographers,video,videos,videography,film,films,studio,studios"}'::jsonb, 3),
  ('vendorType', 'sarees-fashion', '{"l": "Sarees & fashion", "kw": "saree,sarees,sari,silk,silks,textile,textiles,fashion,fashions,boutique,veshti"}'::jsonb, 4),
  ('vendorType', 'jewellery', '{"l": "Jewellery", "kw": "jewel,jewels,jewellery,jewelry,jeweller,jewellers,jeweler,jewelers,gold,thaali"}'::jsonb, 5),
  ('vendorType', 'makeup-mehndi', '{"l": "Makeup & mehndi", "kw": "makeup,make-up,mehndi,henna,bridal,beauty,salon,salons,hair"}'::jsonb, 6),
  ('vendorType', 'dj-music', '{"l": "DJ & music", "kw": "dj,djs,music,band,bands,sound,sounds,orchestra,singer,singers", "neg": "nadaswaram,nathaswaram,natheswara,nathaswara,thavil,school,academy,class,classes"}'::jsonb, 7),
  ('vendorType', 'nadaswaram-thavil', '{"l": "Nadaswaram & thavil", "kw": "nadaswaram,nathaswaram,natheswara,nathaswara,nadhaswaram,nadaswara,thavil"}'::jsonb, 8),
  ('vendorType', 'sweets-cakes', '{"l": "Sweets & cakes", "kw": "bakery,bakeries,bakers,baker,sweet,sweets,cake,cakes,mysore pak,laddu"}'::jsonb, 9),
  ('vendorType', 'priest-pooja', '{"l": "Priest & pooja", "kw": "priest,priests,kurukkal,pooja,poojai,iyer"}'::jsonb, 10),
  ('vendorType', 'invitations-printing', '{"l": "Invitations & printing", "kw": "invitation,invitations,wedding cards,printing,printers"}'::jsonb, 11),
  ('vendorType', 'rentals-tents', '{"l": "Rentals & tents", "kw": "rental,rentals,tent,tents,party supplies"}'::jsonb, 12),
  ('vendorType', 'entertainment', '{"l": "Entertainment", "kw": "magic,magician,clown,clowns,face painting,entertainer,entertainers"}'::jsonb, 13),
  ('eventType', 'wedding', '{"id": "wedding", "t": "Wedding", "ta": "கல்யாணம்", "alias": "wedding,kalyanam,marriage,reception,muhurtham", "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|Nadaswaram & thavil|DJ & music|Priest & pooja|Invitations & printing|Sweets & cakes"}'::jsonb, 0),
  ('eventType', 'engagement', '{"id": "engagement", "t": "Engagement", "ta": "நிச்சயதார்த்தம்", "alias": "engagement,nichayathartham,ring ceremony", "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|Sweets & cakes"}'::jsonb, 1),
  ('eventType', 'saamathiya', '{"id": "saamathiya", "t": "Coming-of-age ceremony", "ta": "சாமத்திய வீடு", "alias": "saamathiya,samathiya,puberty,half saree,ritu", "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|DJ & music|Sweets & cakes"}'::jsonb, 2),
  ('eventType', 'naming', '{"id": "naming", "t": "Naming ceremony", "ta": "பெயர் சூட்டு", "alias": "naming,baby,namakaranam,cradle,30th day", "needs": "Catering|Priest & pooja|Decor & stages|Photo & video|Sweets & cakes|Jewellery"}'::jsonb, 3),
  ('eventType', 'birthday', '{"id": "birthday", "t": "Birthday party", "ta": "பிறந்தநாள்", "alias": "birthday,bday,first birthday,1st birthday,party", "needs": "Halls & venues|Catering|Sweets & cakes|Decor & stages|Photo & video|Entertainment|Rentals & tents"}'::jsonb, 4),
  ('eventType', 'housewarming', '{"id": "housewarming", "t": "House-warming", "ta": "புதுமனை புகுவிழா", "alias": "house warming,housewarming,griha pravesam,new home", "needs": "Priest & pooja|Catering|Sweets & cakes|Decor & stages|Rentals & tents|Photo & video"}'::jsonb, 5),
  ('eventType', 'anniversary', '{"id": "anniversary", "t": "Anniversary", "ta": "திருமண நாள்", "alias": "anniversary,25th,50th,silver,golden", "needs": "Halls & venues|Catering|Decor & stages|DJ & music|Photo & video|Sweets & cakes"}'::jsonb, 6),
  ('eventType', 'arangetram', '{"id": "arangetram", "t": "Arangetram", "ta": "அரங்கேற்றம்", "alias": "arangetram,dance debut,recital,bharatanatyam", "needs": "Halls & venues|Makeup & mehndi|Photo & video|Sarees & fashion|Jewellery|Catering|Invitations & printing"}'::jsonb, 7),
  ('eventType', 'corporate', '{"id": "corporate", "t": "Corporate or community event", "ta": "நிகழ்வு", "alias": "corporate,office,community,fundraiser,gala,festival,pongal,deepavali", "needs": "Halls & venues|Catering|DJ & music|Photo & video|Rentals & tents|Decor & stages"}'::jsonb, 8),
  ('requestCat', 'weddings', '{"l": "Weddings"}'::jsonb, 0),
  ('requestCat', 'events', '{"l": "Events"}'::jsonb, 1),
  ('requestCat', 'food-catering', '{"l": "Food & catering"}'::jsonb, 2),
  ('requestCat', 'real-estate', '{"l": "Real estate"}'::jsonb, 3),
  ('requestCat', 'professional-services', '{"l": "Professional services"}'::jsonb, 4),
  ('requestCat', 'classes', '{"l": "Classes"}'::jsonb, 5),
  ('requestCat', 'home-services', '{"l": "Home services"}'::jsonb, 6),
  ('requestCat', 'other', '{"l": "Other"}'::jsonb, 7),
  ('package', 'launch', '{"id": "launch", "t": "Restaurant launch", "inc": "3 food creators|1 TamilTO article|Newsletter feature|Glowing map pin for a month"}'::jsonb, 0),
  ('package', 'wedding', '{"id": "wedding", "t": "Wedding vendor spotlight", "inc": "2 wedding creators|Featured in the Weddings hub|A spot in a wedding Story"}'::jsonb, 1),
  ('package', 'event', '{"id": "event", "t": "Event hype", "inc": "2 creators|Events page feature|Story countdown|Newsletter mention"}'::jsonb, 2),
  ('package', 'opening', '{"id": "opening", "t": "Grand opening", "inc": "1 creator visit|Openings article|Home page Story|Deals page feature"}'::jsonb, 3),
  ('adOption', 'featured', '{"id": "featured", "t": "Featured & Verified listing", "d": "Glowing map pin, top of search, the Verified Tamil-owned badge, photos, menu, WhatsApp button and monthly stats.", "best": "Every business"}'::jsonb, 0),
  ('adOption', 'catspon', '{"id": "catspon", "t": "Category sponsorship", "d": "Be “Featured Caterer of the Month” or take the top spot in a category like Wedding Photographers.", "best": "Category leaders"}'::jsonb, 1),
  ('adOption', 'leads', '{"id": "leads", "t": "Customer requests", "d": "See customer requests that match your services and reply first.", "best": "Wedding, home and pro services"}'::jsonb, 2),
  ('adOption', 'sponsored', '{"id": "sponsored", "t": "Sponsored articles", "d": "A story like “10 best kothu spots”, always labelled Sponsored.", "best": "Restaurants and launches"}'::jsonb, 3),
  ('adOption', 'newsletter', '{"id": "newsletter", "t": "Newsletter sponsorship", "d": "Own the weekly “What’s on in Tamil Toronto” email.", "best": "Events and big launches"}'::jsonb, 4),
  ('adOption', 'display', '{"id": "display", "t": "Display ads", "d": "Clearly marked ad spots on the site. No pop-ups, no autoplay.", "best": "Brand awareness"}'::jsonb, 5),
  ('adOption', 'social', '{"id": "social", "t": "Social video features", "d": "Short Reels and TikToks on @tamilto.", "best": "Food, fashion and events"}'::jsonb, 6),
  ('adOption', 'events', '{"id": "events", "t": "Event features & partnerships", "d": "Featured event posts, Story countdowns and expo booths.", "best": "Promoters and organisers"}'::jsonb, 7),
  ('adOption', 'creators', '{"id": "creators", "t": "Creator campaigns", "d": "Book Tamil Toronto creators through TamilTO, with proper ad disclosure.", "best": "Launches and openings"}'::jsonb, 8),
  ('adOption', 'grow', '{"id": "grow", "t": "Get online: setup services", "d": "Google Business Profile, a simple website and social accounts set up for you by our partner BICX.", "best": "Businesses new to online"}'::jsonb, 9)
) as v(kind, slug, data, sort)
where not exists (select 1 from public.market_items x where x.kind = v.kind and x.slug = v.slug);

insert into public.site_settings (key, value) values
  ('pages', '{"requests": {"kick": "Customer requests", "title": "Post one request. Get replies.", "ta": "கோரிக்கை", "lead": "Tell us what you need, like a caterer for 200 in Scarborough in March, and matching Tamil businesses reply to you directly. Free for customers."}, "creators": {"kick": "Creator directory", "title": "Tamil Toronto creators", "ta": "படைப்பாளிகள்", "lead": "Food reviewers, comedians, wedding and music creators. Find the right voice for your launch and book through TamilTO."}, "awards": {"kick": "TamilTO Best of", "title": "Best of Tamil Toronto", "ta": "சிறந்தவை", "lead": "The community nominates, the community votes. Winners get a plaque, a badge on their listing and bragging rights at every family function."}, "jobs": {"kick": "Jobs board", "title": "Work at a Tamil business", "ta": "வேலை", "lead": "Kitchens, clinics, classrooms and offices across the GTA, hiring now. Apply straight on WhatsApp."}, "classifieds": {"kick": "Classifieds", "title": "Rent it. Sell it. Find it.", "ta": "விளம்பரங்கள்", "lead": "Basement apartments, rooms, wedding sarees worn once and everything in between. Every post is checked before it goes live."}, "deals": {"kick": "Deals & offers", "title": "Deals from Tamil businesses", "ta": "சலுகைகள்", "lead": "Mention TamilTO when you visit. Offers are set by each business and change often."}, "partners": {"kick": "Trusted partners", "title": "Money transfer, travel and more", "ta": "கூட்டாளர்கள்", "lead": "Services the community uses every month, from partners we have checked are licensed or registered."}, "advertise": {"kick": "Advertise with TamilTO", "title": "Reach Tamil Toronto", "ta": "விளம்பரம்", "lead": "Listings, sponsorships, creator campaigns and the Friday newsletter. Tell us your goal and we will put together a plan."}, "more": {"kick": "Everything on TamilTO", "title": "More to explore", "ta": "மேலும்", "lead": "The whole marketplace in one place."}}'::jsonb),
  ('notices', '{"creators": "Paid posts must be clearly labelled as ads (#ad or “Paid partnership”), as Canada’s Competition Bureau expects. Every creator booked through TamilTO agrees to this.", "partners": "TamilTO may earn a referral fee when you use a partner. It never costs you more and never changes our editorial coverage.", "requests": "We review every request before it goes live. Your name, phone and email stay private: businesses reply through TamilTO and we email you their details.", "sponsored": "Sponsored placements are always labelled. They never change our editorial rankings."}'::jsonb),
  ('newsletter', '{"t": "What’s on in Tamil Toronto", "d": "The best events, openings and deals in one short email every Friday. Free, no spam, unsubscribe any time.", "sponsor": ""}'::jsonb),
  ('awards', '{"year": "2026", "stage": "Voting is open", "dates": "Nominations: Oct 1–31|Voting: Nov 1–30|Winners night: Dec 12", "cats": [{"id": "kothu", "t": "Best kothu roti", "kw": "kothu,restaurant,restaurants,take out,takeout", "neg": "grocery,catering only"}, {"id": "shorteats", "t": "Best short eats", "kw": "bakery,bakeries,bakers,short eats,cake house,sweets"}, {"id": "caterer", "t": "Best wedding caterer", "kw": "catering,caterer,caterers", "neg": "grocery,groceries,cash & carry,supermarket"}, {"id": "saree", "t": "Best saree shop", "kw": "saree,sarees,silks,textiles,boutique"}, {"id": "grocery", "t": "Best grocery", "kw": "grocery,groceries,supermarket,cash & carry,super market"}, {"id": "classes", "t": "Best class or school", "kw": "tuition,tutoring,tutors,dance,academy,music school,tamil school,learning centre", "neg": "tailoring,driving"}]}'::jsonb)
on conflict (key) do nothing;

-- Check: you should see the starting content counts.
select kind, count(*) from public.market_items group by kind order by kind;

commit;
