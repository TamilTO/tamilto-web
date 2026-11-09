'use client'
// The Marketplace pages (Plan an event, hubs, Requests, Creators, Awards, Jobs, Classifieds, Deals,
// Partners, Advertise, More), ported from TamilTO 3.0. This builds everything those pages show.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSite } from './useSite'
import { enc } from '@/lib/tto'
import { track } from './App'

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const words = (kw) => String(kw || '').split(',').map((x) => x.trim()).filter(Boolean).map(esc)
export const kwRe = (kw) => { const p = words(kw); return p.length ? new RegExp(p.join('|'), 'i') : /$^/ }
export const wbRe = (kw) => { const p = words(kw); return p.length ? new RegExp('\\b(?:' + p.join('|') + ')\\b', 'i') : null }
export const hay = (b) => [b.n || b.name, b.short, b.listedAs, b.catLabel].filter(Boolean).join(' ')
const hayP = (b) => [b.listedAs, b.catLabel, b.short].filter(Boolean).join(' ')
export const agoT = (d) => (d == null ? '' : d < 1 ? 'Today' : d < 2 ? 'Yesterday' : d < 7 ? Math.round(d) + ' days ago' : d < 30 ? Math.round(d / 7) + ' weeks ago' : Math.round(d / 30) + ' months ago')
const wa = (p, t) => { const d = String(p || '').replace(/\D/g, '').slice(-10); return d.length === 10 ? `https://wa.me/1${d}?text=` + enc(t) : '' }
const rank = (a, b) => (b.feat ? 1 : 0) - (a.feat ? 1 : 0) || (b.recommendations || 0) - (a.recommendations || 0) || (b.ver ? 1 : 0) - (a.ver ? 1 : 0) || a.n.localeCompare(b.n)
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const TONES = ['#8C2A1C', '#9A5416', '#2F5D50', '#6B3A2E', '#1F4E5F', '#7A5A12', '#4A3B6B', '#8A3B52']

const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem('tto2-' + k)); return v ?? d } catch { return d } }
const keep = (k, v) => { try { localStorage.setItem('tto2-' + k, JSON.stringify(v)) } catch {} }

/** Read a submitted form into a plain object (checkbox groups become lists). */
export const formData = (e) => {
  e.preventDefault()
  const o = {}
  new FormData(e.target).forEach((val, k) => { if (typeof val === 'string') o[k] = o[k] !== undefined ? [].concat(o[k], val) : val })
  return o
}

export const HUB = [
  ['Plan an event', 'Vendors for every celebration, ranked by cousins', '/plan', '#E2629B'],
  ['Customer requests', 'Post one request, get replies', '/requests', '#FF6B7D'],
  ['Real estate', 'Tamil-speaking realtors & mortgages', '/v/realestate', '#5EC2D1'],
  ['Professional services', 'Accountants, lawyers, immigration', '/v/pros', '#62D394'],
  ['Classes & education', 'Dance, music, Tamil school', '/v/classes', '#9C86F0'],
  ['Creators', 'Book Tamil Toronto creators', '/creators', '#F59A3D'],
  ['Best of awards', 'Nominate and vote', '/awards', '#F5B83D'],
  ['Jobs', 'Work at a Tamil business', '/jobs', '#A5C25A'],
  ['Classifieds', 'Rentals, rooms, for sale', '/classifieds', '#4FB6DE'],
  ['Deals', 'Offers from local businesses', '/deals', '#FF9A66'],
  ['Trusted partners', 'Money transfer, travel, insurance', '/partners', '#C6A3F0'],
  ['Advertise', 'Reach Tamil Toronto', '/advertise', '#F7F0E6'],
].map(([t, d, href, c]) => ({ t, d, href, c }))

/** Award categories with their nominees and real vote counts. */
export function awardCats(market, all, byId, mine = {}, extra = {}) {
  return (market.awards.cats || [])
    .map((c) => {
      const re = wbRe(c.kw), ng = wbRe(c.neg)
      const pool = (Array.isArray(c.ids) && c.ids.length
        ? c.ids.map((id) => byId[id]).filter(Boolean)
        : all.filter((b) => ((c.cat && b.category === c.cat) || (re && (re.test(b.n) || re.test(hayP(b))))) && !(ng && ng.test(b.n + ' ' + hayP(b))))
      ).sort(rank).slice(0, 4)
      const counts = pool.map((b) => ((market.votes[c.id] || {})[b.id] || 0) + ((extra[c.id] || {})[b.id] || 0))
      const tot = counts.reduce((a, b) => a + b, 0)
      return { ...c, pool, counts, tot, mine: mine[c.id] }
    })
    .filter((c) => c.pool.length)
}

