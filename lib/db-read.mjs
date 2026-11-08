// Reads the public website content from Supabase and turns database rows into the
// shapes the pages already use (the same shapes as data/directory.json).
//
// Only the public "anon" key is used here, so the database's own safety rules (RLS)
// decide what comes back: hidden businesses, hidden events and unpublished articles
// never leave the database. No secret key is needed to read the site.
//
// Plain module with no Next.js imports so it can be tested on its own (lib/data.js adds caching).

const PAGE = 1000 // Supabase returns at most 1000 rows per request, so bigger tables are read in pages.

async function all(db, table, columns, order = 'sort') {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    let q = db.from(table).select(columns)
    for (const o of [].concat(order)) q = q.order(o, { ascending: true })
    const { data, error } = await q.range(from, from + PAGE - 1)
    if (error) throw new Error(`Could not read ${table}: ${error.message}`)
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })

/** Public web address of a file in the "media" storage bucket. Full web addresses pass through. */
export function mediaUrl(base, path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${String(base).replace(/\/+$/, '')}/storage/v1/object/public/media/${String(path).split('/').map(encodeURIComponent).join('/')}`
}

const BUSINESS_COLUMNS =
  'id, slug, name, category_key, listed_as, neighbourhood_key, city, address, lat, lng, geocoded, contact_name, phone, cell, fax, email, website, short_description, deal, jobs, google_maps_url, google_reviews_url, social, hours, by_appointment, plan, is_featured, featured_until, is_verified, accepts_quotes, speaks_tamil, recommendations, tone, seed'

function business(r, photos, hoods) {
  let lat = num(r.lat), lng = num(r.lng)
  if (lat === null || lng === null) {
    // No map position yet: place the pin near the middle of its area, nudged a little so pins don't stack.
    const h = hoods.get(r.neighbourhood_key) || { lat: 43.75, lng: -79.4 }
    const s = Number(r.seed) || 0
    lat = +(h.lat + (((s % 1000) / 1000) - 0.5) * 0.04).toFixed(5)
    lng = +(h.lng + ((((s / 1000) | 0) % 1000) / 1000 - 0.5) * 0.06).toFixed(5)
  }
  return {
    id: r.slug,
    name: r.name,
    category: r.category_key,
    listedAs: r.listed_as || '',
    neighbourhood: r.neighbourhood_key,
    city: r.city || '',
    address: r.address || '',
    contactName: r.contact_name || '',
    phone: r.phone || '',
    cell: r.cell || '',
    fax: r.fax || '',
    email: r.email || '',
    website: r.website || '',
    short: r.short_description || '',
    lng,
    lat,
    geocoded: !!r.geocoded,
    tone: r.tone || '#1F4E5F',
    seed: Number(r.seed) || 0,
    plan: r.plan || 'free',
    featured: !!r.is_featured && (!r.featured_until || r.featured_until >= today()),
    verified: !!r.is_verified,
    acceptsQuotes: !!r.accepts_quotes,
    speaksTamil: !!r.speaks_tamil,
    recommendations: r.recommendations || 0,
    deal: r.deal || '',
    jobs: r.jobs || [],
    photos,
    hours: Array.isArray(r.hours) && r.hours.length === 7 ? r.hours : null,
    byAppointment: !!r.by_appointment,
    social: r.social || {},
    googleMapsUrl: r.google_maps_url || '',
    googleReviewsUrl: r.google_reviews_url || '',
  }
}

/**
 * Everything the directory side of the site needs: categories, areas, live businesses
 * (with photos), cousin-approved lists and life moments.
 * `config` carries the fixed settings that stay in data/directory.json (ask rules, map shoreline...).
 */
export async function readSite(db, base, config) {
  const [cats, hoodRows, rows, photoRows, lists, listItems, journeys, steps, stepBiz] = await Promise.all([
    all(db, 'categories', 'key, label, colour, sort', ['sort', 'key']),
    all(db, 'neighbourhoods', 'key, name, tagline, description, colour, lat, lng, match, sort', ['sort', 'key']),
    all(db, 'businesses', BUSINESS_COLUMNS, ['name', 'id']),
    all(db, 'business_photos', 'business_id, storage_path, sort, alt', ['business_id', 'sort', 'id']),
    all(db, 'collections', 'id, slug, title, curated_by, description, sort', ['sort', 'slug']),
    all(db, 'collection_items', 'collection_id, business_id, sort', ['collection_id', 'sort', 'business_id']),
    all(db, 'journeys', 'id, slug, title, tamil_name, quote_label, description, tone, sort', ['sort', 'slug']),
    all(db, 'journey_steps', 'id, journey_id, sort, when_label, title, tip', ['journey_id', 'sort', 'id']),
    all(db, 'journey_step_businesses', 'step_id, business_id, sort', ['step_id', 'sort', 'business_id']),
  ])

  const neighbourhoods = hoodRows.map((h) => ({
    key: h.key, name: h.name, lng: num(h.lng), lat: num(h.lat), colour: h.colour,
    match: { source: h.match || h.key, flags: '' }, tagline: h.tagline || '', description: h.description || '', sort: h.sort,
  }))
  const hoods = new Map(neighbourhoods.map((h) => [h.key, h]))

  const photosOf = new Map()
  for (const p of photoRows) {
    if (!photosOf.has(p.business_id)) photosOf.set(p.business_id, [])
    photosOf.get(p.business_id).push({ url: mediaUrl(base, p.storage_path), alt: p.alt || '' })
  }

  const slugOf = new Map()
  const businesses = rows.map((r) => {
    slugOf.set(r.id, r.slug)
    return business(r, photosOf.get(r.id) || [], hoods)
  })

  const idsFor = (items, key, owner) =>
    items.filter((i) => i[key] === owner).map((i) => slugOf.get(i.business_id)).filter(Boolean)

  const collections = lists
    .map((c) => ({ id: c.slug, title: c.title, curatedBy: c.curated_by, description: c.description || '', sort: c.sort, businessIds: idsFor(listItems, 'collection_id', c.id) }))
    .filter((c) => c.businessIds.length)

  // Life moments stay up even before their businesses go live: the steps and tips help on their own.
  const journeyList = journeys
    .map((j) => ({
      id: j.slug, title: j.title, tamil: j.tamil_name || '', tone: j.tone, quoteLabel: j.quote_label, description: j.description || '', sort: j.sort,
      steps: steps
        .filter((s) => s.journey_id === j.id)
        .map((s) => ({ when: s.when_label, title: s.title, tip: s.tip || '', sort: s.sort, businessIds: idsFor(stepBiz, 'step_id', s.id) })),
    }))
    .filter((j) => j.steps.length)

  return {
    categories: cats.map((c) => ({ key: c.key, label: c.label, colour: c.colour, sort: c.sort })),
    neighbourhoods,
    ...config,
    businesses,
    collections,
    journeys: journeyList,
  }
}

// ---------- Articles ----------
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const TONES = ['#8C2A1C', '#9A5416', '#2F5D50', '#6B3A2E', '#1F4E5F', '#7A5A12', '#4A3B6B', '#8A3B52']
const ARTICLE_LIST = 'id, section, slug, title, dek, hero_image, hero_alt, hero_caption, hero_credit, tags, neighbourhood, author, publish_at, sponsored, sponsor_name, sponsor_url, is_featured, is_trending, sort'

function words(blocks) {
  let n = 0
  const walk = (v) => {
    if (typeof v === 'string') n += v.split(/\s+/).filter(Boolean).length
    else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!k.startsWith('_') && k !== 'style' && k !== 'marks' && k !== 'listItem' && k !== 'platform' && k !== 'url' && k !== 'tone') walk(x)
  }
  walk(blocks)
  return n
}

function article(r, base) {
  return {
    slug: r.slug,
    category: r.section,
    title: r.title,
    dek: r.dek || '',
    hero: { url: mediaUrl(base, r.hero_image), alt: r.hero_alt || r.title, caption: r.hero_caption || '', credit: r.hero_credit || '', tone: TONES[[...String(r.slug)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length] },
    tags: r.tags || [],
    neighbourhood: r.neighbourhood || '',
    author: r.author || 'TamilTO',
    authorSlug: slugify(r.author || 'TamilTO'),
    publishDate: new Date(r.publish_at).toISOString(),
    sponsored: !!r.sponsored,
    sponsorName: r.sponsor_name || '',
    sponsorUrl: r.sponsor_url || '',
    featured: !!r.is_featured,
    trending: !!r.is_trending,
    sort: r.sort || 0,
  }
}

/** All published stories, newest first (without the story text, for lists and cards). */
export async function readArticles(db, base) {
  const rows = await all(db, 'articles', ARTICLE_LIST, ['publish_at', 'id'])
  return rows.map((r) => article(r, base)).sort((a, b) => b.publishDate.localeCompare(a.publishDate))
}

/** One published story with its full text, or null. */
export async function readArticle(db, base, slug) {
  const { data, error } = await db.from('articles').select(ARTICLE_LIST + ', body').eq('slug', slug).limit(1)
  if (error) throw new Error(`Could not read the story: ${error.message}`)
  const r = data?.[0]
  if (!r) return null
  const body = Array.isArray(r.body) ? r.body : []
  return { ...article(r, base), body, readTime: Math.max(1, Math.round(words(body) / 220)) }
}

// ---------- Events ----------
/** Every visible event, past and upcoming, soonest first. */
export async function readEvents(db, base) {
  const [rows, photos, hoodRows] = await Promise.all([
    all(db, 'events', 'id, slug, title, type, starts_at, ends_at, venue, address, neighbourhood_key, price, sold_out, description, ticket_url, host_business_id, tone', ['starts_at', 'id']),
    all(db, 'event_photos', 'event_id, storage_path, sort, alt', ['event_id', 'sort', 'id']),
    all(db, 'neighbourhoods', 'key, name', ['sort', 'key']),
  ])
  // Host businesses: only live ones come back, so a hidden host is simply not linked.
  const hostIds = [...new Set(rows.map((e) => e.host_business_id).filter(Boolean))]
  let bizRows = []
  if (hostIds.length) {
    const { data, error } = await db.from('businesses').select('id, slug').in('id', hostIds)
    if (error) throw new Error(`Could not read event hosts: ${error.message}`)
    bizRows = data
  }
  const hoodName = new Map(hoodRows.map((h) => [h.key, h.name]))
  const slugOf = new Map(bizRows.map((b) => [b.id, b.slug]))
  const cover = new Map()
  for (const p of photos) if (!cover.has(p.event_id)) cover.set(p.event_id, p)
  return rows.map((e) => {
    const p = cover.get(e.id)
    return {
      slug: e.slug,
      title: e.title,
      type: e.type,
      start: new Date(e.starts_at).toISOString(),
      end: e.ends_at ? new Date(e.ends_at).toISOString() : null,
      venue: e.venue || '',
      address: e.address || '',
      neighbourhood: hoodName.get(e.neighbourhood_key) || '',
      hood: e.neighbourhood_key || null,
      price: Number(e.price) || 0,
      soldOut: !!e.sold_out,
      ticketUrl: e.ticket_url || '',
      image: { tone: e.tone || '#1F4E5F', url: p ? mediaUrl(base, p.storage_path) : '', alt: (p && p.alt) || e.title },
      description: e.description || '',
      hostBusinessId: slugOf.get(e.host_business_id) || null,
    }
  })
}
