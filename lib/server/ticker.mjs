// The "Updates" strip under the menu: GTA news, Toronto police & fire calls, gold and fuel prices.
// Every source is public and read on the server, cached, and skipped quietly if it is down.
//
// Sources
//   News         CityNews Toronto RSS (falls back to CBC Toronto RSS) – headline + link only
//   Police calls Toronto Police Service "Calls for Service" public map layer (C4S_Public_NoGO)
//   Fire calls   Toronto Fire Services active incidents (livecad.xml)
//   Gold         xaus.com spot price in CAD per gram (falls back to gold-api.com + Bank of Canada USD/CAD)
//   Fuel         Government of Ontario weekly fuel price survey (fueltypesall.csv)

const TZ = 'America/Toronto'
const UA = 'TamilTO/1.0 (+https://tamilto.com; hello@tamilto.com)'

export const SOURCES = {
  news: ['https://toronto.citynews.ca/feed/', 'https://www.cbc.ca/webfeed/rss/rss-canada-toronto'],
  police: 'https://services.arcgis.com/S9th0jAJ7bqgIRjw/arcgis/rest/services/C4S_Public_NoGO/FeatureServer/0/query',
  fire: 'https://www.toronto.ca/data/fire/livecad.xml',
  gold: 'https://xaus.com/api/v1/spot?currency=CAD&unit=gram',
  goldUsd: 'https://api.gold-api.com/price/XAU',
  usdcad: 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1',
  fuel: 'https://ontario.ca/v1/files/fuel-prices/fueltypesall.csv',
}

async function get(url, type = 'text', ms = 8000) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': UA, accept: type === 'json' ? 'application/json' : '*/*' }, cache: 'no-store' })
    if (!r.ok) throw new Error(`${r.status} ${url}`)
    return type === 'json' ? await r.json() : await r.text()
  } finally {
    clearTimeout(t)
  }
}

// ---------- small helpers ----------
const ent = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#8217': '’', '#8216': '‘', '#8220': '“', '#8221': '”', '#8211': '–', '#8212': '—', '#038': '&' }
export const decode = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&(#?\w+);/g, (m, k) => ent[k] ?? (k[0] === '#' ? String.fromCharCode(k[1] === 'x' ? parseInt(k.slice(2), 16) : +k.slice(1)) : m)).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : '' }
const SMALL = new Set(['and', 'or', 'of', 'the', 'at', 'in', 'on', 'to', 'a'])
export const title = (s) => String(s || '').toLowerCase().replace(/\b[\w']+\b/g, (w, i) => (i && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1))).replace(/\b(Ne|Nw|Se|Sw|Ttc|Dvp|Qew|Hwy|Gtc)\b/g, (w) => w.toUpperCase())
const clip = (s, n = 110) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s)
export const clock = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d).replace('a.m.', 'AM').replace('p.m.', 'PM')

/** "2026-11-13 22:05:10" in Toronto local time → Date. */
export function torontoTime(s) {
  const [d, t = '00:00:00'] = String(s).trim().split(/[ T]/)
  const guess = new Date(`${d}T${t}Z`)
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(guess).map((p) => [p.type, p.value]))
  const asLocal = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return new Date(guess.getTime() - (asLocal - guess.getTime()))
}

// ---------- GTA news ----------
export function parseRss(xml, source) {
  return [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)]
    .map(([it]) => ({ t: tag(it, 'title'), href: tag(it, 'link'), at: new Date(tag(it, 'pubDate') || tag(it, 'dc:date') || 0) }))
    .filter((x) => x.t && /^https:\/\//.test(x.href))
    .map((x) => ({ kind: 'news', label: 'News', text: clip(x.t), href: x.href, source, at: isNaN(x.at) ? null : x.at.toISOString() }))
}
async function news() {
  const names = ['CityNews Toronto', 'CBC Toronto']
  for (let i = 0; i < SOURCES.news.length; i++) {
    try {
      const list = parseRss(await get(SOURCES.news[i]), names[i])
      if (list.length) return list.slice(0, 5)
    } catch (e) { console.warn('[ticker] news', e.message) }
  }
  return []
}

// ---------- Toronto police & fire calls ----------
export function parsePolice(json, now = Date.now()) {
  return (json.features || [])
    .map(({ attributes: a = {} }) => ({ type: a.CALL_TYPE, where: a.CROSS_STREETS, ms: a.OCCURRENCE_TIME_AGOL, div: a.DIVISION }))
    .filter((x) => x.type && typeof x.ms === 'number' && now - x.ms < 4 * 3600e3 && now - x.ms > -60e3)
    .map((x) => ({ kind: 'police', label: 'Police', text: `${title(x.type)}${x.where ? ' · ' + title(x.where.replace(/\s+-\s+/, ' & ')) : ''}`, time: clock(new Date(x.ms)), at: new Date(x.ms).toISOString(), href: 'https://www.tps.ca/data-maps/', source: 'Toronto Police Service' }))
}
async function police() {
  try {
    const q = new URLSearchParams({ where: '1=1', outFields: 'CALL_TYPE,CROSS_STREETS,OCCURRENCE_TIME_AGOL,DIVISION', orderByFields: 'OCCURRENCE_TIME_AGOL DESC', resultRecordCount: '15', returnGeometry: 'false', f: 'json' })
    return parsePolice(await get(`${SOURCES.police}?${q}`, 'json'))
  } catch (e) { console.warn('[ticker] police', e.message); return [] }
}