export function useMarketView(page, raw, market, nowAt, route = {}) {
  const { site, all, byId, app } = useSite(raw, nowAt)
  const router = useRouter()
  const [u, setUState] = useState({})
  const setU = useCallback((o) => setUState((x) => ({ ...x, ...o })), [])
  const [local, setLocal] = useState({ myReqs: [], replied: [], votes: {}, extraVotes: {}, nlDone: false, adPkg: '' })
  useEffect(() => {
    let pkg = ''
    try { pkg = sessionStorage.getItem('tto-adpkg') || ''; sessionStorage.removeItem('tto-adpkg') } catch {}
    setLocal((x) => ({ ...x, myReqs: load('myreqs', []), replied: load('replied', []), votes: load('votes', {}), adPkg: pkg }))
  }, [])
  const flash = app.flash
  const hoods = site.neighbourhoods
  const hn = (k) => (site.hoodByKey[k] ? site.hoodByKey[k].name : k || 'GTA')
  const chip = (l, on, onClick) => ({ label: l, onClick, pressed: on ? 'true' : 'false', bg: on ? 'var(--ink)' : 'var(--glass2)', fg: on ? 'var(--bg)' : 'var(--ink)', border: on ? 'var(--ink)' : 'var(--line2)' })
  const chips = (list, key, allL = 'All') => [allL, ...list].map((l) => chip(l, (u[key] || allL) === l, () => setU({ [key]: l })))

  // Send a marketplace form to the website. Returns true when it was received.
  const send = async (type, o, okMsg) => {
    try {
      const r = await fetch('/api/market', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...o, form: type }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { flash(j.error || 'That didn’t send. Please try again.'); return false }
      if (okMsg) flash(okMsg)
      return true
    } catch {
      flash('No connection. Please try again.')
      return false
    }
  }

  const groups = useMemo(() => (market.vendorTypes || []).map((g) => ({ ...g, re: kwRe(g.kw), reP: wbRe(g.kw) || /$^/, reNeg: g.neg ? kwRe(g.neg) : null })), [market.vendorTypes])
  const evTypesAll = useMemo(() => (market.eventTypes || []).map((e) => ({ ...e, aliasRe: kwRe(e.alias), needList: String(e.needs || '').split('|').filter(Boolean) })), [market.eventTypes])
  const verts = useMemo(() => (market.verticals || []).map((vt) => ({ ...vt, groups: (vt.groups || []).filter((g) => g && g.l).map((g) => ({ ...g, re: kwRe(g.kw) })) })), [market.verticals])
  const inG = (b, g) => g.re.test(hay(b))
  const sponFor = (slot, pool, label) => {
    const x = (market.sponsors || []).find((y) => y.slot === slot && byId[y.bizId])
    const b = x ? byId[x.bizId] : pool.find((y) => y.feat)
    return b ? { has: true, ...b, title: (x && x.title) || `Featured ${label} of the month` } : { has: false }
  }

  const v = {
    pg: market.pages[page] || {},
    notice: market.notices,
    hoodOpts: hoods.map((h) => ({ k: h.key, n: h.name })),
    rqCatOpts: market.requestCats.map((l) => ({ l })),
    clKindOpts: market.classifiedKinds.map((l) => ({ l })),
    jobTypeOpts: market.jobTypes.map((l) => ({ l })),
    news: { ...market.newsletter, hasSponsor: !!market.newsletter.sponsor, done: local.nlDone, notDone: !local.nlDone, doneMsg: local.nlMsg || 'Almost there. Check your inbox to confirm. Nandri!' },
    nlSubmit: async (e) => {
      const o = formData(e)
      try {
        const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: o.email, placement: 'more' }) })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) return flash(j.error || 'That didn’t work. Please try again.')
        track('newsletter')
        setLocal((x) => ({ ...x, nlDone: true, nlMsg: j.saved ? 'You’re on the list. The first email arrives Friday. Nandri!' : '' }))
      } catch { flash('No connection. Please try again.') }
    },
  }

  // ---------- Requests ----------
  const rqDeco = (x) => {
    const mine = local.replied.includes(x.uid), n = (x.resp || 0) + (mine ? 1 : 0)
    return {
      ...x, areaN: hn(x.area), agoT: agoT(x.days), respLabel: n ? `${n} business${n === 1 ? ' has' : 'es have'} replied` : 'No replies yet',
      hasBudget: !!x.budget, hasSize: !!x.size, hasWhen: !!x.when, hasSub: !!x.sub, helping: u.help === x.uid, sent: mine, notSent: !mine,
      toggleHelp: () => setU({ help: u.help === x.uid ? null : x.uid }),
      sendHelp: async (e) => {
        const o = formData(e)
        if (await send('reply', { ...o, item: x.uid }, 'Sent. The customer gets your details and will contact you directly.')) {
          track('reply', '', x.uid)
          const r = [...local.replied, x.uid]
          keep('replied', r)
          setLocal((y) => ({ ...y, replied: r }))
          setU({ help: null })
        }
      },
    }
  }
  if (page === 'requests' || page === 'home') {
    const c = u.rqCat || 'All', L = market.requests.map(rqDeco).filter((x) => c === 'All' || x.cat === c)
    Object.assign(v, {
      rqChips: chips(market.requestCats, 'rqCat'), rqList: L, rqEmpty: !L.length,
      myReqs: local.myReqs.map((x) => ({ t: x.t, cat: x.cat, areaN: hn(x.area), agoT: agoT((Date.now() - x.at) / 864e5) })), hasMy: local.myReqs.length > 0,
      rqSubmit: async (e) => {
        const o = formData(e), form = e.target
        if (await send('request', o, 'Thanks! We review every request before it goes live, usually within a day.')) {
          track('request', '', o.cat)
          const m = [{ t: o.t, cat: o.cat, area: o.area, at: Date.now() }, ...local.myReqs].slice(0, 10)
          keep('myreqs', m)
          setLocal((y) => ({ ...y, myReqs: m }))
          form.reset()
        }
      },
      hReqs: market.requests.slice(0, 3).map(rqDeco),
    })
  }

  // ---------- Hub pages (Weddings, Real estate, Professional services, Classes) ----------
  if (page === 'vert') {
    const vt = verts.find((x) => x.id === route.id) || verts[0]
    const key = 'vg_' + vt.id, gl = u[key] || 'All', g = vt.groups.find((x) => x.l === gl)
    const inV = all.filter((b) => vt.groups.some((x) => inG(b, x))).sort(rank), list = g ? inV.filter((b) => inG(b, g)) : inV
    const mo = new Date().getMonth() + 1, se = vt.seasonal, on = se && (se.months || []).includes(mo), st = se ? (on ? se.on : se.off) : ''
    const n = u['vm_' + vt.id] || 24
    Object.assign(v, {
      pg: { kick: 'Marketplace', title: vt.t, ta: vt.ta, lead: vt.d },
      vt: { ...vt, hasNotice: !!vt.notice, season: st, hasSeason: !!st, seasonOn: !!on, hasJourney: !!(vt.journey && site.journeys.some((j) => j.id === vt.journey)), journeyHref: '/journey/' + vt.journey, count: inV.length, countLabel: `${list.length} ${g ? g.l.toLowerCase() : 'businesses'}` },
      vGroups: [['All', inV.length], ...vt.groups.map((x) => [x.l, inV.filter((b) => inG(b, x)).length])].map(([l, c]) => ({ ...chip(l, gl === l, () => setU({ [key]: l, ['vm_' + vt.id]: 24 })), count: c })),
      vSpon: sponFor(vt.id + ':' + (g ? g.l : 'All'), list, g ? g.l.replace(/s$/, '').toLowerCase() : vt.t.toLowerCase() + ' vendor'),
      vList: list.slice(0, n), vMore: list.length > n, vLoad: () => setU({ ['vm_' + vt.id]: n + 24 }), vEmpty: !list.length,
    })
  }

  // ---------- Plan an event ----------
  if (page === 'plan') {
    const q = String(u.planQ || '').trim(), ql = q.toLowerCase()
    const evByQ = ql ? evTypesAll.find((e) => e.aliasRe.test(ql) || e.t.toLowerCase().includes(ql)) : null
    const ev = evTypesAll.find((e) => e.id === (u.planEv || (u.planQ == null ? route.id : null))) || evByQ || (ql ? null : evTypesAll[0])
    const hood = u.planHood || '', textOnly = !!ql && !evByQ
    const pool = all.filter((b) => !hood || b.neighbourhood === hood)
    const score = (b) => (b.recommendations || 0) * 2 + (app.recd.includes(b.id) ? 6 : 0) + (app.saved.includes(b.id) ? 3 : 0) + (b.inPlan ? 2 : 0) + (b.ver ? 1 : 0)
    const cous = (a, b) => score(b) - score(a) || (b.ver ? 1 : 0) - (a.ver ? 1 : 0) || (b.feat ? 1 : 0) - (a.feat ? 1 : 0) || a.n.localeCompare(b.n)
    const bestG = {}
    pool.forEach((b) => {
      let best = null, bs = 0, bp = 1e9
      const nm = b.n || '', sd = b.short || '', src = [b.listedAs || '', b.catLabel || ''].join(' ')
      groups.forEach((g) => {
        let sc = 0
        const inName = g.reP.test(nm)
        if (inName) sc += 3
        if (g.reP.test(sd)) sc += 2
        const m = src.match(g.reP)
        if (m) sc += 1
        if (!sc) return
        if (g.reNeg && g.reNeg.test(nm)) return
        if (g.reNeg && !inName && g.reNeg.test(src + ' ' + sd)) sc -= 0.5
        if (sc <= 0) return
        const pos = m ? m.index : -1
        if (sc > bs || (sc === bs && pos > -1 && pos < bp)) { best = g.l; bs = sc; bp = pos > -1 ? pos : 1e9 }
      })
      if (best) bestG[b.id] = best
    })
    const gs = textOnly ? groups : ev ? ev.needList.map((l) => groups.find((g) => g.l === l)).filter(Boolean) : groups
    const more = u.planMore || {}
    const planGroups = gs.map((g) => {
      let L = pool.filter((b) => bestG[b.id] === g.l)
      if (textOnly) L = L.filter((b) => hay(b).toLowerCase().includes(ql) || g.l.toLowerCase().includes(ql))
      L = L.sort(cous)
      const n = more[g.l] ? 24 : 3, mx = Math.max(1, ...L.map(score))
      return {
        l: g.l, count: L.length, countLabel: `${L.length} ${L.length === 1 ? 'vendor' : 'vendors'}`, empty: !L.length, has: L.length > 0, hasMore: L.length > n,
        showMore: () => setU({ planMore: { ...more, [g.l]: true } }), moreLabel: `Show all ${L.length}`,
        list: L.slice(0, n).map((b, i) => {
          const sc = score(b), has = sc > 0
          return {
            ...b, rank: has ? '#' + (i + 1) : 'NEW', rankFs: has ? '20px' : '13px', rankBg: !has ? 'var(--glass2)' : i === 0 ? '#F5B83D' : i === 1 ? '#CDBFAC' : i === 2 ? '#C98A5A' : 'var(--glass2)', rankFg: has && i < 3 ? '#1A1410' : 'var(--ink)',
            hasScore: has, noScore: !has, pctW: Math.max(6, Math.round((sc / mx) * 100)) + '%', cousin: `Cousin score ${Math.round((sc / mx) * 100)}`,
            recN: b.recommendations ? `${b.recommendations} recommendations` : b.ver ? 'Verified Tamil-owned' : b.catLabel,
          }
        }),
      }
    }).filter((g) => (textOnly ? g.has : true))
    const inPlan = all.filter((b) => b.inPlan)
    Object.assign(v, {
      evTypes: evTypesAll.map((e) => ({ ...e, on: ev && ev.id === e.id, pressed: ev && ev.id === e.id ? 'true' : 'false', border: ev && ev.id === e.id ? 'var(--mari)' : 'var(--line)', bg: ev && ev.id === e.id ? 'var(--glass2)' : 'var(--glass)', count: e.needList.length, pick: () => setU({ planEv: e.id, planQ: '', planMore: {} }) })),
      planQ: q, onPlanQ: (e) => setU({ planQ: e.target.value, planEv: null, planMore: {} }), planSearch: (e) => e.preventDefault(),
      planHoods: [['', 'All GTA'], ...hoods.map((h) => [h.key, h.name])].map(([k, l]) => chip(l, hood === k, () => setU({ planHood: k, planMore: {} }))),
      planGroups,
      plan3: {
        hasEv: !!ev, noEv: !ev, t: ev ? ev.t : 'Results for “' + q + '”', ta: ev ? ev.ta : '', sub: ev ? `${gs.length} vendor types for a ${ev.t.toLowerCase()}, each ranked by cousin approval` : `Vendors matching “${q}”, ranked by cousin approval`,
        none: !planGroups.some((g) => g.has), inPlan: inPlan.length, hasPlan: inPlan.length > 0, planLabel: `${inPlan.length} in your plan`,
        quote: () => app.openQuote(inPlan.map((b) => b.id), ev ? ev.t : 'Event'),
        share: 'https://wa.me/?text=' + enc(`My ${ev ? ev.t.toLowerCase() : 'event'} plan from TamilTO:\n` + inPlan.map((b) => `• ${b.n} (${b.catLabel})`).join('\n')),
      },
    })
  }

  // ---------- Creators ----------
  if (page === 'creators') {
    const niches = [...new Set(market.creators.map((c) => c.niche).filter(Boolean))], c0 = u.crNiche || 'All'
    Object.assign(v, {
      crChips: chips(niches, 'crNiche'),
      crList: market.creators.filter((c) => c0 === 'All' || c.niche === c0).map((c) => ({
        ...c, tone: c.tone || TONES[hash(c.uid) % 8], initial: (c.n || '?')[0], areaN: hn(c.area), platList: String(c.plats || '').split(',').map((x) => x.trim()).filter(Boolean), hasRate: !!c.rate,
        booking: u.book === c.uid, toggleBook: () => setU({ book: u.book === c.uid ? null : c.uid }),
        sendBook: async (e) => { const o = formData(e); if (await send('booking', { ...o, creator: c.n, creatorId: c.uid }, `Booking request sent. We’ll connect you with ${c.n}.`)) { track('booking', '', c.uid); setU({ book: null }) } },
      })),
      crEmpty: !market.creators.length,
      pkgs: market.packages.map((p) => ({ ...p, incList: String(p.inc || '').split('|').filter(Boolean), ask: () => { try { sessionStorage.setItem('tto-adpkg', p.t) } catch {} router.push('/advertise') } })),
      crJoin: async (e) => { const o = formData(e), f = e.target; if (await send('creator', o, 'Thanks! We’ll review your profile and get back to you.')) f.reset() },
    })
  }

  // ---------- Awards ----------
  if (page === 'awards' || page === 'home') {
    const cats = awardCats(market, all, byId, local.votes, local.extraVotes)
    const A = market.awards
    v.aw = { year: A.year, stage: A.stage, href: '/awards' }
    v.awDates = String(A.dates || '').split('|').filter(Boolean).map((x) => { const [a, b] = x.split(':'); return { l: (a || '').trim(), d: (b || '').trim() } })
    v.awCats = cats.map((c) => ({
      id: c.id, t: c.t, sponsor: c.sponsor || '', hasSponsor: !!c.sponsor, voted: !!c.mine, status: c.mine ? '✓ You voted in this category' : 'Tap a name to vote',
      nominees: c.pool.map((b, i) => {
        const p = c.tot ? Math.round((c.counts[i] / c.tot) * 100) : 0, me = c.mine === b.id
        return {
          n: b.n, href: b.href, sub: b.hoodName, pct: c.tot ? p + '%' : '', w: p + '%', mine: me, bar: me ? 'var(--mari)' : 'var(--line2)', border: me ? 'var(--mari)' : 'var(--line)', canVote: !c.mine,
          vote: async () => {
            if (c.mine) return
            if (await send('vote', { cat: c.id, biz: b.id }, 'Vote counted for ' + b.n)) {
              track('vote', b.id, c.id)
              const votes = { ...local.votes, [c.id]: b.id }
              keep('votes', votes)
              setLocal((y) => ({ ...y, votes, extraVotes: { ...y.extraVotes, [c.id]: { [b.id]: 1 } } }))
            }
          },
        }
      }),
    }))
    v.awCatOpts = (market.awards.cats || []).map((c) => ({ l: c.t }))
    v.nominate = async (e) => { const o = formData(e), f = e.target; if (await send('nomination', o, 'Nomination received. Nandri!')) { track('nominate', '', o.cat); f.reset() } }
    v.hAw = cats.slice(0, 3).map((c) => ({ t: c.t, lead: c.pool[0] ? c.pool[0].n : '' }))
    v.awEmpty = !v.awCats.length
  }

  // ---------- Jobs ----------
  if (page === 'jobs') {
    const L = [
      ...market.jobs.map((j) => ({ ...j, bizHref: j.bizId && byId[j.bizId] ? byId[j.bizId].href : '' })),
      ...all.filter((b) => b.hiring).flatMap((b) => (b.jobs || []).map((t, i) => ({ uid: b.id + i, t: typeof t === 'string' ? t : t.t, biz: b.n, bizHref: b.href, type: 'Job', area: b.neighbourhood, pay: '', d: '', phone: b.cell || b.phone, days: null, onProfile: true }))),
    ]
    const ty = u.jobType || 'All'
    v.jobChips = chips(market.jobTypes, 'jobType')
    v.jobList = L.filter((j) => ty === 'All' || j.type === ty).map((j) => ({ ...j, areaN: hn(j.area), agoT: j.onProfile ? 'on their profile' : agoT(j.days), hasPay: !!j.pay, hasD: !!j.d, hasBiz: !!j.bizHref, noBiz: !j.bizHref, apply: wa(j.phone, `Hi! I saw your job on TamilTO: ${j.t}.`) || j.bizHref || '/jobs' }))
    v.jobEmpty = !v.jobList.length
    v.jobSubmit = async (e) => { const o = formData(e), f = e.target; if (await send('job', o, 'Job received. It goes live once we check it, usually within a day.')) f.reset() }
  }

  // ---------- Classifieds ----------
  if (page === 'classifieds') {
    const k = u.clKind || 'All'
    const L = market.classifieds.filter((x) => k === 'All' || x.kind === k).sort((a, b) => (b.boost ? 1 : 0) - (a.boost ? 1 : 0) || (a.days || 0) - (b.days || 0))
    v.clChips = chips(market.classifiedKinds, 'clKind')
    v.clList = L.map((x) => ({ ...x, areaN: hn(x.area), agoT: agoT(x.days), boost: !!x.boost, hasPrice: !!x.price, border: x.boost ? 'rgba(245,184,61,.7)' : 'var(--line)', contact: wa(x.phone, `Hi! Is “${x.t}” on TamilTO still available?`) || '/classifieds' }))
    v.clEmpty = !L.length
    v.clSubmit = async (e) => { const o = formData(e), f = e.target; if (await send('classified', o, 'Posted for review. It goes live once we check it.')) f.reset() }
  }

  // ---------- Deals ----------
  if (page === 'deals') {
    const L = [
      ...market.deals.filter((d) => byId[d.bizId]).map((d) => ({ ...byId[d.bizId], dealT: d.t, until: d.until || '' })),
      ...all.filter((b) => b.hasDeal).map((b) => ({ ...b, dealT: b.deal, until: '' })),
    ]
    const cats = [...new Set(L.map((b) => b.catLabel.split(' · ')[0]))], c = u.dealCat || 'All'
    v.dealChips = chips(cats, 'dealCat')
    v.dealList = L.filter((b) => c === 'All' || b.catLabel.split(' · ')[0] === c).map((b) => ({ ...b, hasUntil: !!b.until, wa: b.hasWa ? b.wa : b.href }))
    v.dealEmpty = !v.dealList.length
  }

  // ---------- Partners, Advertise, More ----------
  if (page === 'partners') { v.partnerList = market.partners.map((p) => ({ ...p, hasLic: !!p.lic })); v.partnerEmpty = !market.partners.length }
  if (page === 'advertise') {
    Object.assign(v, {
      adOpts: market.adOptions, adPkg: local.adPkg, hasPkg: !!local.adPkg,
      adSubmit: async (e) => { const o = formData(e), f = e.target; if (await send('ad', o, 'Thanks! Our partnerships team will reply within two business days.')) { track('ad', '', [].concat(o.interest || []).join('|')); f.reset(); setLocal((y) => ({ ...y, adPkg: '' })) } },
    })
  }
  if (page === 'more') v.hub = HUB

  // ---------- Home page sections ----------
  if (page === 'home') {
    v.hVerts = verts.map((vt) => ({ t: vt.t, ta: vt.ta, d: vt.d, tone: vt.tone, href: vt.id === 'weddings' ? '/plan' : '/v/' + vt.id, count: all.filter((b) => vt.groups.some((g) => inG(b, g))).length }))
  }
  return v
}
