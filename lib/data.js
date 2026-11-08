// Single data layer. Every page reads through here.
//
// Today it reads bundled files:
//   data/directory.json  – categories, areas, ~400 businesses, lists, life moments (from the TamilTO 3.0 prototype)
//   lib/sample-data.mjs  – articles and events (from the first build; fictional sample content)
//
// Step 15 of the launch checklist swaps each function below to read from Supabase.
// Pages never import the files directly, so nothing else has to change.
import 'server-only'
import DIR from '@/data/directory.json'
import * as S from './sample-data.mjs'

const HOOD_BY_NAME = { scarborough: 'scarborough', markham: 'markham', toronto: 'toronto', brampton: 'brampton', mississauga: 'mississauga', 'ajax/pickering': 'durham', ajax: 'durham', pickering: 'durham', durham: 'durham', 'richmond hill': 'york', vaughan: 'york' }
export const hoodKeyFor = (name) => HOOD_BY_NAME[String(name || '').toLowerCase()] || null

/** Fields every page needs to render cards, maps and search. */
const publicBusiness = (b) => b

/** The directory payload: shared by the home page, directory, maps and profiles. */
export async function getSite() {
  const businesses = DIR.businesses.filter((b) => !b.hidden).map(publicBusiness)
  const ids = new Set(businesses.map((b) => b.id))
  const keep = (list) => list.filter((id) => ids.has(id))
  return {
    categories: DIR.categories,
    neighbourhoods: DIR.neighbourhoods,
    askKeywordRules: DIR.askKeywordRules,
    hoodLinks: DIR.hoodLinks,
    shore: DIR.shore,
    searchExamples: DIR.searchExamples,
    plans: DIR.plans,
    businesses,
    collections: DIR.collections.map((c) => ({ ...c, businessIds: keep(c.businessIds) })).filter((c) => c.businessIds.length),
    journeys: DIR.journeys
      .map((j) => ({ ...j, steps: j.steps.map((s) => ({ ...s, businessIds: keep(s.businessIds) })).filter((s) => s.businessIds.length) }))
      .filter((j) => j.steps.length),
  }
}

export async function getBusiness(id) {
  const b = DIR.businesses.find((x) => x.id === id && !x.hidden)
  return b ? publicBusiness(b) : null
}

export async function getBusinessIds() {
  return DIR.businesses.filter((b) => !b.hidden).map((b) => b.id)
}

// ---------- Articles (Eat, Culture, People, Guides, Business) ----------
const byDate = (a, b) => b.publishDate.localeCompare(a.publishDate)

export async function getArticles({ category, categories, neighbourhood, limit = 100 } = {}) {
  const cats = categories || (category ? [category] : null)
  return S.ARTICLES.filter((a) => (!cats || cats.includes(a.category)) && (!neighbourhood || a.neighbourhood === neighbourhood))
    .sort(byDate)
    .slice(0, limit)
}

export async function getArticle(slug) {
  return S.ARTICLES.find((a) => a.slug === slug) ?? null
}

// ---------- Events ----------
const withHood = (e) => ({ ...e, hood: hoodKeyFor(e.neighbourhood) })

export async function getEvents({ includePast = false } = {}) {
  const now = new Date().toISOString()
  return S.EVENTS.filter((e) => includePast || new Date(e.end || e.start).toISOString() >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .map(withHood)
}

export async function getEvent(slug) {
  const e = S.EVENTS.find((x) => x.slug === slug)
  return e ? withHood(e) : null
}

/** Article + event search for the old /search page. */
export async function search(q) {
  q = String(q || '').trim().toLowerCase()
  if (q.length < 2) return { articles: [], events: [] }
  const has = (hay) => hay.filter(Boolean).join(' ').toLowerCase().includes(q)
  return {
    articles: S.ARTICLES.filter((a) => has([a.title, a.dek, a.neighbourhood, a.category, ...(a.tags || [])])).sort(byDate),
    events: (await getEvents()).filter((e) => has([e.title, e.venue, e.neighbourhood, e.type, e.description])),
  }
}
