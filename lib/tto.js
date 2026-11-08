// Shared helpers for the TamilTO directory, used on the server and in the browser.
// Ported from the TamilTO 3.0 prototype so search, "open now" and the map behave the same.

export const TONES = ['#8C2A1C', '#9A5416', '#2F5D50', '#6B3A2E', '#1F4E5F', '#7A5A12', '#4A3B6B', '#8A3B52']
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const FULL = { x0: -79.9, x1: -78.95, y0: 43.5, y1: 43.95 }
export const enc = encodeURIComponent

export const re = (r) => (r instanceof RegExp ? r : new RegExp(r.source, r.flags))

export const digits = (p) => {
  let x = String(p || '').replace(/[^0-9]/g, '')
  if (x.length >= 11 && x[0] === '1') x = x.slice(1)
  return x.length >= 10 ? x.slice(0, 10) : ''
}
export const fmtPhone = (p) => (p && p.length >= 10 ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : '')
export const fmtH = (x) => {
  x = ((x % 24) + 24) % 24
  const hr = Math.floor(x), m = Math.round((x - hr) * 60)
  if (hr === 0 && !m) return 'midnight'
  const ap = hr < 12 ? 'AM' : 'PM', h12 = hr % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ap}` : `${h12} ${ap}`
}
export const hexA = (hex, a) => {
  const n = parseInt(String(hex).slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
export const proj = (bd, lng, lat) => [(lng - bd.x0) / (bd.x1 - bd.x0), (bd.y1 - lat) / (bd.y1 - bd.y0)]
export const focusB = (h, z = 1) => ({ x0: h.lng - 0.13 * z, x1: h.lng + 0.13 * z, y0: h.lat - 0.07 * z, y1: h.lat + 0.07 * z })

/** Day of week and decimal hour right now in Toronto. */
export function nowTO(date = new Date()) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const g = (t) => p.find((x) => x.type === t).value
  return { d: DAYS.indexOf(g('weekday')), h: (+g('hour')) % 24 + (+g('minute')) / 60 }
}

/**
 * Hours are stored as 7 entries (Sun..Sat) of {open:'09:00', close:'18:00'} or null.
 * Returns [[openHour, closeHour] | null] x7 with decimal hours; a close past midnight becomes >24.
 */
export function hoursToRanges(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return null
  const t = (s) => { const [h, m] = String(s || '').split(':').map(Number); return Number.isFinite(h) ? h + (m || 0) / 60 : null }
  const r = hours.map((d) => {
    if (!d || !d.open || !d.close) return null
    const o = t(d.open), c = t(d.close)
    if (o == null || c == null) return null
    return [o, c <= o ? c + 24 : c]
  })
  return r.some(Boolean) ? r : null
}

export function openStatus(b, now = nowTO()) {
  if (b.byAppointment) return { open: false, appt: true, text: 'By appointment' }
  const hrs = hoursToRanges(b.hours)
  if (!hrs) return { open: false, text: 'Hours not listed · call ahead' }
  const { d, h } = now
  const td = hrs[d], pv = hrs[(d + 6) % 7]
  if (pv && pv[1] > 24 && h < pv[1] - 24) return { open: true, text: 'Open now · until ' + fmtH(pv[1]) }
  if (td && h >= td[0] && h < td[1]) return { open: true, text: 'Open now · until ' + fmtH(td[1]) }
  if (td && h < td[0]) return { open: false, text: 'Closed · opens ' + fmtH(td[0]) }
  for (let i = 1; i <= 7; i++) {
    const n = hrs[(d + i) % 7]
    if (n) return { open: false, text: `Closed · opens ${i === 1 ? 'tomorrow' : DAYS[(d + i) % 7]} ${fmtH(n[0])}` }
  }
  return { open: false, text: 'Closed' }
}

export const score = (b) => (b.featured ? 10 : 0) + (b.website ? 1 : 0) + (b.address ? 1 : 0) + (b.email ? 1 : 0) + (b.cell ? 1 : 0)

export const EMPTY_FILTER = { cat: null, hood: null, web: false, email: false, addr: false, wa: false, text: '' }

/** "Ask a cousin": turn a plain-language question into filters. */
export function parseAsk(raw, site) {
  const s = ' ' + String(raw || '').toLowerCase() + ' '
  const f = { ...EMPTY_FILTER }
  for (const r of site.askKeywordRules) if (re(r.match).test(s) && site.catByKey[r.category]) { f.cat = r.category; break }
  for (const h of site.neighbourhoods) if (re(h.match).test(s)) { f.hood = h.key; break }
  if (/whatsapp|mobile|\bcell\b/.test(s)) f.wa = true
  if (/website|\bonline\b/.test(s)) f.web = true
  if (/\bemail\b/.test(s)) f.email = true
  if (!f.cat && !f.hood && !f.wa && !f.web && !f.email) f.text = String(raw || '').trim()
  return f
}

/** Filters from a /directory URL query. */
export function filterFromQuery(q, site) {
  if (q.q) return parseAsk(q.q, site)
  const f = { ...EMPTY_FILTER }
  if (q.cat && site.catByKey[q.cat]) f.cat = q.cat
  if (q.hood && site.hoodByKey[q.hood]) f.hood = q.hood
  for (const k of ['web', 'email', 'addr', 'wa']) if (q[k]) f[k] = true
  return f
}

export function matches(b, f, site) {
  if (f.cat && b.category !== f.cat) return false
  if (f.hood && b.neighbourhood !== f.hood) return false
  if (f.web && !b.website) return false
  if (f.email && !b.email) return false
  if (f.addr && !b.address) return false
  if (f.wa && !b.cell) return false
  if (f.text) {
    const ws = f.text.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
    const c = site.catByKey[b.category], h = site.hoodByKey[b.neighbourhood]
    const hay = [b.name, b.listedAs, b.address, b.contactName, c && c.label, h && h.name, b.city].join(' ').toLowerCase()
    if (ws.length && !ws.some((w) => hay.includes(w))) return false
  }
  return true
}

/** Index the raw site payload: lookups by key. */
export function indexSite(site) {
  const catByKey = Object.fromEntries(site.categories.map((c) => [c.key, c]))
  const hoodByKey = Object.fromEntries(site.neighbourhoods.map((h) => [h.key, h]))
  const bizById = Object.fromEntries(site.businesses.map((b) => [b.id, b]))
  return { ...site, catByKey, hoodByKey, bizById }
}

/** Everything a card or profile needs to show one business. */
export function deco(b, site, now) {
  const c = site.catByKey[b.category] || { label: 'Other', colour: '#C9B7A0' }
  const h = site.hoodByKey[b.neighbourhood] || { name: b.city || '' }
  const st = openStatus(b, now)
  const pics = (b.photos || []).map((p) => (typeof p === 'string' ? p : p.url)).filter(Boolean)
  const phone = b.phone || b.cell
  return {
    ...b,
    pics,
    bgImg: pics[0] ? `url("${pics[0]}")` : 'radial-gradient(rgba(255,255,255,.16) 1.2px,transparent 1.6px)',
    bgSize: pics[0] ? 'cover' : '14px 14px',
    href: '/b/' + b.id,
    catLabel: c.label,
    catColor: c.colour,
    hoodName: h.name,
    status: st.text,
    isOpen: st.open,
    statusColor: st.open ? 'var(--green)' : st.appt ? 'var(--teal)' : 'var(--ink2)',
    recLabel: b.contactName ? 'Ask for ' + b.contactName : '',
    wa: 'https://wa.me/1' + (b.cell || b.phone) + '?text=' + enc(`Hi ${b.name}! I found you on TamilTO.`),
    hasWa: !!b.cell,
    tel: 'tel:+1' + phone,
    hasPhone: !!phone,
    phoneFmt: fmtPhone(phone),
    feat: !!b.featured,
    ver: !!b.verified,
    unclaimed: !b.verified,
    quote: !!b.acceptsQuotes,
    hasDeal: !!b.deal,
    hiring: !!(b.jobs && b.jobs.length),
    border: b.featured ? 'rgba(245,184,61,.7)' : 'var(--line)',
    glow: b.featured ? '0 18px 50px rgba(245,184,61,.16)' : 'none',
    photo: b.listedAs,
  }
}

/** Stable pseudo-random generator (used for the decorative QR pattern). */
export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const QR = (() => {
  const n = 21, r = mulberry(42), c = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const f = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7
    let on
    const fin = f(0, 0) ? [0, 0] : f(n - 7, 0) ? [n - 7, 0] : f(0, n - 7) ? [0, n - 7] : null
    if (fin) { const dx = x - fin[0], dy = y - fin[1]; on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) } else on = r() < 0.48
    c.push({ c: on ? '#1A1410' : 'transparent' })
  }
  return c
})()