// Medical calls are only published by postal area and are private matters: never shown.
const FIRE_SKIP = /^(medical|cardiac|ems|vsa|assist|lift assist)/i
export function parseFire(xml, now = Date.now()) {
  return [...String(xml).matchAll(/<event>[\s\S]*?<\/event>/gi)]
    .map(([e]) => ({ type: tag(e, 'event_type'), prime: tag(e, 'prime_street').replace(/,\s*[A-Z]{1,3}$/, ''), cross: tag(e, 'cross_streets').replace(/^\s*\/\s*|\s*\/\s*$/g, '').replace(/,\s*[A-Z]{1,3}\b/g, ''), at: torontoTime(tag(e, 'dispatch_time')), lev: tag(e, 'alarm_lev') }))
    .filter((x) => x.type && !FIRE_SKIP.test(x.type) && !/^[A-Z]\d[A-Z]$/.test(x.prime) && !isNaN(x.at) && now - x.at < 4 * 3600e3)
    .map((x) => ({ kind: 'fire', label: 'Fire', text: `${title(x.type)}${x.prime ? ' · ' + title(x.prime) + (x.cross ? ' & ' + title(x.cross.split('/')[0].trim()) : '') : ''}${+x.lev > 0 ? ` · Alarm ${x.lev}` : ''}`, time: clock(x.at), at: x.at.toISOString(), href: 'https://www.toronto.ca/community-people/public-safety-alerts/alerts-notifications/toronto-fire-active-incidents/', source: 'Toronto Fire Services' }))
}
async function fire() {
  try { return parseFire(await get(SOURCES.fire)) } catch (e) { console.warn('[ticker] fire', e.message); return [] }
}

// ---------- Gold (CAD) ----------
const OZ = 31.1034768
export function goldItem(perGram24, at, source) {
  if (!(perGram24 > 10 && perGram24 < 2000)) return null
  const m = (n) => '$' + n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return { kind: 'gold', label: 'Gold', text: `24K ${m(perGram24)}/g · 22K ${m(perGram24 * 22 / 24)}/g · ${m(perGram24 * OZ).replace(/\.\d\d$/, '')}/oz CAD`, note: 'Spot price, before jeweller making charges and tax.', at, href: '/updates', source }
}
async function gold() {
  try {
    const j = await get(SOURCES.gold, 'json')
    const it = goldItem(+j?.xau?.price, j.updated_at || new Date().toISOString(), 'xaus.com')
    if (it) return [it]
  } catch (e) { console.warn('[ticker] gold', e.message) }
  try {
    const [g, fx] = await Promise.all([get(SOURCES.goldUsd, 'json'), get(SOURCES.usdcad, 'json')])
    const rate = +fx?.observations?.[0]?.FXUSDCAD?.v
    const it = goldItem((+g.price * rate) / OZ, g.updatedAt || new Date().toISOString(), 'gold-api.com, Bank of Canada')
    return it ? [it] : []
  } catch (e) { console.warn('[ticker] gold fallback', e.message); return [] }
}

// ---------- Fuel prices (Ontario weekly survey) ----------
const csvRow = (line) => { const out = []; let cur = '', q = false; for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out.map((s) => s.trim()) }
export function parseFuel(csv) {
  const lines = String(csv).replace(/^﻿/, '').split(/\r?\n/).filter(Boolean)
  const head = csvRow(lines[0]).map((h) => h.toLowerCase())
  const col = (re) => head.findIndex((h) => re.test(h))
  const iDate = col(/^date/), iW = col(/toronto west/), iE = col(/toronto east/), iOn = col(/ontario average/), iType = col(/^fuel type/)
  if ([iDate, iW, iE, iType].some((i) => i < 0)) return []
  const series = (re) => lines.slice(1).map(csvRow).filter((r) => re.test(r[iType] || '')).map((r) => ({ d: r[iDate], to: (+r[iW] + +r[iE]) / 2, on: +r[iOn] })).filter((r) => r.to > 20).sort((a, b) => a.d.localeCompare(b.d))
  const fmt = (n) => n.toFixed(1)
  const part = (name, s) => {
    if (!s.length) return ''
    const now = s[s.length - 1], prev = s[s.length - 2], ch = prev ? now.to - prev.to : 0
    return `${name} ${fmt(now.to)}¢/L${Math.abs(ch) >= 0.1 ? ` ${ch > 0 ? '▲' : '▼'}${fmt(Math.abs(ch))}` : ''}`
  }
  const reg = series(/^regular unleaded/i), dsl = series(/^diesel/i)
  if (!reg.length) return []
  const week = new Date(reg[reg.length - 1].d + 'T12:00:00Z').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  return [{ kind: 'gas', label: 'Gas', text: `Toronto avg · ${[part('Regular', reg), part('Diesel', dsl)].filter(Boolean).join(' · ')} · week of ${week}`, at: reg[reg.length - 1].d, href: 'https://www.ontario.ca/page/motor-fuel-prices', source: 'Government of Ontario' }]
}
export async function fuel() {
  try { return parseFuel(await get(SOURCES.fuel, 'text', 15000)) } catch (e) { console.warn('[ticker] fuel', e.message); return [] }
}

/** Everything for the strip, in the order it scrolls: prices first, then 3 news, then 3 police/fire calls. */
export async function readTicker({ getFuel = fuel } = {}) {
  const [n, p, f, g, gas] = await Promise.all([news(), police(), fire(), gold(), getFuel()])
  const calls = [...p, ...f].sort((a, b) => (b.at || '').localeCompare(a.at || ''))
  return {
    updatedAt: new Date().toISOString(),
    items: [...g, ...gas, ...n.slice(0, 3), ...calls.slice(0, 3)],
    more: { news: n, calls: calls.slice(0, 10) },
  }
}
