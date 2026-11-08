# TamilTO website (3.0)

The live code for **tamilto.com**. It combines the TamilTO 3.0 design with the working parts of
the first build (articles, events, calendar files, SEO, newsletter, cookie banner).

Built by Claude for Pavithran, step 13 of the TamilTO launch checklist.

## What's inside

| Page | Address | Notes |
|---|---|---|
| Home | `/` | Ask-a-cousin search, Live GTA map, Stories, categories, life moments, areas, lists, events, Eat & Culture, newsletter |
| Directory | `/directory` | Search, filters, list and map. Filters are in the address, so `/directory?cat=food&hood=markham` can be shared |
| Business profile | `/b/<id>` | Photos, contact, hours, map, "also nearby", Google search data (JSON-LD) |
| Area pages | `/n/scarborough` etc. | 7 areas |
| Life moments | `/journey/wedding`, `/journey/baby`, `/journey/home` | Add vendors to a plan, share it, ask all of them for quotes |
| Cousin-approved lists | `/c/<id>` | 4 lists |
| Events | `/events`, `/events/<slug>`, `/events/<slug>/ics` | "Add to calendar" downloads a calendar file |
| Eat, Culture | `/eat`, `/culture` | Articles plus food and class businesses |
| Articles | `/eat/<slug>`, `/culture/<slug>`, `/people`, `/guides` | From the first build |
| For businesses | `/business` | Claim or add a listing, plans and pricing |
| About, Advertise, Editorial policy, Submit a tip | | From the first build |
| Sitemap, robots, share images | `/sitemap.xml`, `/robots.txt` | Automatic |

Not in this release (on purpose): the 3.0 marketplace pages (requests, creators, awards, jobs,
classifieds, deals, partners). They get added one at a time after launch.

## Where the content comes from (for now)

- `data/directory.json`: categories, areas, about 400 businesses, lists and life moments, taken from the 3.0 prototype.
- `lib/sample-data.mjs`: sample articles and events (fictional) from the first build.

Every page reads through `lib/data.js`. Step 15 changes only that file to read from Supabase.

## What works now, and what waits for later steps

| Feature | Now | Becomes real in |
|---|---|---|
| All pages, search, filters, map, saved shortlist, life-moment plans, dark/light | Works | - |
| Quote requests (`/api/leads`) | Checked, then logged on your computer. On the live site it politely says "opens soon" | Step 20 (saved + emailed to each business) |
| Claim / add a business (`/api/claims`) | Same | Steps 15 and 20 (review queue in the admin) |
| Submit a tip / event (`/api/submit`) | Same | Step 15 |
| Activity tracking (`/api/track`) | Checked, bots ignored, no personal data | Step 20 (saved for the dashboards) |
| Newsletter | Works once a provider key is added | Optional |
| Admin panel | Not yet | Step 19 |

Nothing pretends to work: until the database is connected, the live site never tells a visitor
something was sent when it wasn't.

## Before anything goes public

- All 400 businesses come from the Vanikam list. Confirm you may republish it (checklist step 32).
- No business shows "Verified Tamil-owned" until the owner has confirmed (step 34).
- Sample articles and events are fictional. Replace them before launch.

## Running it on a computer (for a developer, or for Claude)

```
cd tamilto-web
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
npm run build        # the same check Netlify runs
```

Fonts are bundled (no Google Fonts call), so the build works offline.
