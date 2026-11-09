// Single data layer. Every page reads through here.
//
// Live site: reads Supabase (lib/db-read.mjs) when NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Results are cached and refreshed every few minutes,
// or straight away when the admin panel calls /api/revalidate after a save.
//
// Local preview without those settings: reads the bundled sample files instead
//   data/directory.json  – categories, areas, ~400 businesses, lists, life moments (prototype data)
//   lib/sample-data.mjs  – articles and events (fictional sample content)
// The sample files are never used once Supabase is connected.
//
// Fixed settings that are not in the database (ask-a-cousin rules, map shoreline, area links,
// search examples, plans) always come from data/directory.json.
import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import DIR from '@/data/directory.json'
import * as S from './sample-data.mjs'
import { readSite, readArticles, readArticle, readEvents } from './db-read.mjs'
import { withDefaults } from './site-defaults.mjs'

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const LIVE = !!(URL_ && KEY)

/** Cache tags. /api/revalidate clears them after an admin save. */
export const TAGS = ['site', 'articles', 'events']
const REFRESH = 300 // seconds: the longest a change can take to show if the admin panel's refresh call fails

let client
const db = () =>
  (client ||= createClient(URL_, KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }))

const CONFIG = {
  askKeywordRules: DIR.askKeywordRules,
  hoodLinks: DIR.hoodLinks,
  shore: DIR.shore,
  searchExamples: DIR.searchExamples,
  plans: DIR.plans,
}

const HOOD_BY_NAME = { scarborough: 'scarborough', markham: 'markham', toronto: 'toronto', brampton: 'brampton', mississauga: 'mississauga', 'ajax/pickering': 'durham', ajax: 'durham', pickering: 'durham', durham: 'durham', 'richmond hill': 'york', vaughan: 'york', 'vaughan & york': 'york' }
export const hoodKeyFor = (name) => HOOD_BY_NAME[String(name || '').toLowerCase()] || null

// ---------- Sample data (local preview only) ----------
function sampleSite() {
  const businesses = DIR.businesses.filter((b) => !b.hidden)
  const ids = new Set(businesses.map((b) => b.id))
  const keep = (list) => list.filter((id) => ids.has(id))
  return {
    categories: DIR.categories,
    neighbourhoods: DIR.neighbourhoods,
    ...CONFIG,
    ...withDefaults({}),
    stories: [],
    businesses,
    collections: DIR.collections.map((c) => ({ ...c, businessIds: keep(c.businessIds) })).filter((c) => c.businessIds.length),
    journeys: DIR.journeys
      .map((j) => ({ ...j, steps: j.steps.map((s) => ({ ...s, businessIds: keep(s.businessIds) })) }))
      .filter((j) => j.steps.length),
  }
}
const sampleEvents = () => S.EVENTS.map((e) => ({ ...e, hood: hoodKeyFor(e.neighbourhood) }))

// ---------- Cached readers ----------
const siteCached = unstable_cache(() => readSite(db(), URL_, CONFIG), ['tto-site-v1'], { tags: ['site'], revalidate: REFRESH })
const articlesCached = unstable_cache(() => readArticles(db(), URL_), ['tto-articles-v1'], { tags: ['articles'], revalidate: REFRESH })
const articleCached = unstable_cache((slug) => readArticle(db(), URL_, slug), ['tto-article-v1'], { tags: ['articles'], revalidate: REFRESH })
const eventsCached = unstable_cache(() => readEvents(db(), URL_), ['tto-events-v1'], { tags: ['events', 'site'], revalidate: REFRESH })

/** The directory payload: shared by the home page, directory, maps and profiles. */
export async function getSite() {
  return LIVE ? siteCached() : sampleSite()
}

export async function getBusiness(id) {
  return (await getSite()).businesses.find((b) => b.id === id) ?? null
}

export async function getBusinessIds() {
  return (await getSite()).businesses.map((b) => b.id)
}

// ---------- Articles (Eat, Culture, People, Guides, Business) ----------
const byDate = (a, b) => b.publishDate.localeCompare(a.publishDate)
const allArticles = async () => (LIVE ? articlesCached() : [...S.ARTICLES].sort(byDate))

export async function getArticles({ category, categories, neighbourhood, limit = 100 } = {}) {
  const cats = categories || (category ? [category] : null)
  return (await allArticles())
    .filter((a) => (!cats || cats.includes(a.category)) && (!neighbourhood || a.neighbourhood === neighbourhood))
    .slice(0, limit)
}

export async function getArticle(slug) {
  if (LIVE) return articleCached(String(slug))
  return S.ARTICLES.find((a) => a.slug === slug) ?? null
}

// ---------- Events ----------
export async function getEvents({ includePast = false } = {}) {
  const now = Date.now()
  const list = LIVE ? await eventsCached() : sampleEvents()
  return list
    .filter((e) => includePast || new Date(e.end || e.start).getTime() >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
}

export async function getEvent(slug) {
  return (await getEvents({ includePast: true })).find((e) => e.slug === slug) ?? null
}

/** Article + event search for the /search page. */
export async function search(q) {
  q = String(q || '').trim().toLowerCase()
  if (q.length < 2) return { articles: [], events: [] }
  const has = (hay) => hay.filter(Boolean).join(' ').toLowerCase().includes(q)
  return {
    articles: (await allArticles()).filter((a) => has([a.title, a.dek, a.neighbourhood, a.category, ...(a.tags || [])])),
    events: (await getEvents()).filter((e) => has([e.title, e.venue, e.neighbourhood, e.type, e.description])),
  }
}
