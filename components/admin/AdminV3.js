'use client'
// TamilTO Admin v3: the logic behind the "TamilTO Admin v3" design (View.js holds the markup).
// Everything is saved straight to Supabase with the signed-in person's own login, so the
// database's security rules decide what each role (owner, editor, sales) may do.
import { useCallback, useEffect, useRef, useState } from 'react'
import View from './View'
import { sb, run, friendly, slugify, digits, fmtPhone, uploadPhoto, removeFiles, refreshSite, mediaUrl, torontoToISO, isoToToronto, ago, when, CONFIGURED } from './lib'
import { describe } from './describe'
import { downloadXlsx, printDoc, pdfHead, pdfCards, pdfBars, pdfTable, pdfFoot, nf } from './reports'
import { markupToBlocks, blocksToMarkup } from '@/lib/body-markup.mjs'
import { HERO, PERKS, HOW, PLANS, EXAMPLES, withDefaults } from '@/lib/site-defaults.mjs'
import { MK, MK_ORDER, toDraft, fromDraft, FROM_SUB, MK_SETTINGS, PAGE_NAMES } from './market-admin'

const PAGE = 25
const KL = { view: 'Profile views', whatsapp: 'WhatsApp taps', call: 'Calls', directions: 'Directions', website: 'Website clicks', social: 'Social media clicks', reviews: 'Google reviews clicks', email: 'Emails', save: 'Saves to shortlists', share: 'Shares', quote: 'Quote requests', listing: 'Listing sign-ups' }
const KC = { view: '#F5B83D', whatsapp: '#62D394', call: '#5EC2D1', directions: '#9C86F0', website: '#6EA8F0', social: '#E2629B', reviews: '#4285F4', email: '#A5C25A', save: '#FF6B7D', share: '#F59A3D', quote: '#D4173A', listing: '#4FC9B5', search: '#CDBFAC' }
const CONTACT = ['whatsapp', 'call', 'directions', 'website', 'social', 'reviews', 'email', 'quote']
const PGL = { home: 'Home', directory: 'Directory & search', search: 'Search', b: 'Business profiles', events: 'Events', eat: 'Eat', culture: 'Culture', people: 'People', guides: 'Guides', journey: 'Life moments', n: 'Neighbourhood pages', c: 'Cousin-approved lists', business: 'For businesses', direct: 'Direct link / WhatsApp share', google: 'Google search', 'search engine': 'Other search engines', admin: 'Admin' }
const PG = (p) => PGL[String(p || 'home')] || (/\./.test(p) ? 'From ' + p : 'Other pages')
const DAY = 864e5
const ACT_START = '2026-01-01T05:00:00Z'
const MINPH = 3
const TONES = [['Kumkum', '#8C2A1C'], ['Turmeric', '#9A5416'], ['Curry leaf', '#2F5D50'], ['Clay', '#6B3A2E'], ['Peacock', '#1F4E5F'], ['Brass', '#7A5A12'], ['Kathakali', '#4A3B6B'], ['Lotus', '#8A3B52']]
const EV_TYPES = ['Festival', 'Culture', 'Concert', 'Food', 'Film', 'Sports', 'Community']
const SECTIONS = [['eat', 'Eat'], ['culture', 'Culture'], ['people', 'People'], ['guides', 'Guides'], ['business', 'Business']]
const SOCIAL = [['instagram', 'Instagram', 'https://instagram.com/'], ['facebook', 'Facebook', 'https://facebook.com/'], ['tiktok', 'TikTok', 'https://tiktok.com/@'], ['youtube', 'YouTube', 'https://youtube.com/@'], ['x', 'X (Twitter)', 'https://x.com/'], ['linkedin', 'LinkedIn', 'https://linkedin.com/company/']]
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const NOUN = { mkt: 'item', mitem: 'marketplace item', mpage: 'page intro', mnotice: 'notices', mnews: 'newsletter box', mawards: 'awards', biz: 'business', event: 'event', article: 'article', coll: 'list', journey: 'life moment', story: 'story', cat: 'category', hood: 'area', sitehero: 'home page headline', siteex: 'search suggestions', plan: 'pricing plan', siteperks: 'benefits', sitehow: 'how-it-works steps' }
const CHEATS = [['Empty line', 'new paragraph'], ['## Heading', 'big heading'], ['### Heading', 'small heading'], ['**words**', 'bold'], ['*words*', 'italic'], ['[words](https://…)', 'link'], ['- item', 'bullet list'], ['1. item', 'numbered list'], ['> Quote -- Name', 'pull quote'], ['#1 Name | Area | Why', 'best-of list item'], ['Instagram/TikTok/YouTube link on its own line', 'shows the post']]
const LEAD_STEPS = ['new', 'replied', 'booked', 'closed']
const SUBKIND = { claim: 'Business claim', tip: 'Story tip', event: 'Event', listing: 'Business listing', ad: 'Advertising', request: 'Customer request', job: 'Job post', classified: 'Classified ad', creator: 'Creator sign-up', booking: 'Creator booking', nomination: 'Award nomination' }
const FLBL = { t: 'Title', d: 'Details', when: 'When', size: 'Size', budget: 'Budget', type: 'Job type', pay: 'Pay', kind: 'Type', price: 'Price', handle: 'Handle', niche: 'Niche', plats: 'Platforms', creator: 'Creator', creatorId: 'Creator id', brief: 'Brief', why: 'Why', package: 'Package', interest: 'Interested in', msg: 'Message', name: 'Name', biz: 'Business', cat: 'Category', area: 'Area', addr: 'Address', city: 'City', postal: 'Postal code', short: 'Description', services: 'Services', hours: 'Hours', contact: 'Contact', role: 'Role', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email', web: 'Website', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', gmap: 'Google Maps', quotes: 'Wants quotes', hiring: 'Hiring', delivery: 'Delivery', deal: 'Deal', jobs: 'Jobs', plan: 'Plan', claimOf: 'Claims listing', languages: 'Languages' }

const ymdTO = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
const bg = (path) => (path ? `url("${mediaUrl(path)}")` : 'none')
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const download = (name, text, type) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}
const wa = (num, text) => { const d = digits(num); return d.length === 10 ? `https://wa.me/1${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : '' }
const socialUrl = (k, v) => {
  v = String(v || '').trim()
  if (!v || /^https?:\/\//i.test(v)) return v
  const base = SOCIAL.find((s) => s[0] === k)?.[2] || 'https://'
  return base + v.replace(/^@/, '')
}
const webUrl = (v) => { v = String(v || '').trim(); return !v || /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^\/+/, '') }
const swap = (L, i, d) => { const j = i + d; if (j < 0 || j >= L.length) return null; const a = [...L]; [a[i], a[j]] = [a[j], a[i]]; return a }

async function all(table, cols, order = ['sort']) {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = sb().from(table).select(cols)
    for (const o of order) q = q.order(o, { ascending: true })
    const d = await run(q.range(from, from + 999))
    out.push(...d)
    if (d.length < 1000) return out
  }
}
const maybe = (p) => p.catch(() => [])

// ---------- loaders ----------
const L = {
  biz: () => all('businesses', '*, business_photos(id, storage_path, sort, alt)', ['name', 'id']).then((rows) => rows.map((b) => ({ ...b, photos: (b.business_photos || []).sort((a, c) => a.sort - c.sort) }))),
  cats: () => all('categories', '*', ['sort', 'key']),
  hoods: () => all('neighbourhoods', '*', ['sort', 'key']),
  events: () => all('events', '*, event_photos(id, storage_path, sort, alt)', ['starts_at', 'id']).then((rows) => rows.map((e) => ({ ...e, photos: (e.event_photos || []).sort((a, c) => a.sort - c.sort) }))),
  articles: () => all('articles', '*', ['publish_at', 'id']).then((r) => r.reverse()),
  colls: () => all('collections', '*, collection_items(business_id, sort)', ['sort', 'id']),
  journeys: () => all('journeys', '*, journey_steps(id, sort, when_label, title, tip, journey_step_businesses(business_id, sort))', ['sort', 'id']),
  stories: () => maybe(all('home_stories', '*', ['sort', 'id'])),
  settings: () => maybe(all('site_settings', 'key, value', ['key'])).then((r) => Object.fromEntries(r.map((x) => [x.key, x.value]))),
  claims: () => all('claims', '*', ['created_at']),
  subs: () => all('submissions', '*', ['created_at']),
  leads: () => all('leads', '*, lead_recipients(business_id, status, notified_at)', ['created_at']),
  team: () => all('admins', '*', ['created_at']),
  mkt: () => maybe(all('market_items', '*', ['kind', 'sort', 'created_at'])),
  replies: () => maybe(all('request_replies', '*', ['created_at'])),
  counts: () => sb().rpc('market_counts').then(({ data }) => data || {}, () => ({})),
  log: () => run(sb().from('audit_log').select('*').not('entity', 'in', '(collection_items,journey_step_businesses)').order('created_at', { ascending: false }).limit(10)),
}

export default function AdminV3() {
  const [s, setS] = useState({ phase: 'loading', email: '', pass: '', loginErr: '', resetMsg: '', newPw: '', tab: 'overview', mk: 'request', q: '', fcat: '', fhood: '', fflag: 'all', page: 0, confirm: null, sec: '', ibox: 'pending', ikind: 'all', pick: '', jpick: {}, newEmail: '', newName: '', newRole: 'editor', theme: 'dark' })
  const [st, setSt] = useState(null) // the loaded content
  const [edit, setEdit] = useState(null)
  const [toast, setToast] = useState('')
  const [logPage, setLogPage] = useState({ rows: [], count: 0 })
  const [act, setAct] = useState({})   // website activity, by period
  const [bact, setBact] = useState({}) // one business's activity, by business + period
  const tRef = useRef()
  const recovering = useRef(false)
  const storyRef = useRef()
  const set = useCallback((p) => setS((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) })), [])
  const flash = useCallback((m) => { setToast(m); clearTimeout(tRef.current); tRef.current = setTimeout(() => setToast(''), m.startsWith('⚠') ? 8000 : 3500) }, [])
  const setDraft = (p) => setEdit((e) => ({ ...e, err: '', draft: { ...e.draft, ...(typeof p === 'function' ? p(e.draft) : p) } }))

  // ---------- auth ----------
  useEffect(() => {
    try { set({ theme: document.documentElement.getAttribute('data-theme') || 'dark' }) } catch {}
    if (!CONFIGURED) return set({ phase: 'out', loginErr: 'The admin is not connected to Supabase yet (checklist steps 21–24).' })
    const c = sb()
    // Arriving from a "reset your password" email: show the new-password form, not the admin.
    if (/type=recovery/.test(window.location.hash)) { recovering.current = true; set({ phase: 'recovery' }) }
    else if (/error_code=/.test(window.location.hash)) {
      const expired = /otp_expired|expired/i.test(window.location.hash)
      history.replaceState(null, '', '/admin')
      set({ phase: 'out', loginErr: expired ? 'That reset link has expired or was already used. Type your email and click “Forgot password?” again. Use the newest email only.' : 'That link didn’t work. Type your email and click “Forgot password?” to get a new one.' })
    }
    const enter = async (session) => {
      if (recovering.current) return
      if (!session) return set({ phase: 'out' })
      try {
        const rows = await run(c.from('admins').select('*').eq('user_id', session.user.id).limit(1))
        if (!rows[0]) return set({ phase: 'notadmin', user: session.user })
        set({ phase: 'in', user: session.user, role: rows[0].role, myName: rows[0].name || '' })
      } catch (e) {
        set({ phase: 'notadmin', user: session.user, loginErr: friendly(e) })
      }
    }
    c.auth.getSession().then(({ data }) => enter(data.session))
    const { data: sub } = c.auth.onAuthStateChange((ev, session) => {
      if (ev === 'PASSWORD_RECOVERY') { recovering.current = true; set({ phase: 'recovery' }) }
      else if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') enter(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [set])

  const loadGroups = useCallback(async (...keys) => {
    const got = await Promise.all(keys.map((k) => L[k]()))
    setSt((x) => ({ ...(x || {}), ...Object.fromEntries(keys.map((k, i) => [k, got[i]])), loadedAt: Date.now() }))
  }, [])
  useEffect(() => {
    if (s.phase !== 'in' || st) return
    loadGroups(...Object.keys(L)).catch((e) => set({ loadErr: friendly(e) }))
  }, [s.phase, st, loadGroups, set])

  // Votes and replies arrive from the website all the time: re-read them when their tab opens.
  useEffect(() => {
    if (s.phase === 'in' && st && (s.tab === 'votes' || s.tab === 'mkt')) loadGroups('replies', 'counts', 'mkt').catch(() => {})
  }, [s.phase, s.tab, !!st, loadGroups]) // eslint-disable-line react-hooks/exhaustive-deps
  const isEditor = s.role === 'owner' || s.role === 'editor'
  const done = async (msg, keys = [], site = true) => {
    if (keys.length) await loadGroups(...keys, 'log')
    if (site) refreshSite()
    flash(msg)
  }

  // ---------- change log tab (server paged) ----------
  useEffect(() => {
    if (s.tab !== 'log' || s.phase !== 'in') return
    run(sb().from('audit_log').select('*', { count: 'exact' }).not('entity', 'in', '(collection_items,journey_step_businesses)').order('created_at', { ascending: false }).range(s.page * PAGE, s.page * PAGE + PAGE - 1))
      .then((r) => setLogPage({ rows: r.data, count: r.count }))
      .catch((e) => flash('⚠ ' + e.message))
  }, [s.tab, s.page, s.phase, flash, st?.loadedAt])

  // ---------- activity (Website activity & Business reports) ----------
  const range = s.range ?? 30
  const period = useCallback((R) => {
    const to = new Date(Date.now() + 60e3)
    const from = R ? new Date(to.getTime() - R * DAY) : new Date(ACT_START)
    return { from: from.toISOString(), to: to.toISOString(), prevFrom: R ? new Date(from.getTime() - R * DAY).toISOString() : null }
  }, [])
  useEffect(() => {
    if (s.phase !== 'in' || !['stats', 'reports'].includes(s.tab) || act[range]?.cur) return
    const P = period(range)
    Promise.all([
      run(sb().rpc('activity_summary', { p_from: P.from, p_to: P.to })),
      P.prevFrom ? run(sb().rpc('activity_summary', { p_from: P.prevFrom, p_to: P.from })) : null,
    ]).then(([cur, prev]) => setAct((a) => ({ ...a, [range]: { cur, prev, P, at: Date.now() } })))
      .catch((e) => setAct((a) => ({ ...a, [range]: { err: /activity_summary/.test(e.message) ? 'Run 04-activity.sql in Supabase first (checklist step 20).' : e.message } })))
  }, [s.phase, s.tab, range, act, period])
  useEffect(() => {
    const id = s.rbiz, k = `${id}|${range}`
    if (s.phase !== 'in' || s.tab !== 'reports' || !id || bact[k]) return
    const P = period(range)
    setBact((a) => ({ ...a, [k]: { loading: true } }))
    Promise.all([
      run(sb().rpc('business_activity', { p_business: id, p_from: P.from, p_to: P.to })),
      P.prevFrom ? run(sb().rpc('business_activity', { p_business: id, p_from: P.prevFrom, p_to: P.from })) : null,
    ]).then(([cur, prev]) => setBact((a) => ({ ...a, [k]: { cur, prev } })))
      .catch((e) => setBact((a) => ({ ...a, [k]: { err: e.message } })))
  }, [s.phase, s.tab, s.rbiz, range, bact, period])

  // ---------- view model ----------
  const v = {
    siteHref: '/',
    toggleTheme: () => { const t = s.theme === 'light' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('tto-theme', t) } catch {} set({ theme: t }) },
    themeIcon: s.theme === 'light' ? '☾' : '☀', themeLabel: s.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode',
    authed: ['in', 'notadmin'].includes(s.phase),
    showLogin: s.phase === 'out', showNewPw: s.phase === 'recovery', showNotAdmin: s.phase === 'notadmin',
    notAdminText: `${s.user?.email || 'This login'} signed in, but it isn't on the TamilTO team list. Ask the owner to add you under Team & login.${s.loginErr ? ' (' + s.loginErr + ')' : ''}`,
    showLoading: s.phase === 'loading' || (s.phase === 'in' && !st && !s.loadErr), showLoadErr: s.phase === 'in' && !!s.loadErr, loadErr: s.loadErr,
    showApp: s.phase === 'in' && !!st,
    email: s.email, pass: s.pass, onEmail: (e) => set({ email: e.target.value, loginErr: '' }), onPass: (e) => set({ pass: e.target.value, loginErr: '' }),
    hasLoginErr: !!s.loginErr, loginErr: s.loginErr, hasResetMsg: !!s.resetMsg, resetMsg: s.resetMsg,
    login: async (e) => {
      e.preventDefault()
      if (!CONFIGURED) return
      const { error } = await sb().auth.signInWithPassword({ email: s.email.trim(), password: s.pass })
      if (error) set({ loginErr: /invalid/i.test(error.message) ? 'That email and password don’t match.' : friendly(error) })
      else set({ pass: '' })
    },
    forgot: async () => {
      if (!s.email.trim()) return set({ loginErr: 'Type your email first, then click “Forgot password?”.' })
      const { error } = await sb().auth.resetPasswordForEmail(s.email.trim(), { redirectTo: `${window.location.origin}/admin` })
      set(error ? { loginErr: friendly(error) } : { loginErr: '', resetMsg: 'If that email has a TamilTO login, a reset link is on its way. Check your inbox and spam.' })
    },
    newPw: s.newPw, onNewPw: (e) => set({ newPw: e.target.value, loginErr: '' }),
    saveNewPw: async (e) => {
      e.preventDefault()
      if (s.newPw.length < 10) return set({ loginErr: 'Use at least 10 characters.' })
      const { error } = await sb().auth.updateUser({ password: s.newPw })
      if (error) return set({ loginErr: friendly(error) })
      recovering.current = false
      set({ newPw: '', phase: 'loading' })
      window.location.replace('/admin')
    },
    logout: async () => { await sb().auth.signOut(); setSt(null); setEdit(null); set({ phase: 'out', role: null, user: null, tab: 'overview' }) },
    hasToast: !!toast, toast,
    cancelDel: () => set({ confirm: null }),
    readOnly: s.phase === 'in' && !isEditor,
    jSteps: [], sSlides: [], tabs: [], cards: [], quick: [], logItems: [], rows: [], catOpts: [], hoodOpts: [], secChips: [], formFields: [], pickSel: [], pickRes: [], photos: [], team: [], ibList: [], ibKinds: [], ibStatus: [], navGroups: [], editing: false,
  }
  if (!st || s.phase !== 'in') return <View {...v} />

  // ----- lookups -----
  const cats = st.cats, hoods = st.hoods, biz = st.biz
  const catOf = (k) => cats.find((c) => c.key === k) || { label: k, colour: '#888' }
  const hoodOf = (k) => hoods.find((h) => h.key === k) || { name: k || 'GTA-wide', colour: '#888' }
  const byId = Object.fromEntries(biz.map((b) => [b.id, b]))
  const bySlug = Object.fromEntries(biz.map((b) => [b.slug, b]))
  const mkOf = (k) => (st.mkt || []).filter((x) => x.kind === k)
  const settings = withDefaults(st.settings || {})
  const RS = st.settings || {}
  const nowIso = new Date().toISOString()
  const go = (tab, extra = {}) => () => { set({ tab, confirm: null, page: 0, ...extra }); window.scrollTo(0, 0) }
  const opts = (k) => ({
    cats: cats.map((c) => ({ v: c.key, l: c.label })),
    hoods: hoods.map((h) => ({ v: h.key, l: h.name })),
    hoods0: [{ v: '', l: 'GTA-wide / not set' }, ...hoods.map((h) => ({ v: h.key, l: h.name }))],
    hoodNames: [{ v: '', l: 'Not tied to one area' }, ...hoods.map((h) => ({ v: h.name, l: h.name }))],
    evtype: EV_TYPES.map((t) => ({ v: t, l: t })),
    sec: SECTIONS.map(([k, l]) => ({ v: k, l })),
    tones: TONES.map(([l, c]) => ({ v: c, l })),
    plan: [{ v: 'free', l: 'Free' }, { v: 'featured', l: 'Featured' }, { v: 'partner', l: 'Partner' }],
    reqcats: (mkOf('requestCat').map((x) => x.data.l).filter(Boolean)).map((l) => ({ v: l, l })),
    jobtypes: MK_SETTINGS.JOB_TYPES.map((l) => ({ v: l, l })),
    clkinds: MK_SETTINGS.CLASSIFIED_KINDS.map((l) => ({ v: l, l })),
    biz: biz.filter((b) => !b.is_hidden).map((b) => ({ v: b.slug, l: b.name })),
    biz0: [{ v: '', l: 'Not linked' }, ...biz.filter((b) => !b.is_hidden).map((b) => ({ v: b.slug, l: b.name }))],
    journeys: [{ v: '', l: 'None' }, ...st.journeys.map((j) => ({ v: j.slug, l: j.title }))],
  })[k] || []

  const pendingSubs = st.claims.filter((c) => c.status === 'pending').length + st.subs.filter((y) => y.status === 'pending').length
  const newLeads = st.leads.filter((l) => (l.lead_recipients || []).some((r) => r.status === 'new')).length
  const liveBiz = biz.filter((b) => !b.is_hidden)
  const upcoming = st.events.filter((e) => !e.is_hidden && (e.ends_at || e.starts_at) >= nowIso)
  const lastAt = st.log[0]?.created_at
  v.liveText = lastAt ? 'Site last updated ' + ago(lastAt) : 'No changes saved yet'
  v.liveDot = lastAt ? 'var(--green)' : 'var(--ink2)'

  // ----- navigation -----
  const counts = { mkt: (st.mkt || []).length, biz: biz.length, cat: cats.length, hood: hoods.length, event: st.events.length, article: st.articles.length, story: st.stories.length, coll: st.colls.length, journey: st.journeys.length, quotes: newLeads, inbox: pendingSubs }
  const G = [
    ['Insights', [['overview', 'Overview', 'Today at a glance', '#F5B83D'], ['stats', 'Website activity', 'Visits, searches, clicks', '#5EC2D1'], ['reports', 'Business reports', 'PDF & Excel for clients', '#62D394']]],
    ['Directory', [['biz', 'Businesses', 'Add, edit, photos, links', '#FF6B7D'], ['cat', 'Categories', 'Filters, tiles, pins', '#C77BD8'], ['hood', 'Neighbourhoods', 'Area pages & taglines', '#9C86F0']]],
    ['Content', [['event', 'Events', 'Dates, venues, tickets', '#F59A3D'], ['article', 'Articles', 'Eat, Culture, People, Guides', '#E2629B'], ['story', 'Stories', 'Home page story circles', '#FF6B7D'], ['coll', 'Lists', 'Cousin-approved lists', '#F5C443'], ['journey', 'Life moments', 'Wedding, baby, new home', '#8A9BF0']]],
    ['Inbox', [['quotes', 'Quote requests', 'Customers asking vendors for prices', '#FF6B7D'], ['inbox', 'Client submissions', 'Claims, tips, events, listings', '#62D394']]],
    ['Marketplace', [['mkt', 'Marketplace', 'Requests, jobs, deals, hubs', '#E2629B'], ['votes', 'Awards & replies', 'Votes and request replies', '#F5B83D']]],
    ['Website', [['site', 'Site content', 'Headline, plans, page words', '#4FC9B5']]],
    ['System', [['log', 'Change log', 'Every edit, who and when', '#F5B83D'], ['team', 'Team & login', 'Who can sign in, password', '#C6A3F0'], ['data', 'Data & backup', 'Download everything', '#CDBFAC']]],
  ]
  v.navGroups = G.map(([title, items]) => ({
    title,
    items: items.map(([k, label, hint, dot]) => {
      const on = s.tab === k
      return { label, hint, dot, count: counts[k], hasCount: counts[k] != null && (k !== 'quotes' && k !== 'inbox' ? true : counts[k] > 0), onClick: go(k), cur: on ? 'page' : 'false', bg: on ? 'var(--ink)' : 'transparent', fg: on ? 'var(--bg)' : 'var(--ink)', pillBg: on ? 'rgba(128,128,128,.28)' : 'var(--line)' }
    }),
  }))

  const t = s.tab
  v.isOverview = t === 'overview'
  v.isData = t === 'data'
  v.isTeam = t === 'team'
  v.isStats = t === 'stats'
  v.isReports = t === 'reports'
  v.isInbox = t === 'inbox' || t === 'quotes'
  v.isList = !v.isOverview && !v.isData && !v.isStats && !v.isReports && !v.isInbox && !v.isTeam
  v.isBizTab = t === 'biz'
  v.isStoryTab = t === 'story'
  v.isArtTab = t === 'article' || t === 'mkt'
  v.isArtOnly = t === 'article'

  // ----- overview -----
  const hiddenReady = biz.filter((b) => b.is_hidden && b.photos.length >= MINPH).length
  v.cards = [
    { l: 'Live businesses', v: liveBiz.length, d: `${biz.length - liveBiz.length} hidden`, go: go('biz', { fflag: 'all' }) },
    { l: 'Ready to go live', v: hiddenReady, d: `hidden, with ${MINPH}+ photos`, go: go('biz', { fflag: 'ready' }) },
    { l: 'Featured', v: biz.filter((b) => b.is_featured).length, d: 'paid placements', go: go('biz', { fflag: 'feat' }) },
    { l: 'Verified', v: biz.filter((b) => b.is_verified).length, d: 'Tamil-owned badge', go: go('biz', { fflag: 'ver' }) },
    { l: 'Upcoming events', v: upcoming.length, d: `${st.events.length - upcoming.length} past or hidden`, go: go('event') },
    { l: 'Articles', v: st.articles.filter((a) => !a.is_hidden && a.publish_at <= nowIso).length, d: `${st.articles.filter((a) => a.is_hidden).length} drafts`, go: go('article') },
    { l: 'Lists', v: st.colls.length, d: 'cousin-approved', go: go('coll') },
    { l: 'Life moments', v: st.journeys.filter((j) => !j.is_hidden).length, d: 'vendor journeys', go: go('journey') },
    { l: 'New quote requests', v: newLeads, d: 'forward to vendors', go: go('quotes') },
    { l: 'Submissions waiting', v: pendingSubs, d: 'claims, tips, events', go: go('inbox') },
  ]
  const who = Object.fromEntries(st.team.map((m) => [m.user_id, m.name || m.email || m.role]))
  v.quick = isEditor
    ? [['+ New business', 'biz'], ['+ New event', 'event'], ['+ New article', 'article'], ['+ New list', 'coll'], ['+ New life moment', 'journey']].map(([l, k]) => ({ l, go: () => { set({ tab: k }); openEdit(k) } }))
    : []
  v.logItems = st.log.map((r) => ({ m: describe(r, who, s.user.id), t: ago(r.created_at) }))
  v.noLog = !v.logItems.length

  // ----- list rows -----
  const mk = (key, o) => ({
    hasThumb: o.thumb !== undefined, thumbBg: bg(o.thumb), title: o.title, sub: o.sub, c: o.c,
    badges: (o.badges || []).filter(Boolean), hasBadges: (o.badges || []).some(Boolean),
    canEdit: !!o.edit, edit: o.edit, editLabel: o.editLabel || (isEditor ? 'Edit' : 'Open'),
    hasView: !!o.view, view: o.view || '',
    canDel: isEditor && !!o.del, confirming: s.confirm === key, notConfirming: s.confirm !== key, askDel: () => set({ confirm: key }), del: () => { set({ confirm: null }); o.del() },
    canMove: isEditor && !!o.up, up: o.up, down: o.down, upDis: !!o.first, downDis: !!o.last, dim: o.hidden ? 0.55 : 1,
  })
  v.catOpts = opts('cats')
  v.hoodOpts = opts('hoods')
  Object.assign(v, { q: s.q, fcat: s.fcat, fhood: s.fhood, fflag: s.fflag })
  v.onQ = (e) => set({ q: e.target.value, page: 0 })
  v.onFcat = (e) => set({ fcat: e.target.value, page: 0 })
  v.onFhood = (e) => set({ fhood: e.target.value, page: 0 })
  v.onFflag = (e) => set({ fflag: e.target.value, page: 0 })
  v.hasPages = false
  v.canCreate = isEditor && !['hood', 'site', 'log', 'votes'].includes(t)
  v.createLabel = 'New ' + (t === 'mkt' ? MK[s.mk].one : NOUN[t] || '')
  v.create = () => (t === 'mkt' ? openEdit('mitem', null, null, toDraft(s.mk)) : openEdit(t))
  const pager = (n, page) => {
    const pages = Math.max(1, Math.ceil(n / PAGE)), p = Math.min(page, pages - 1)
    Object.assign(v, { hasPages: pages > 1, pageText: `Page ${p + 1} of ${pages}`, prevDis: p === 0, nextDis: p >= pages - 1, prevPage: () => set({ page: p - 1 }), nextPage: () => set({ page: p + 1 }) })
    return p
  }
  const reorder = (table, list, i, dir, idKey = 'id') => async () => {
    const M = swap(list, i, dir)
    if (!M) return
    try {
      await Promise.all(M.map((x, k) => run(sb().from(table).update({ sort: k }).eq(idKey, x[idKey]))))
      const grp = { categories: 'cats', collections: 'colls', journeys: 'journeys', home_stories: 'stories', market_items: 'mkt' }[table]
      await done('Order saved', [grp])
    } catch (e) { flash('⚠ ' + e.message) }
  }
  const remove = (label, fn, keys) => async () => {
    try { await fn(); await done(label + ' deleted', keys) } catch (e) { flash('⚠ ' + e.message) }
  }

  if (t === 'biz') {
    v.fflag = s.fflag
    const q = s.q.trim().toLowerCase(), qd = digits(q)
    const Lb = biz.filter((b) =>
      (!q || [b.name, b.listed_as, b.city, b.address, b.contact_name, b.email, b.slug].join(' ').toLowerCase().includes(q) || (qd.length >= 3 && (b.phone.includes(qd) || b.cell.includes(qd)))) &&
      (!s.fcat || b.category_key === s.fcat) && (!s.fhood || b.neighbourhood_key === s.fhood) &&
      (s.fflag === 'all' || (s.fflag === 'feat' && b.is_featured) || (s.fflag === 'ver' && b.is_verified) || (s.fflag === 'hidden' && b.is_hidden) || (s.fflag === 'live' && !b.is_hidden) ||
        (s.fflag === 'ready' && b.is_hidden && b.photos.length >= MINPH) || (s.fflag === 'nophone' && !b.phone && !b.cell) || (s.fflag === 'nophotos' && b.photos.length < MINPH) ||
        (s.fflag === 'nosocial' && !Object.keys(b.social || {}).length)))
    const p = pager(Lb.length, s.page)
    v.listTitle = 'Businesses'
    v.countText = `${Lb.length} of ${biz.length}`
    v.rows = Lb.slice(p * PAGE, (p + 1) * PAGE).map((b) => mk('b:' + b.id, {
      title: b.name, sub: [catOf(b.category_key).label, b.city || hoodOf(b.neighbourhood_key).name, b.address, fmtPhone(b.phone || b.cell)].filter(Boolean).join(' · '), c: catOf(b.category_key).colour,
      thumb: b.photos[0]?.storage_path || null,
      badges: [b.is_featured && { l: 'Featured', c: '#F5B83D' }, b.is_verified && { l: 'Verified', c: 'var(--teal)' }, b.deal && { l: 'Deal', c: 'var(--red)' }, b.jobs?.length && { l: 'Hiring', c: 'var(--green)' },
        b.photos.length < MINPH && { l: `Photos ${b.photos.length}/${MINPH}`, c: '#F5B83D' }, Object.keys(b.social || {}).length && { l: 'Social', c: '#E1306C' }, b.google_maps_url && { l: 'Google', c: '#4285F4' }, b.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }],
      edit: () => openEdit('biz', b), view: b.is_hidden ? '' : '/b/' + b.slug, hidden: b.is_hidden,
      del: remove(b.name, async () => { await run(sb().from('businesses').delete().eq('id', b.id)); await removeFiles(b.photos.map((x) => x.storage_path)) }, ['biz', 'colls', 'journeys']),
    }))
  }
  if (t === 'cat') {
    v.listTitle = 'Categories'
    v.countText = cats.length + ' categories · used for filters, tiles and map pins'
    v.rows = cats.map((c, i) => {
      const used = biz.filter((b) => b.category_key === c.key).length
      return mk('k:' + c.key, {
        title: c.label, sub: used + ' business' + (used === 1 ? '' : 'es'), c: c.colour, edit: () => openEdit('cat', c), view: '/directory?cat=' + c.key,
        del: used ? () => flash(`⚠ ${used} businesses use “${c.label}”. Move them to another category first.`) : remove(c.label, () => run(sb().from('categories').delete().eq('key', c.key)), ['cats']),
        up: reorder('categories', cats, i, -1, 'key'), down: reorder('categories', cats, i, 1, 'key'), first: i === 0, last: i === cats.length - 1,
      })
    })
  }
  if (t === 'hood') {
    v.listTitle = 'Neighbourhoods'
    v.countText = 'Edit the words on each area page'
    v.rows = hoods.map((h) => mk('h:' + h.key, { title: h.name, sub: [h.tagline, h.description].filter(Boolean).join(' — '), c: h.colour, edit: () => openEdit('hood', h), view: '/n/' + h.key }))
  }
  if (t === 'event') {
    const Le = [...st.events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    v.listTitle = 'Events'
    v.countText = `${upcoming.length} upcoming`
    v.rows = Le.map((e) => {
      const past = (e.ends_at || e.starts_at) < nowIso
      return mk('e:' + e.id, {
        title: e.title, sub: [when(e.starts_at), e.venue, hoodOf(e.neighbourhood_key).name, +e.price ? '$' + (+e.price) : 'Free'].filter(Boolean).join(' · '), c: e.tone || hoodOf(e.neighbourhood_key).colour,
        thumb: e.photos[0]?.storage_path || null,
        badges: [{ l: e.type, c: 'var(--line2)' }, past && { l: 'Past · not shown', c: 'var(--ink2)' }, e.sold_out && { l: 'Sold out', c: 'var(--red)' }, e.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }],
        edit: () => openEdit('event', e), view: e.is_hidden || past ? '' : '/events/' + e.slug, hidden: e.is_hidden || past,
        del: remove(e.title, async () => { await run(sb().from('events').delete().eq('id', e.id)); await removeFiles(e.photos.map((x) => x.storage_path)) }, ['events']),
      })
    })
  }
  if (t === 'article') {
    v.secChips = [['', 'All'], ...SECTIONS].map(([k, label]) => ({ label, sel: s.sec === k ? 'true' : 'false', onClick: () => set({ sec: k }), bg: s.sec === k ? 'var(--ink)' : 'var(--glass2)', fg: s.sec === k ? 'var(--bg)' : 'var(--ink)' }))
    const La = st.articles.filter((a) => !s.sec || a.section === s.sec)
    v.listTitle = 'Articles'
    v.countText = `${La.length} stories · newest first`
    v.rows = La.map((a) => {
      const later = a.publish_at > nowIso
      return mk('a:' + a.id, {
        title: a.title, sub: [SECTIONS.find((x) => x[0] === a.section)?.[1], a.tags?.[0], when(a.publish_at), 'by ' + a.author].filter(Boolean).join(' · '), c: '#E2629B', thumb: a.hero_image || null,
        badges: [a.is_hidden && { l: 'Draft', c: 'var(--ink2)' }, !a.is_hidden && later && { l: 'Scheduled', c: 'var(--teal)' }, a.sponsored && { l: 'Sponsored', c: '#F5B83D' }, a.is_featured && { l: 'Featured', c: '#F5B83D' }],
        edit: () => openEdit('article', a), view: a.is_hidden || later ? '' : `/${a.section}/${a.slug}`, hidden: a.is_hidden,
        del: remove(a.title, () => run(sb().from('articles').delete().eq('id', a.id)), ['articles']),
      })
    })
  }
  if (t === 'story') {
    v.autoOn = settings.autoStories
    v.onAuto = async (e) => {
      const on = e.target.checked
      try { await run(sb().from('site_settings').upsert({ key: 'autoStories', value: on })); await done(on ? 'Automatic stories on' : 'Automatic stories off', ['settings']) } catch (err) { flash('⚠ ' + err.message) }
    }
    const S = st.stories
    v.listTitle = 'Stories'
    v.countText = S.length ? S.length + ' custom stories · shown first in the story circles on the home page' : 'No custom stories yet. The site shows automatic stories from your lists and events.'
    v.rows = S.map((g, i) => mk('s:' + g.id, {
      title: g.label, sub: (g.slides || []).length + ' slides · ' + (g.slides || []).map((x) => x.title).filter(Boolean).slice(0, 2).join(', '), c: g.tone, thumb: g.slides?.[0]?.photo || null,
      badges: [g.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }], edit: () => openEdit('story', g), view: g.is_hidden ? '' : '/', hidden: g.is_hidden,
      del: remove(g.label, () => run(sb().from('home_stories').delete().eq('id', g.id)), ['stories']),
      up: reorder('home_stories', S, i, -1), down: reorder('home_stories', S, i, 1), first: i === 0, last: i === S.length - 1,
    }))
  }
  if (t === 'coll') {
    const C = st.colls
    v.listTitle = 'Lists'
    v.countText = `${C.length} lists · only live businesses show on the site`
    v.rows = C.map((c, i) => {
      const ids = (c.collection_items || []).map((x) => x.business_id), live = ids.filter((id) => byId[id] && !byId[id].is_hidden).length
      return mk('c:' + c.id, {
        title: c.title, sub: `${ids.length} businesses (${live} live) · by ${c.curated_by}`, c: '#F5C443',
        badges: [c.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }, !live && { l: 'Not on the site until a business is live', c: 'var(--ink2)' }],
        edit: () => openEdit('coll', c), view: c.is_hidden || !live ? '' : '/c/' + c.slug, hidden: c.is_hidden,
        del: remove(c.title, () => run(sb().from('collections').delete().eq('id', c.id)), ['colls']),
        up: reorder('collections', C, i, -1), down: reorder('collections', C, i, 1), first: i === 0, last: i === C.length - 1,
      })
    })
  }
  if (t === 'journey') {
    const J = st.journeys
    v.listTitle = 'Life moments'
    v.countText = `${J.length} journeys · shown on the home page and /journey`
    v.rows = J.map((j, i) => {
      const steps = j.journey_steps || [], n = new Set(steps.flatMap((x) => (x.journey_step_businesses || []).map((y) => y.business_id))).size
      return mk('j:' + j.id, {
        title: j.title, sub: `${j.tamil_name ? j.tamil_name + ' · ' : ''}${steps.length} steps · ${n} businesses`, c: j.tone,
        badges: [j.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }], edit: () => openEdit('journey', j), view: j.is_hidden ? '' : '/journey/' + j.slug, hidden: j.is_hidden,
        del: remove(j.title, () => run(sb().from('journeys').delete().eq('id', j.id)), ['journeys']),
        up: reorder('journeys', J, i, -1), down: reorder('journeys', J, i, 1), first: i === 0, last: i === J.length - 1,
      })
    })
  }
  if (t === 'site') {
    const S = settings, pl = (k) => S.plans.find((p) => p.key === k) || { key: k, name: k, monthly: 0, yearly: 0, description: '', features: [] }
    v.listTitle = 'Site content'
    v.countText = 'Words and prices that appear across the website'
    v.rows = [
      mk('x:hero', { title: 'Home page headline', sub: `${S.hero.a} ${S.hero.b} — ${S.hero.sub}`, c: '#FF6B7D', edit: () => openEdit('sitehero', S.hero, 'hero'), view: '/' }),
      mk('x:ex', { title: 'Search suggestions', sub: S.searchExamples.join(' · '), c: '#5EC2D1', edit: () => openEdit('siteex', { list: S.searchExamples.join('\n') }, 'ex'), view: '/' }),
      ...['free', 'featured', 'partner'].map((k) => mk('x:p' + k, {
        title: 'Pricing plan: ' + pl(k).name, sub: (+pl(k).monthly ? `$${pl(k).monthly}/mo · $${pl(k).yearly}/yr` : 'Free') + ' · ' + (pl(k).features || []).length + ' benefits', c: '#F5B83D',
        edit: () => openEdit('plan', { ...pl(k), features: (pl(k).features || []).join('\n') }, k), view: '/business',
      })),
      mk('x:perks', { title: 'Benefits shown to businesses', sub: S.perks.map((p) => p.t).join(' · '), c: '#5FC98A', edit: () => openEdit('siteperks', { list: S.perks.map((p) => p.t + ' | ' + p.d).join('\n') }, 'perks'), view: '/business' }),
      mk('x:how', { title: '“How it works” steps', sub: S.how.map((p) => p.t).join(' → '), c: '#9C86F0', edit: () => openEdit('sitehow', { list: S.how.map((p) => p.t + ' | ' + p.d).join('\n') }, 'how'), view: '/business' }),
      ...Object.keys(PAGE_NAMES).map((k) => { const pg = { ...MK_SETTINGS.PAGES[k], ...((RS.pages || {})[k] || {}) }; return mk('x:pg' + k, { title: 'Page intro: ' + PAGE_NAMES[k], sub: `${pg.title} — ${pg.lead}`, c: '#E2629B', edit: () => openEdit('mpage', pg, k), view: '/' + k }) }),
      mk('x:notices', { title: 'Marketplace notices', sub: 'Ad labels, referral fees, request privacy', c: '#CDBFAC', edit: () => openEdit('mnotice', { ...MK_SETTINGS.NOTICES, ...(RS.notices || {}) }, 'notices'), view: '/creators' }),
      mk('x:news', { title: 'Newsletter box', sub: (() => { const n = { ...MK_SETTINGS.NEWSLETTER, ...(RS.newsletter || {}) }; return n.t + (n.sponsor ? ' · presented by ' + n.sponsor : '') })(), c: '#5EC2D1', edit: () => openEdit('mnews', { ...MK_SETTINGS.NEWSLETTER, ...(RS.newsletter || {}) }, 'newsletter'), view: '/more' }),
      mk('x:awards', { title: 'Best of awards', sub: (() => { const A = RS.awards && Array.isArray(RS.awards.cats) ? RS.awards : MK_SETTINGS.AWARDS; return `${A.year} · ${A.stage} · ${A.cats.length} categories` })(), c: '#F5B83D', edit: () => {
        const A = RS.awards && Array.isArray(RS.awards.cats) ? RS.awards : MK_SETTINGS.AWARDS
        openEdit('mawards', { year: A.year, stage: A.stage, voting: A.voting !== false, dates: String(A.dates || '').split('|').join('\n'), cats: A.cats.map((c) => [c.id, c.t, c.kw || '', c.neg || '', c.sponsor || ''].join(' | ')).join('\n') }, 'awards')
      }, view: '/awards' }),
    ]
  }
  if (t === 'mkt') {
    const K = MK[s.mk] || MK.request, items = mkOf(s.mk)
    const hn = (k) => (k ? hoodOf(k).name : ''), bn = (slug) => bySlug[slug]?.name || (slug ? slug + ' (not listed)' : '')
    const replies = st.replies || []
    const subOf = (x) => {
      const y = x.submission_id && st.subs.find((z) => z.id === x.submission_id)
      if (!y) return null
      const f = Object.fromEntries((y.payload?.fields || []).map((z) => [z.key, z.value]))
      return { name: y.name || f.name, email: y.email || f.email, phone: f.phone && fmtPhone(digits(f.phone)) }
    }
    v.secChips = MK_ORDER.map((k) => ({ label: MK[k].label + ' (' + mkOf(k).length + ')', sel: s.mk === k ? 'true' : 'false', onClick: () => set({ mk: k, confirm: null }), bg: s.mk === k ? 'var(--ink)' : 'var(--glass2)', fg: s.mk === k ? 'var(--bg)' : 'var(--ink)' }))
    v.listTitle = K.label
    v.countText = `${items.length} ${items.length === 1 ? K.one : K.label.toLowerCase()}${K.hint ? ' · ' + K.hint : ''}`
    v.rows = items.map((x, i) => {
      const d = x.data || {}, gone = K.expires && x.expires_on && x.expires_on < ymdTO(), nR = replies.filter((r) => r.item_id === x.id).length
      const view = typeof K.view === 'function' ? K.view(d) : K.view
      return mk('m:' + x.id, {
        title: K.title(d, hn, bn) || '(no title)', sub: [K.sub(d, hn, bn), x.expires_on && 'until ' + x.expires_on].filter(Boolean).join(' · '), c: d.tone || K.dot,
        badges: [x.is_hidden && { l: 'Hidden', c: 'var(--ink2)' }, gone && { l: 'Expired · not shown', c: 'var(--ink2)' }, d.boost && { l: 'Boosted', c: '#F5B83D' }, s.mk === 'request' && { l: nR + (nR === 1 ? ' reply' : ' replies'), c: nR ? 'var(--green)' : 'var(--line2)' }, x.submission_id && { l: 'From a reader', c: 'var(--teal)' }],
        edit: () => openEdit('mitem', x, x.id, { ...toDraft(s.mk, x), _sub: subOf(x) }), view: x.is_hidden || gone || !view ? '' : view, hidden: x.is_hidden || gone,
        del: remove(K.title(d, hn, bn) || K.one, () => run(sb().from('market_items').delete().eq('id', x.id)), ['mkt']),
        up: reorder('market_items', items, i, -1), down: reorder('market_items', items, i, 1), first: i === 0, last: i === items.length - 1,
      })
    })
  }
  if (t === 'votes') {
    const C = st.counts || {}, votes = C.votes || {}, aw = RS.awards || MK_SETTINGS.AWARDS
    const cats = (aw.cats || []).length ? aw.cats : MK_SETTINGS.AWARDS.cats
    v.listTitle = 'Awards & replies'
    v.countText = 'Live vote counts for each award, then every business reply to a customer request (newest first). Customers’ details are never shown to businesses.'
    v.rows = [
      ...cats.map((c) => {
        const L = Object.entries(votes[c.id] || {}).sort((a, b) => b[1] - a[1]), tot = L.reduce((n, [, k]) => n + k, 0)
        return mk('v:' + c.id, { title: c.t, sub: tot ? `${tot} votes · ` + L.slice(0, 4).map(([slug, k]) => `${bySlug[slug]?.name || slug} ${k}`).join(' · ') : 'No votes yet', c: '#F5B83D', view: '/awards' })
      }),
      ...[...(st.replies || [])].reverse().map((r) => {
        const it = (st.mkt || []).find((x) => x.id === r.item_id)
        return mk('r:' + r.id, {
          title: `${r.business_name} → ${it?.data?.t || 'a request'}`, sub: [fmtPhone(digits(r.phone)) || r.phone, r.message, when(r.created_at)].filter(Boolean).join(' · '), c: '#FF6B7D',
          badges: [r.notified_at ? { l: 'Customer emailed', c: 'var(--green)' } : { l: 'Not emailed: pass it on', c: 'var(--red)' }],
          view: wa(r.phone) || '',
        })
      }),
    ]
  }
  if (t === 'log') {
    const p = pager(logPage.count, s.page)
    v.listTitle = 'Change log'
    v.countText = `${logPage.count} changes · newest first · can't be edited`
    v.rows = logPage.rows.map((r) => mk('l:' + r.id, { title: describe(r, who, s.user.id), sub: `${when(r.created_at)} · ${ago(r.created_at)}`, c: { insert: 'var(--green)', update: '#F5B83D', delete: 'var(--red)' }[r.action] || '#888' }))
    void p
  }
  v.noRows = v.isList && !v.rows.length

  // ----- inbox -----
  if (v.isInbox) inbox(v)
  function inbox(v) {
    const Q = t === 'quotes'
    const status = s.ibox
    if (Q) {
      v.ibTitle = 'Quote requests'
      v.ibIntro = 'People asking businesses for prices. Each business gets the request by email (step 20). Forward it on WhatsApp too, then track what happened. Phone numbers and emails here are private: never share them outside the team.'
      v.ibStatus = [['pending', 'New'], ['all', 'All']].map(([k, l]) => ({ l, sel: status === k ? 'true' : 'false', onClick: () => set({ ibox: k }), bg: status === k ? 'var(--ink)' : 'transparent', fg: status === k ? 'var(--bg)' : 'var(--ink)' }))
      const items = [...st.leads].reverse().filter((l) => status === 'all' || (l.lead_recipients || []).some((r) => r.status === 'new'))
      v.ibCount = `${items.length} shown`
      v.ibShowKinds = false
      v.ibList = items.map((l) => {
        const rec = l.lead_recipients || []
        const stNow = rec.length ? rec.map((r) => r.status).sort((a, b) => LEAD_STEPS.indexOf(a) - LEAD_STEPS.indexOf(b))[0] : 'new'
        const nextS = LEAD_STEPS[(LEAD_STEPS.indexOf(stNow) + 1) % LEAD_STEPS.length]
        const text = `TamilTO quote request (${l.kind})\nName: ${l.name}\nPhone: ${l.phone}${l.event_date ? '\nDate: ' + l.event_date : ''}${l.guests ? '\nGuests: ' + l.guests : ''}${l.message ? '\n' + l.message : ''}`
        const key = 'lead:' + l.id
        return {
          kind: 'Quote request · ' + l.kind, title: l.name, when: ago(l.created_at), status: stNow[0].toUpperCase() + stNow.slice(1),
          sBg: stNow === 'new' ? 'var(--act)' : 'var(--line)', sFg: stNow === 'new' ? '#fff' : 'var(--ink)',
          lines: [['Phone', l.phone], ['Email', l.email], ['Event date', l.event_date], ['Guests', l.guests], ['Message', l.message], ['Sent from', l.source_page], ['Businesses', rec.map((r) => byId[r.business_id]?.name || 'Deleted business').join(', ')]].filter(([, x]) => x).map(([k, x]) => ({ k, v: String(x) })),
          hasVendors: rec.length > 0,
          vendorLinks: rec.map((r) => { const b = byId[r.business_id] || {}; const link = wa(b.cell || b.phone, text); return { n: b.name || 'Business', wa: link, has: !!link, no: !link } }),
          canApprove: false, canReject: false,
          canCycle: isEditor && rec.length > 0, cycleLabel: 'Mark ' + nextS,
          cycle: async () => { try { await run(sb().from('lead_recipients').update({ status: nextS }).eq('lead_id', l.id)); await done('Marked ' + nextS, ['leads'], false) } catch (e) { flash('⚠ ' + e.message) } },
          hasWa: !!wa(l.phone), wa: wa(l.phone, `Hi ${l.name}, this is TamilTO about your ${l.kind.toLowerCase()} request.`), hasMail: !!l.email, mail: 'mailto:' + l.email,
          del: s.confirm === key ? remove('Quote request', () => run(sb().from('leads').delete().eq('id', l.id)), ['leads']) : () => { set({ confirm: key }); flash('Click Delete again to remove it for good') },
        }
      })
      v.ibExport = () => download(`tamilto-quote-requests-${ymdTO()}.csv`, [['Date', 'Kind', 'Name', 'Phone', 'Email', 'Event date', 'Guests', 'Message', 'Businesses', 'Status'], ...items.map((l) => [when(l.created_at), l.kind, l.name, l.phone, l.email, l.event_date, l.guests, l.message, (l.lead_recipients || []).map((r) => byId[r.business_id]?.name).join('; '), (l.lead_recipients || []).map((r) => r.status).join('; ')])].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv')
      v.ibRefresh = () => loadGroups('leads').then(() => flash('Up to date'))
    } else {
      v.ibTitle = 'Client submissions'
      v.ibIntro = 'Business owners claiming or adding a listing, and readers sending tips, events and advertising enquiries. Nothing goes on the site until you approve it. Call or WhatsApp an owner before approving a claim.'
      v.ibStatus = [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected'], ['all', 'All']].map(([k, l]) => ({ l, sel: status === k ? 'true' : 'false', onClick: () => set({ ibox: k }), bg: status === k ? 'var(--ink)' : 'transparent', fg: status === k ? 'var(--bg)' : 'var(--ink)' }))
      const items = [...st.claims.map((c) => ({ ...c, _k: 'claim' })), ...st.subs.map((y) => ({ ...y, _k: y.kind }))].sort((a, b) => b.created_at.localeCompare(a.created_at))
      const shown = items.filter((y) => (s.ikind === 'all' || y._k === s.ikind) && (status === 'all' || y.status === status))
      v.ibShowKinds = true
      v.ibKinds = [['all', 'All'], ...Object.entries(SUBKIND)].map(([k, l]) => { const n = items.filter((y) => (k === 'all' || y._k === k) && y.status === 'pending').length; return { l: l + (n ? ` (${n})` : ''), sel: s.ikind === k ? 'true' : 'false', onClick: () => set({ ikind: k }), bg: s.ikind === k ? 'var(--ink)' : 'var(--glass2)', fg: s.ikind === k ? 'var(--bg)' : 'var(--ink)' } })
      v.ibCount = `${shown.length} shown`
      v.ibList = shown.map((y) => itemOf(y))
      v.ibExport = () => download(`tamilto-submissions-${ymdTO()}.csv`, [['Date', 'Type', 'Title', 'Name', 'Phone', 'Email', 'Status', 'Details'], ...shown.map((y) => { const it = itemOf(y); return [when(y.created_at), it.kind, it.title, y.contact_name || y.name, y.phone || '', y.email, y.status, it.lines.map((l) => l.k + ': ' + l.v).join(' | ')] })].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv')
      v.ibRefresh = () => loadGroups('claims', 'subs').then(() => flash('Up to date'))
    }
    v.ibEmpty = !v.ibList.length
  }
  function itemOf(y) {
    const isClaim = y._k === 'claim'
    const d = isClaim ? y.details || {} : Array.isArray(y.payload?.fields) ? Object.fromEntries(y.payload.fields.map((f) => [f.key, f.value])) : y.payload || {}
    const target = isClaim && y.business_id ? byId[y.business_id] : null
    const key = 'sub:' + y.id
    const table = isClaim ? 'claims' : 'submissions'
    const setStatus = (status, msg) => async () => {
      try {
        await run(sb().from(table).update(isClaim ? { status, reviewed_by: s.user.id, reviewed_at: new Date().toISOString() } : { status }).eq('id', y.id))
        await done(msg, [isClaim ? 'claims' : 'subs'], false)
      } catch (e) { flash('⚠ ' + e.message) }
    }
    let approve = setStatus('approved', 'Marked done')
    if (isClaim && target) approve = async () => {
      try {
        await run(sb().from('businesses').update({ is_verified: !!y.tamil_owned_confirmed || target.is_verified, verified_at: y.tamil_owned_confirmed || target.is_verified ? target.verified_at || new Date().toISOString() : null, verified_by: y.tamil_owned_confirmed ? s.user.id : target.verified_by, plan: y.plan || target.plan }).eq('id', target.id))
        await run(sb().from('claims').update({ status: 'approved', reviewed_by: s.user.id, reviewed_at: new Date().toISOString() }).eq('id', y.id))
        await done(`Claim approved${y.tamil_owned_confirmed ? ' · Verified badge added' : ''}. Opening the listing to check the details…`, ['claims', 'biz'])
        set({ tab: 'biz' })
        openEdit('biz', { ...target, is_verified: !!y.tamil_owned_confirmed || target.is_verified })
      } catch (e) { flash('⚠ ' + e.message) }
    }
    else if (isClaim || y._k === 'listing') approve = () => {
      set({ tab: 'biz' })
      openEdit('biz', null, null, prefillBusiness({ biz: y.title, ...d }, { _claimId: isClaim ? y.id : null, _subId: isClaim ? null : y.id, photos: (Array.isArray(d.photos) ? d.photos : y.photo_path ? [y.photo_path] : []).map((p) => ({ storage_path: p, alt: d.biz || y.title || '' })) }))
      flash('Check the details, then Save & publish. The owner’s photos are already added.')
    }
    else if (y._k === 'event') approve = () => {
      set({ tab: 'event' })
      openEdit('event', null, null, { title: y.title || d.title || d.event || '', venue: d.venue || d.location || '', ticket_url: d.ticketUrl || d.link || d.url || d.tickets || '', description: d.description || d.details || d.message || '', address: d.address || '', price: String(d.price || '0').replace(/[^\d.]/g, '') || '0', _subId: y.id, photos: y.photo_path ? [{ storage_path: y.photo_path, alt: y.title }] : [] })
      flash('Pick the date and time, then Save & publish.')
    }
    else if (FROM_SUB[y._k]) approve = () => {
      set({ tab: 'mkt', mk: y._k })
      openEdit('mitem', null, null, { ...toDraft(y._k), ...Object.fromEntries(Object.entries(FROM_SUB[y._k](d)).filter(([, x]) => x)), _subId: y.id })
      flash('Check the words, then Save & publish.')
    }
    const lines = Object.entries(d).filter(([k, x]) => k !== 'photos' && x !== '' && x != null && typeof x !== 'object').map(([k, x]) => ({ k: FLBL[k] || k, v: String(x) }))
    if (isClaim) lines.unshift({ k: 'Says Tamil-owned', v: y.tamil_owned_confirmed ? 'Yes' : 'No' }, { k: 'Plan', v: y.plan })
    if (y.notes) lines.push({ k: 'Notes', v: y.notes })
    const phone = y.phone || d.phone || d.whatsapp
    return {
      kind: SUBKIND[y._k] || y._k, title: (isClaim ? (target ? 'Claim: ' + target.name : d.biz || 'New business') : y.title || d.title || d.biz || 'Submission'),
      when: ago(y.created_at), status: { pending: 'Waiting', approved: 'Approved', rejected: 'Rejected' }[y.status] || y.status,
      sBg: y.status === 'pending' ? 'var(--act)' : 'var(--line)', sFg: y.status === 'pending' ? '#fff' : 'var(--ink)',
      lines: [{ k: 'From', v: [y.contact_name || y.name, y.email, phone && fmtPhone(digits(phone))].filter(Boolean).join(' · ') }, ...lines],
      hasVendors: false, vendorLinks: [],
      canApprove: isEditor && y.status !== 'approved', approve,
      canReject: isEditor && y.status !== 'rejected', reject: setStatus('rejected', 'Rejected'),
      canCycle: false,
      hasWa: !!wa(phone), wa: wa(phone, `Hi ${y.contact_name || y.name || ''}, this is TamilTO about your ${SUBKIND[y._k]?.toLowerCase() || 'message'}.`), hasMail: !!y.email, mail: 'mailto:' + y.email,
      del: s.confirm === key ? remove('Submission', () => run(sb().from(table).delete().eq('id', y.id)), [isClaim ? 'claims' : 'subs']) : () => { set({ confirm: key }); flash('Click Delete again to remove it for good') },
    }
  }

  // ----- website activity & business reports -----
  v.an = { ranges: [], cards: [], bars: [], topBiz: [], actions: [], pages: [], searches: [], devices: [], areas: [] }
  v.rp = { list: [], cards: [], bars: [], sources: [], recent: [] }
  if (v.isStats || v.isReports) analytics(v)
  function analytics(v) {
    const R = range, A = act[R] || {}
    const an = v.an
    an.ranges = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All time']].map(([k, l]) => ({ l, sel: R === k ? 'true' : 'false', bg: R === k ? 'var(--ink)' : 'transparent', fg: R === k ? 'var(--bg)' : 'var(--ink)', onClick: () => set({ range: k }) }))
    an.refresh = () => { setAct({}); setBact({}); flash('Activity refreshed') }
    an.demo = false
    an.gap = R > 60 || !R ? '1px' : R > 30 ? '2px' : '4px'
    if (A.err) { an.period = A.err; an.empty = true; return }
    if (!A.cur) { an.period = 'Loading…'; return }
    const C = A.cur, P = A.prev
    const fmtD = (k) => new Date(k + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
    const firstDay = C.days[0]?.d || today
    const nd = R || Math.min(120, Math.max(7, Math.round((new Date(today) - new Date(firstDay)) / DAY) + 1))
    const days = []
    for (let i = nd - 1; i >= 0; i--) { const k = new Date(new Date(today + 'T12:00:00').getTime() - i * DAY).toISOString().slice(0, 10); days.push({ k, d: fmtD(k) }) }
    const dayMap = Object.fromEntries(C.days.map((x) => [x.d, x]))
    const per = R ? `Last ${R} days · ${days[0].d} – ${days[days.length - 1].d}` : `All time · since ${fmtD(firstDay)}`
    an.period = per
    an.empty = !C.total
    an.has = C.total > 0
    if (!an.has) return
    const k = (S, kind) => (S?.kinds || {})[kind] || 0
    const contacts = (S) => CONTACT.reduce((n, c) => n + k(S, c), 0)
    const delta = (a, b) => {
      if (!R) return { d: '', dc: 'var(--ink2)' }
      if (!b) return { d: a ? 'new this period' : '—', dc: 'var(--ink2)' }
      const p = Math.round(((a - b) / b) * 100)
      return { d: (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs previous ' + R + ' days', dc: p >= 0 ? 'var(--green)' : 'var(--red)' }
    }
    const lblEvery = Math.ceil(nd / 10)
    const metrics = [['Page views', k(C, 'view'), k(P, 'view')], ['Visitors', C.visitors, P?.visitors], ['Business profile views', C.bizViews, P?.bizViews], ['Contacts to businesses', contacts(C), contacts(P)], ['WhatsApp taps', k(C, 'whatsapp'), k(P, 'whatsapp')], ['Calls', k(C, 'call'), k(P, 'call')], ['Quote requests', k(C, 'quote'), k(P, 'quote')], ['Searches', k(C, 'search'), k(P, 'search')]]
    an.cards = metrics.map(([l, a, b]) => ({ l, v: nf(a), ...delta(a, b || 0) }))
    const dv = days.map((d) => dayMap[d.k]?.views || 0), du = days.map((d) => dayMap[d.k]?.visitors || 0)
    const mx = Math.max(1, ...dv)
    an.bars = days.map((d, i) => ({ h: Math.round((dv[i] / mx) * 100) + '%', c: 'var(--mari)', l: i % lblEvery === 0 ? d.d : '', tip: `${d.d}: ${dv[i]} page views, ${du[i]} visitors` }))
    const pk = dv.indexOf(Math.max(...dv))
    an.peak = dv[pk] ? `Busiest day: ${days[pk].d} (${nf(dv[pk])} views)` : ''
    const toBars = (T, colr) => { const m = Math.max(1, ...T.map((x) => x[1])); return T.map(([l, n], i) => ({ l, v: nf(n), w: Math.round((n / m) * 100) + '%', c: typeof colr === 'function' ? colr(l, i) : colr })) }
    const BZ = (id) => byId[id]
    const bizT = C.biz.filter((x) => BZ(x.id))
    an.topBiz = bizT.slice(0, 10).map((x, i) => { const b = BZ(x.id); return { i: i + 1, n: b.name, sub: `${nf(x.kinds.view || 0)} views · ${nf(CONTACT.reduce((n, c) => n + (x.kinds[c] || 0), 0))} contacts · ${catOf(b.category_key).label}`, v: nf(x.total), open: () => set({ tab: 'reports', rbiz: x.id, rq: '' }) } })
    an.actions = toBars(Object.entries(C.kinds).filter(([kk]) => kk !== 'view' && kk !== 'search').sort((a, b) => b[1] - a[1]).map(([kk, n]) => [KL[kk] || kk, n]), (l) => KC[Object.keys(KL).find((kk) => KL[kk] === l)] || 'var(--mari)')
    const pages = {}
    if (C.bizViews) pages['Business profiles'] = C.bizViews
    for (const x of C.pages) { const l = PG(x.p || 'home'); pages[l] = (pages[l] || 0) + x.n }
    const pageT = Object.entries(pages).sort((a, b) => b[1] - a[1])
    an.pages = toBars(pageT.slice(0, 8), 'var(--teal)')
    an.searches = C.searches.slice(0, 10).map((x) => ({ l: x.q, v: nf(x.n) }))
    an.noSearch = !C.searches.length
    an.devices = toBars([['Mobile', C.devices.m || 0], ['Desktop', C.devices.d || 0]].filter((x) => x[1]).sort((a, b) => b[1] - a[1]), (l) => (l === 'Mobile' ? 'var(--red)' : 'var(--teal)'))
    const areas = {}
    for (const x of bizT) { const h = hoodOf(BZ(x.id).neighbourhood_key).name; areas[h] = (areas[h] || 0) + x.total }
    an.areas = toBars(Object.entries(areas).sort((a, b) => b[1] - a[1]), 'var(--mari)')
    const stamp = new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })
    an.xls = () => downloadXlsx(`tamilto-website-activity-${today}.xlsx`, [
      { name: 'Summary', rows: [['TamilTO website activity'], ['Period', per], ['Generated', stamp], ['Counts include no personal information.'], [], ['Metric', 'This period', R ? 'Previous period' : ''], ...metrics.map(([l, a, b]) => [l, a || 0, R ? b || 0 : '']), [], ['Top searches', 'Count'], ...C.searches.slice(0, 50).map((x) => [x.q, x.n]), [], ['Pages visited', 'Views'], ...pageT] },
      { name: 'By day', rows: [['Date', 'Page views', 'Visitors', 'Profile views', 'WhatsApp', 'Calls', 'Directions', 'Quote requests', 'Searches'], ...days.map((d) => { const x = dayMap[d.k] || {}; return [d.k, x.views || 0, x.visitors || 0, x.bviews || 0, x.whatsapp || 0, x.call || 0, x.directions || 0, x.quote || 0, x.search || 0] })] },
      { name: 'Businesses', rows: [['Business', 'Category', 'Area', 'Profile views', 'Contacts', 'Total activity'], ...bizT.map((x) => { const b = BZ(x.id); return [b.name, catOf(b.category_key).label, hoodOf(b.neighbourhood_key).name, x.kinds.view || 0, CONTACT.reduce((n, c) => n + (x.kinds[c] || 0), 0), x.total] })] },
    ])
    an.pdf = () => { flash('In the print window, choose “Save as PDF”.'); printDoc('TamilTO website activity', pdfHead('Website activity report', 'Website activity', per) + pdfCards(metrics.map(([l, a, b]) => ({ l, v: nf(a), d: delta(a, b || 0).d }))) + pdfBars('Page views per day', days.map((d, i) => ({ d: d.d, v: dv[i] }))) + pdfTable('Most active businesses', ['Business', 'Profile views', 'Contacts', 'Total activity'], bizT.slice(0, 12).map((x) => [BZ(x.id).name, nf(x.kinds.view || 0), nf(CONTACT.reduce((n, c) => n + (x.kinds[c] || 0), 0)), nf(x.total)])) + pdfTable('Top searches', ['Search', 'Count'], C.searches.slice(0, 10).map((x) => ['“' + x.q + '”', nf(x.n)])) + pdfTable('Pages visited', ['Section', 'Views'], pageT.slice(0, 8).map(([l, n]) => [l, nf(n)])) + pdfFoot()) }

    // business reports
    const rp = v.rp
    const actMap = Object.fromEntries(bizT.map((x) => [x.id, x.total]))
    const q = String(s.rq || '').trim().toLowerCase()
    const list = q.length >= 2
      ? biz.filter((b) => (b.name + ' ' + (b.listed_as || '') + ' ' + (b.city || '')).toLowerCase().includes(q)).sort((a, b) => (actMap[b.id] || 0) - (actMap[a.id] || 0)).slice(0, 40)
      : bizT.slice(0, 40).map((x) => BZ(x.id))
    const selId = s.rbiz && byId[s.rbiz] ? s.rbiz : list[0]?.id
    if (selId && selId !== s.rbiz && v.isReports) setTimeout(() => set({ rbiz: selId }), 0)
    Object.assign(rp, {
      q: s.rq || '', onQ: (e) => set({ rq: e.target.value }), listLabel: q.length >= 2 ? `${list.length} match${list.length === 1 ? '' : 'es'}` : 'Most active in this period',
      list: list.map((b) => ({ n: b.name, sub: `${catOf(b.category_key).label} · ${b.city || hoodOf(b.neighbourhood_key).name}`, v: nf(actMap[b.id] || 0), sel: b.id === selId ? 'true' : 'false', border: b.id === selId ? 'var(--mari)' : 'var(--line)', bg: b.id === selId ? 'var(--glass2)' : 'transparent', pick: () => set({ rbiz: b.id }) })),
    })
    rp.xlsAll = () => downloadXlsx(`tamilto-all-businesses-${today}.xlsx`, [{ name: 'All businesses', rows: [['TamilTO business activity, all businesses'], ['Period', per], ['Generated', stamp], [], ['Business', 'Category', 'Area', 'Status', 'Profile views', 'WhatsApp', 'Calls', 'Directions', 'Website & social', 'Saves', 'Shares', 'Quote requests', 'Total contacts'], ...biz.map((b) => { const K = C.biz.find((x) => x.id === b.id)?.kinds || {}; const g = (kk) => K[kk] || 0; return [b.name, catOf(b.category_key).label, hoodOf(b.neighbourhood_key).name, b.is_hidden ? 'Hidden' : 'Live', g('view'), g('whatsapp'), g('call'), g('directions'), g('website') + g('social') + g('reviews') + g('email'), g('save'), g('share'), g('quote'), CONTACT.reduce((n, c) => n + g(c), 0)] }).sort((x, y) => y[4] - x[4] || y[12] - x[12])] }])
    const b = selId && byId[selId]
    const D = b && bact[`${b.id}|${R}`]
    rp.none = !b
    rp.has = !!b
    if (!b) return
    const kk = (S, kind) => (S?.kinds || {})[kind] || 0
    const web = (S) => kk(S, 'website') + kk(S, 'social') + kk(S, 'reviews') + kk(S, 'email')
    const BC = D?.cur, BP = D?.prev
    const views = kk(BC, 'view'), ct = CONTACT.reduce((n, c) => n + kk(BC, c), 0)
    const bm = [['Profile views', views, kk(BP, 'view')], ['WhatsApp taps', kk(BC, 'whatsapp'), kk(BP, 'whatsapp')], ['Calls', kk(BC, 'call'), kk(BP, 'call')], ['Directions', kk(BC, 'directions'), kk(BP, 'directions')], ['Website & social', web(BC), web(BP)], ['Saves', kk(BC, 'save'), kk(BP, 'save')], ['Shares', kk(BC, 'share'), kk(BP, 'share')], ['Quote requests', kk(BC, 'quote'), kk(BP, 'quote')]]
    const sub = `${catOf(b.category_key).label} · ${b.city || hoodOf(b.neighbourhood_key).name}`
    Object.assign(rp, { n: b.name, sub, contact: [b.address, fmtPhone(b.phone || b.cell), b.email].filter(Boolean).join(' · '), view: b.is_hidden ? '/admin' : '/b/' + b.slug })
    if (!BC) { rp.cards = [{ l: D?.err ? 'Could not load' : 'Loading…', v: '…', d: D?.err || '', dc: 'var(--ink2)' }]; rp.noSrc = true; rp.noRecent = true; return }
    const rate = views ? Math.round((ct / views) * 100) + '%' : '—'
    rp.cards = [...bm.map(([l, a, p]) => ({ l, v: nf(a), ...delta(a, p) })), { l: 'Contact rate', v: rate, d: 'contacts per profile view', dc: 'var(--ink2)' }]
    const bd = Object.fromEntries(BC.days.map((x) => [x.d, x.kinds]))
    const vv = days.map((d) => (bd[d.k] || {}).view || 0), cc = days.map((d) => CONTACT.reduce((n, c) => n + ((bd[d.k] || {})[c] || 0), 0))
    const bmx = Math.max(1, ...vv.map((x, i) => Math.max(x, cc[i])))
    rp.bars = days.map((d, i) => { const top = Math.max(vv[i], cc[i]); return { h: Math.round((top / bmx) * 100) + '%', ch: top ? Math.round((cc[i] / top) * 100) + '%' : '0%', l: i % lblEvery === 0 ? d.d : '', tip: `${d.d}: ${vv[i]} views, ${cc[i]} contacts` } })
    const srcT = {}
    for (const x of BC.sources) { const l = PG(x.r); srcT[l] = (srcT[l] || 0) + x.n }
    const srcList = Object.entries(srcT).sort((a, c) => c[1] - a[1])
    rp.sources = toBars(srcList, 'var(--teal)')
    rp.noSrc = !srcList.length
    const RL = { view: 'Viewed the listing', whatsapp: 'Tapped WhatsApp', call: 'Tapped call', directions: 'Opened directions', website: 'Visited website', social: 'Opened social media', reviews: 'Opened Google reviews', email: 'Sent an email', save: 'Saved to a shortlist', share: 'Shared the listing', quote: 'Sent a quote request', listing: 'Claimed the listing' }
    rp.recent = BC.recent.map((e) => ({ l: (RL[e.kind] || e.kind) + (e.kind === 'view' ? ' · ' + (PG(e.ref).startsWith('From ') ? '' : 'from ') + PG(e.ref).replace(/^From /, 'from ').replace(/^(?!from )./, (c) => c.toLowerCase()) : '') + (e.device === 'm' ? ' · mobile' : ' · desktop'), t: ago(e.at), c: KC[e.kind] || 'var(--ink2)' }))
    rp.noRecent = !BC.recent.length
    const fname = b.slug
    rp.xls = () => downloadXlsx(`tamilto-report-${fname}-${today}.xlsx`, [
      { name: 'Report', rows: [['TamilTO business activity report'], ['Business', b.name], ['Category', catOf(b.category_key).label], ['Area', b.city || hoodOf(b.neighbourhood_key).name], ['Period', per], ['Generated', stamp], [], ['Metric', 'This period', R ? 'Previous period' : ''], ...bm.map(([l, a, p]) => [l, a, R ? p : '']), ['Contact rate', rate], [], ['How people found them', 'Views'], ...srcList] },
      { name: 'By day', rows: [['Date', 'Profile views', 'WhatsApp', 'Calls', 'Directions', 'Website & social', 'Saves', 'Shares', 'Quote requests'], ...days.map((d) => { const X = { kinds: bd[d.k] || {} }; return [d.k, kk(X, 'view'), kk(X, 'whatsapp'), kk(X, 'call'), kk(X, 'directions'), web(X), kk(X, 'save'), kk(X, 'share'), kk(X, 'quote')] })] },
    ])
    rp.pdf = () => { flash('In the print window, choose “Save as PDF”.'); printDoc(b.name + ' · TamilTO report', pdfHead('Business activity report', b.name, sub + ' · ' + per) + pdfCards(rp.cards.map((c) => ({ l: c.l, v: c.v, d: c.d }))) + pdfBars('Profile views & contacts per day', days.map((d, i) => ({ d: d.d, v: Math.max(vv[i], cc[i]) })), cc) + pdfTable('How people found them', ['Source', 'Views'], srcList.map(([l, n]) => [l, nf(n)])) + pdfTable('By day', ['Date', 'Views', 'Contacts'], days.filter((d, i) => vv[i] || cc[i]).map((d) => [d.d, nf((bd[d.k] || {}).view || 0), nf(CONTACT.reduce((n, c) => n + ((bd[d.k] || {})[c] || 0), 0))])) + pdfFoot()) }
  }

  // ----- team -----
  v.isOwner = s.role === 'owner'
  v.myEmail = s.user.email
  v.myRole = s.role
  v.team = st.team.map((m) => {
    const me = m.user_id === s.user.id, key = 'tm:' + m.user_id
    return {
      n: m.name || m.email || m.user_id.slice(0, 8), sub: [m.name && m.email, me && 'you'].filter(Boolean).join(' · ') || m.role, role: m.role, roleLabel: { owner: 'Owner', editor: 'Editor', sales: 'Sales' }[m.role] || m.role,
      canChange: v.isOwner && !me, fixed: !v.isOwner || me,
      onRole: async (e) => { try { await run(sb().from('admins').update({ role: e.target.value }).eq('user_id', m.user_id)); await done('Role changed', ['team'], false) } catch (err) { flash('⚠ ' + err.message) } },
      confirming: s.confirm === key, notConfirming: s.confirm !== key, askDel: () => set({ confirm: key }),
      del: async () => { set({ confirm: null }); try { await run(sb().from('admins').delete().eq('user_id', m.user_id)); await done('Removed from the team', ['team'], false) } catch (err) { flash('⚠ ' + err.message) } },
    }
  })
  Object.assign(v, { newEmail: s.newEmail, newName: s.newName, newRole: s.newRole, onNewEmail: (e) => set({ newEmail: e.target.value }), onNewName: (e) => set({ newName: e.target.value }), onNewRole: (e) => set({ newRole: e.target.value }) })
  v.addMember = async (e) => {
    e.preventDefault()
    try {
      await run(sb().rpc('add_admin', { p_email: s.newEmail.trim(), p_role: s.newRole, p_name: s.newName.trim() }))
      set({ newEmail: '', newName: '' })
      await done(`${s.newEmail.trim()} added as ${s.newRole}`, ['team'], false)
    } catch (err) { flash('⚠ ' + (/add_admin/.test(err.message) ? 'Run 03-admin.sql in Supabase first.' : err.message)) }
  }
  v.changePw = async (e) => {
    e.preventDefault()
    if (s.newPw.length < 10) return flash('⚠ Use at least 10 characters.')
    const { error } = await sb().auth.updateUser({ password: s.newPw })
    if (error) return flash('⚠ ' + friendly(error))
    set({ newPw: '' })
    flash('Password changed. Update it in Bitwarden too.')
  }

  // ----- data -----
  v.doExport = async () => {
    flash('Preparing the download…')
    const full = { exportedAt: new Date().toISOString(), note: 'TamilTO backup. Photos stay in Supabase Storage (media bucket); their paths are listed here.', categories: cats, neighbourhoods: hoods, businesses: biz, events: st.events, articles: st.articles, lists: st.colls, lifeMoments: st.journeys, stories: st.stories, siteContent: st.settings }
    download(`tamilto-backup-${ymdTO()}.json`, JSON.stringify(full, null, 1), 'application/json')
  }
  v.doCsv = () => {
    const H = ['Name', 'Web address', 'Status', 'Category', 'Type', 'Area', 'City', 'Address', 'Contact', 'Phone', 'Mobile', 'Email', 'Website', 'Photos', 'Featured', 'Verified', 'Source']
    const rows = biz.map((b) => [b.name, 'https://tamilto.com/b/' + b.slug, b.is_hidden ? 'Hidden' : 'Live', catOf(b.category_key).label, b.listed_as, hoodOf(b.neighbourhood_key).name, b.city, b.address, b.contact_name, fmtPhone(b.phone), fmtPhone(b.cell), b.email, b.website, b.photos.length, b.is_featured ? 'Yes' : '', b.is_verified ? 'Yes' : '', b.source])
    download(`tamilto-businesses-${ymdTO()}.csv`, '﻿' + [H, ...rows].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv')
  }

  // ---------- editor ----------
  function prefillBusiness(d, extra) {
    d = { ...d, cat: d.cat || d.category, area: d.area || d.neighbourhood, addr: d.addr || d.address, web: d.web || d.website, short: d.short || d.details }
    const cat = cats.find((c) => c.key === d.cat || c.label.toLowerCase() === String(d.cat || '').toLowerCase())
    const hood = hoods.find((h) => h.key === d.area || h.name.toLowerCase() === String(d.area || '').toLowerCase())
    return {
      name: d.biz || d.name || '', category_key: cat?.key || '', neighbourhood_key: hood?.key || '', city: d.city || '', address: [d.addr, d.postal].filter(Boolean).join(', '),
      short_description: d.short || '', contact_name: d.contact || '', phone: digits(d.phone), cell: digits(d.whatsapp), email: d.email || '', website: d.web || '', google_maps_url: d.gmap || '',
      social: Object.fromEntries(['instagram', 'facebook', 'tiktok'].filter((k) => d[k]).map((k) => [k, d[k]])), deal: d.deal || '', jobs: d.jobs ? String(d.jobs).split(/\n|,/).map((x) => x.trim()).filter(Boolean) : [],
      accepts_quotes: /^(yes|on|true)$/i.test(d.quotes || ''), plan: ['free', 'featured', 'partner'].includes(d.plan) ? d.plan : 'free', speaks_tamil: /tamil/i.test(d.languages || ''), source: extra._claimId ? 'Owner claim' : 'Reader tip',
      ...extra,
    }
  }

  function openEdit(type, item, id, prefill) {
    let d
    if (type === 'biz') {
      const b = item || {}
      d = {
        name: '', slug: '', category_key: '', listed_as: '', neighbourhood_key: '', city: '', address: '', lat: '', lng: '', contact_name: '', phone: '', cell: '', fax: '', email: '', website: '', google_maps_url: '', google_reviews_url: '',
        short_description: '', deal: '', jobs: [], hours: null, by_appointment: false, plan: 'free', is_featured: false, featured_until: '', is_verified: false, accepts_quotes: false, speaks_tamil: false, is_hidden: !item, social: {}, photos: [],
        ...b, ...(prefill || {}),
      }
      d.jobsTxt = (d.jobs || []).join(', ')
      for (const [k] of SOCIAL) d['s_' + k] = (d.social || {})[k] || ''
      d.photos = (d.photos || []).map((p) => ({ id: p.id, path: p.storage_path, alt: p.alt }))
      d.lat = d.lat ?? ''
      d.lng = d.lng ?? ''
      d.featured_until = d.featured_until || ''
      d.phone = fmtPhone(d.phone)
      d.cell = fmtPhone(d.cell)
      d.fax = fmtPhone(d.fax)
    } else if (type === 'event') {
      const e = item || {}
      d = { title: '', slug: '', type: 'Culture', neighbourhood_key: '', venue: '', address: '', price: '0', description: '', ticket_url: '', tone: TONES[4][1], sold_out: false, is_hidden: false, photos: [], ...e, ...(prefill || {}) }
      const sw = isoToToronto(e.starts_at), ew = isoToToronto(e.ends_at)
      d.date = sw ? sw.slice(0, 10) : ''
      d.st = sw ? sw.slice(11) : '19:00'
      d.en = ew ? ew.slice(11) : ''
      d.endDate = ew && ew.slice(0, 10) !== d.date ? ew.slice(0, 10) : ''
      d.price = String(d.price ?? 0)
      d.neighbourhood_key = d.neighbourhood_key || ''
      d.photos = (d.photos || []).map((p) => ({ id: p.id, path: p.storage_path, alt: p.alt }))
    } else if (type === 'article') {
      const a = item || {}
      d = { section: s.sec || 'eat', title: '', slug: '', dek: '', author: 'TamilTO', neighbourhood: '', hero_alt: '', hero_caption: '', hero_credit: '', is_featured: false, is_trending: false, sponsored: false, sponsor_name: '', sponsor_url: '', is_hidden: !item, ...a }
      const pw = isoToToronto(a.publish_at || new Date().toISOString())
      d.pdate = pw.slice(0, 10)
      d.ptime = pw.slice(11)
      d.text = blocksToMarkup(a.body)
      d.tagsTxt = (a.tags || []).join(', ')
      d.photos = a.hero_image ? [{ path: a.hero_image, alt: a.hero_alt }] : []
    } else if (type === 'coll') {
      const c = item || {}
      d = { title: '', slug: '', curated_by: 'The TamilTO team', description: '', is_hidden: false, ...c, ids: (c.collection_items || []).sort((a, b) => a.sort - b.sort).map((x) => x.business_id) }
    } else if (type === 'journey') {
      const j = item || {}
      d = {
        title: '', slug: '', tamil_name: '', quote_label: 'Quote request', description: '', tone: TONES[7][1], is_hidden: false, ...j,
        steps: (j.journey_steps || [{ when_label: '', title: '', tip: '', journey_step_businesses: [] }]).sort((a, b) => a.sort - b.sort).map((x) => ({ id: x.id, when: x.when_label || '', t: x.title || '', d: x.tip || '', ids: (x.journey_step_businesses || []).sort((a, b) => a.sort - b.sort).map((y) => y.business_id) })),
      }
    } else if (type === 'story') {
      d = { label: '', tone: TONES[0][1], is_hidden: false, slides: [], ...(item || {}) }
      d.slides = (d.slides || []).map((x) => ({ ...x }))
    } else if (type === 'cat') d = { label: '', colour: '#F5B83D', ...(item || {}) }
    else if (type === 'hood') d = { tagline: '', description: '', ...(item || {}) }
    else if (type === 'mitem') d = { ...prefill }
    else d = { ...(item || {}) }
    setEdit({ type, id: id || item?.id || item?.key || null, draft: d, err: '', uploaded: [] })
    set({ pick: '', jpick: {}, confirm: null })
  }

  if (edit) buildForm(v)
  function buildForm(v) {
    const { type, draft: d, err } = edit
    const isNew = !edit.id
    v.editing = true
    v.formTitle = type === 'hood' ? 'Edit ' + d.name : type === 'mpage' ? 'Edit page intro: ' + PAGE_NAMES[edit.id] : (['site', 'sitehero', 'siteex', 'plan', 'siteperks', 'sitehow', 'mnotice', 'mnews', 'mawards'].includes(type) ? 'Edit ' : isNew ? 'New ' : 'Edit ') + (type === 'mitem' ? MK[d._kind].one : NOUN[type])
    v.hasFormErr = !!err
    v.formErr = err
    v.saving = !!edit.saving
    v.saveLabel = edit.saving ? 'Saving…' : isEditor ? 'Save & publish' : 'Saving is off for sales logins'
    v.closeEdit = closeEdit
    v.save = (e) => { e.preventDefault(); if (isEditor) save() }
    const F = []
    const f = (k, label, kind = 'text', o = {}) => F.push({
      key: (edit.id || 'new') + ':' + k, label: label + (o.req ? ' *' : ''), type: kind, value: d[k] ?? '', checked: !!d[k], ph: o.ph || '', hint: o.hint || '', req: !!o.req, dis: !isEditor,
      span: o.full ? '1 / -1' : 'auto', isText: !['textarea', 'check'].includes(kind) && !kind.startsWith('select'), isArea: kind === 'textarea', isSelect: kind.startsWith('select'), isCheck: kind === 'check',
      options: kind.startsWith('select') ? opts(kind.slice(7)) : [],
      onChange: (e) => setDraft({ [k]: kind === 'check' ? e.target.checked : e.target.value }),
    })
    const section = (label) => F.push({ key: 'sec:' + label, label, isSection: true })
    const note = (label) => F.push({ key: 'note:' + label.slice(0, 20), label, isNote: true })
    if (type === 'biz') {
      f('name', 'Business name', 'text', { full: true, req: true })
      f('category_key', 'Category', 'select:cats', { req: true })
      f('listed_as', 'Listed as', 'text', { ph: 'e.g. Wedding Caterers' })
      f('neighbourhood_key', 'Area', 'select:hoods', { req: true })
      f('city', 'City', 'text', { ph: 'e.g. Scarborough' })
      f('address', 'Street address', 'text', { full: true, hint: 'Leave empty for home-based or mobile businesses.' })
      f('contact_name', 'Contact person')
      f('phone', 'Phone', 'tel')
      f('cell', 'Mobile / WhatsApp', 'tel', { hint: 'The WhatsApp button uses this number.' })
      f('fax', 'Fax', 'tel')
      f('email', 'Email', 'email')
      f('website', 'Website', 'text', { ph: 'www.example.com' })
      f('google_maps_url', 'Google Maps link', 'text', { full: true, ph: 'https://maps.app.goo.gl/… (Share → Copy link)' })
      f('google_reviews_url', 'Google reviews link', 'text', { full: true, ph: 'https://g.page/r/…/review' })
      for (const [k, label] of SOCIAL) f('s_' + k, label, 'text', { ph: k === 'linkedin' ? 'company page link' : '@handle or link' })
      f('short_description', 'One-line description', 'textarea', { full: true, ph: 'Shown on cards. Defaults to the address.' })
      f('deal', 'Current deal', 'text', { full: true, ph: 'Leave empty for no deal' })
      f('jobsTxt', 'Jobs (comma-separated)', 'text', { full: true, ph: 'e.g. Cashier, Weekend cook' })
      const h = d.hours
      F.push({
        key: 'hours', label: 'Opening hours (Toronto time)', isHours: true, noHours: !h && isEditor, hasHours: !!h && isEditor,
        addHours: () => setDraft({ hours: [null, ...Array(5).fill({ open: '09:00', close: '18:00' }), { open: '10:00', close: '17:00' }] }),
        clearHours: () => setDraft({ hours: null }),
        days: h ? DAYS.map((n, i) => {
          const x = h[i]
          const put = (val) => setDraft((dd) => { const H = [...dd.hours]; H[i] = val; return { hours: H } })
          return { n, closed: !x, open: !!x, o: x?.open || '', c: x?.close || '', onClosed: (e) => put(e.target.checked ? null : { open: '09:00', close: '18:00' }), onO: (e) => put({ ...x, open: e.target.value }), onC: (e) => put({ ...x, close: e.target.value }) }
        }) : [],
      })
      f('by_appointment', 'By appointment only', 'check')
      section('Map position')
      f('lat', 'Latitude', 'text', { ph: '43.77', hint: 'Google Maps: right-click the place, click the numbers to copy. First number here…' })
      f('lng', 'Longitude', 'text', { ph: '-79.25', hint: '…second number here.' })
      section('Badges & plan')
      f('plan', 'Plan', 'select:plan')
      f('featured_until', 'Featured until', 'date', { hint: 'Leave empty for no end date.' })
      f('is_featured', 'Featured (top of results, glowing pin)', 'check')
      f('is_verified', 'Verified Tamil-owned', 'check')
      f('accepts_quotes', 'Accepts quote requests', 'check')
      f('speaks_tamil', 'Speaks Tamil', 'check')
      f('slug', 'Web address', 'text', { full: true, ph: slugify(d.name), hint: `tamilto.com/b/${d.slug || slugify(d.name) || '…'}${isNew ? '' : ' · changing it breaks old links'}` })
      f('is_hidden', 'Hidden from the site', 'check')
      if (d.photos.length < MINPH) note(`Listings look best with ${MINPH}+ photos (storefront, inside, what they sell). It can be live without them.`)
    } else if (type === 'event') {
      f('title', 'Event title', 'text', { full: true, req: true })
      f('type', 'Type', 'select:evtype')
      f('neighbourhood_key', 'Area', 'select:hoods0')
      f('date', 'Date', 'date', { req: true })
      f('venue', 'Venue', 'text', { req: true })
      f('st', 'Starts', 'time', { req: true })
      f('en', 'Ends', 'time', { hint: 'If it ends after midnight, set the end date below.' })
      f('endDate', 'End date (only if different)', 'date')
      f('address', 'Address', 'text')
      f('price', 'Price from ($, 0 = free)', 'number')
      f('description', 'Description', 'textarea', { full: true })
      f('ticket_url', 'Tickets / RSVP link', 'text', { full: true, ph: 'https://…' })
      f('tone', 'Card colour', 'select:tones')
      f('slug', 'Web address', 'text', { ph: slugify(d.title), hint: `tamilto.com/events/${d.slug || slugify(d.title) || '…'}` })
      f('sold_out', 'Sold out', 'check')
      f('is_hidden', 'Hidden from the site', 'check')
    } else if (type === 'article') {
      f('title', 'Headline', 'text', { full: true, req: true })
      f('section', 'Section', 'select:sec')
      f('author', 'Author')
      f('dek', 'Summary line', 'textarea', { full: true, ph: 'One sentence under the headline. Also used by Google and when shared.' })
      const words = String(d.text || '').split(/\s+/).filter(Boolean).length
      F.push({
        key: 'story', label: 'Story', isStory: true, value: d.text || '', ph: 'Start writing. Leave an empty line between paragraphs.', ref: storyRef, words: `${words} words · about ${Math.max(1, Math.round(words / 220))} min read`, cheats: CHEATS,
        onChange: (e) => setDraft({ text: e.target.value }), inlineLabel: edit.inline ? 'Uploading…' : 'Insert a photo here',
        onInline: async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setEdit((x) => ({ ...x, inline: true }))
          try {
            const path = await uploadPhoto(file, `articles/${d.slug || slugify(d.title) || 'story'}`)
            const el = storyRef.current, at = el ? el.selectionEnd : (d.text || '').length
            setEdit((x) => ({ ...x, inline: false, uploaded: [...x.uploaded, path], draft: { ...x.draft, text: (x.draft.text || '').slice(0, at) + `\n\n![Write a caption here](${mediaUrl(path)})\n\n` + (x.draft.text || '').slice(at) } }))
            flash('Photo added to the story. Change “Write a caption here”.')
          } catch (err) { setEdit((x) => ({ ...x, inline: false })); flash('⚠ ' + err.message) }
        },
      })
      f('hero_alt', 'Describe the main photo', 'text', { full: true, hint: 'For blind readers and Google.' })
      f('hero_caption', 'Photo caption')
      f('hero_credit', 'Photo credit', 'text', { ph: 'Photo: Kavya R.' })
      section('Publishing')
      f('pdate', 'Publish date', 'date', { hint: 'A future date schedules it.' })
      f('ptime', 'Publish time', 'time')
      f('tagsTxt', 'Tags', 'text', { ph: 'kothu, best-of' })
      f('neighbourhood', 'Area', 'select:hoodNames')
      f('slug', 'Web address', 'text', { full: true, ph: slugify(d.title), hint: `tamilto.com/${d.section}/${d.slug || slugify(d.title) || '…'}` })
      f('is_featured', 'Featured (big spot in its section)', 'check')
      f('is_trending', 'Trending', 'check')
      f('sponsored', 'Sponsored (paid)', 'check')
      if (d.sponsored) { f('sponsor_name', 'Sponsor name', 'text', { req: true }); f('sponsor_url', 'Sponsor website') }
      f('is_hidden', 'Hidden from the site (draft)', 'check')
    } else if (type === 'coll') {
      f('title', 'List title', 'text', { full: true, req: true })
      f('curated_by', 'Curated by')
      f('slug', 'Web address', 'text', { ph: slugify(d.title), hint: `tamilto.com/c/${d.slug || slugify(d.title) || '…'}` })
      f('description', 'Description', 'textarea', { full: true })
      f('is_hidden', 'Hidden from the site', 'check')
    } else if (type === 'journey') {
      f('title', 'Life moment title', 'text', { full: true, req: true, ph: 'e.g. Planning a wedding' })
      f('tamil_name', 'Tamil name', 'text', { ph: 'e.g. கல்யாணம்' })
      f('quote_label', 'Quote request label', 'text', { ph: 'e.g. Wedding' })
      f('tone', 'Card colour', 'select:tones')
      f('slug', 'Web address', 'text', { ph: slugify(d.title), hint: `tamilto.com/journey/${d.slug || slugify(d.title) || '…'}` })
      f('description', 'Description', 'textarea', { full: true })
      f('is_hidden', 'Hidden from the site', 'check')
    } else if (type === 'story') {
      f('label', 'Story name (shown under the circle)', 'text', { full: true, req: true, ph: 'e.g. New this week' })
      f('tone', 'Circle & card colour', 'select:tones')
      f('is_hidden', 'Hidden from the site', 'check')
    } else if (type === 'cat') {
      f('label', 'Category name', 'text', { full: true, req: true, ph: 'e.g. Photographers' })
      f('colour', 'Colour', 'color')
    } else if (type === 'hood') {
      f('tagline', 'Tagline', 'text', { full: true, req: true })
      f('description', 'Description', 'textarea', { full: true })
    } else if (type === 'sitehero') {
      f('a', 'Headline', 'text', { full: true, req: true })
      f('b', 'Highlighted ending', 'text', { req: true })
      f('sub', 'Intro text under the headline', 'textarea', { full: true, req: true })
    } else if (type === 'siteex') {
      f('list', 'Search suggestions (one per line)', 'textarea', { full: true, req: true, ph: 'realtor in Markham\nwedding caterer' })
    } else if (type === 'plan') {
      f('name', 'Plan name', 'text', { req: true })
      f('monthly', 'Price per month ($)', 'number')
      f('yearly', 'Price per year ($)', 'number')
      f('description', 'Short description', 'textarea', { full: true })
      f('features', 'What is included (one per line)', 'textarea', { full: true })
    } else if (type === 'siteperks') {
      f('list', 'Benefits (one per line: Title | description)', 'textarea', { full: true, req: true, ph: 'One-tap WhatsApp | Customers message you from your listing' })
    } else if (type === 'sitehow') {
      f('list', 'Steps (one per line: Title | description)', 'textarea', { full: true, req: true, ph: 'Claim | Find your business, or add it' })
    } else if (type === 'mitem') {
      const K = MK[d._kind]
      if (K.hint) note(K.hint)
      if (d._subId) note('From a reader post. Check the words and remove anything private (names, emails) before you publish. The phone number on jobs and classifieds is shown publicly, as the poster asked.')
      for (const [k, label, kind, o = {}] of K.fields) f(k, label, kind === 'lines' || kind === 'pairs' ? 'textarea' : kind === 'url' ? 'text' : kind, o)
      if (K.expires) f('expires_on', 'Take it down after (optional)', 'date', { hint: d._kind === 'request' || d._kind === 'job' || d._kind === 'classified' ? 'Leave empty to keep it up until you hide it. 30–60 days is usual.' : '' })
      f('is_hidden', 'Hidden from the site', 'check')
      if (d._kind === 'request' && edit.id) {
        const R2 = (st.replies || []).filter((r) => r.item_id === edit.id)
        section('Replies from businesses (' + R2.length + ')')
        if (!R2.length) note('No replies yet.')
        R2.forEach((r) => note(`${r.business_name} · ${fmtPhone(digits(r.phone)) || r.phone}${r.message ? ' · ' + r.message : ''} · ${ago(r.created_at)}${r.notified_at ? ' · customer emailed' : ' · NOT emailed, please pass it on'}`))
        const sub = d._sub
        if (sub) note(`Customer (private): ${[sub.name, sub.email, sub.phone].filter(Boolean).join(' · ')}`)
      }
    } else if (type === 'mpage') {
      f('kick', 'Small label above the title', 'text')
      f('ta', 'Tamil word', 'text')
      f('title', 'Title', 'text', { full: true, req: true })
      f('lead', 'Intro text', 'textarea', { full: true, req: true })
    } else if (type === 'mnotice') {
      f('requests', 'Customer requests (privacy note)', 'textarea', { full: true })
      f('creators', 'Creators (ad label rules)', 'textarea', { full: true })
      f('partners', 'Trusted partners (referral fees)', 'textarea', { full: true })
      f('sponsored', 'Advertise (sponsored labels)', 'textarea', { full: true })
    } else if (type === 'mnews') {
      f('t', 'Title', 'text', { full: true, req: true })
      f('d', 'Text', 'textarea', { full: true, req: true })
      f('sponsor', 'Presented by (sponsor name, optional)', 'text', { full: true })
    } else if (type === 'mawards') {
      f('year', 'Year', 'text', { req: true })
      f('stage', 'Stage shown on the site', 'text', { req: true, ph: 'Voting is open' })
      f('voting', 'Voting is open', 'check')
      f('dates', 'Key dates (one per line: Label: date)', 'textarea', { full: true, ph: 'Nominations: Oct 1–31' })
      f('cats', 'Categories (one per line: code | name | keywords | leave out | sponsor)', 'textarea', { full: true, req: true, hint: 'The code never changes once voting starts (votes are stored under it). Nominees are the 4 best-ranked live businesses matching the keywords.' })
    }
    v.formFields = F

    // photos
    const PH = ['biz', 'event', 'article'].includes(type), isB = type === 'biz'
    v.isBizForm = PH
    if (PH) {
      const ph = d.photos || []
      const max = type === 'article' ? 1 : 30
      v.photoLabel = isB ? 'Photos' : type === 'article' ? 'Main photo' : 'Photos'
      v.photoHint = isB ? 'The first photo is the cover. Storefront, inside, and what they sell work best. Only use photos the owner gave you or that you took.' : type === 'event' ? 'The first photo is the event card image. Posters and venue shots work well.' : 'Shown at the top of the story and on its card. Wide photos work best.'
      v.photos = ph.map((p, i) => ({
        n: i + 1, bg: bg(p.path), cover: i === 0, notCover: i !== 0, border: i === 0 ? '#F5B83D' : 'transparent',
        remove: () => setDraft({ photos: ph.filter((x) => x !== p) }), makeCover: () => setDraft({ photos: [p, ...ph.filter((x) => x !== p)] }),
      }))
      v.photoCount = isB ? `${ph.length} added · ${MINPH}+ recommended` : `${ph.length} added · ${type === 'article' ? 'one photo' : 'optional'}`
      v.photoColor = !isB || ph.length >= MINPH ? 'var(--green)' : '#F5B83D'
      v.uploading = !!edit.uploading
      v.notUploading = !edit.uploading
      v.onFiles = async (e) => {
        const files = [...(e.target.files || [])]
        e.target.value = ''
        if (!files.length || !isEditor) return
        setEdit((x) => ({ ...x, uploading: true }))
        const folder = { biz: 'businesses', event: 'events', article: 'articles' }[type] + '/' + (edit.id || 'new-' + Date.now().toString(36))
        for (const file of files.slice(0, max)) {
          try {
            const path = await uploadPhoto(file, folder)
            setEdit((x) => ({ ...x, uploaded: [...x.uploaded, path], draft: { ...x.draft, photos: type === 'article' ? [{ path, alt: x.draft.hero_alt || x.draft.title }] : [...x.draft.photos, { path, alt: x.draft.name || x.draft.title || '' }] } }))
          } catch (err) { flash('⚠ ' + err.message) }
        }
        setEdit((x) => ({ ...x, uploading: false }))
      }
    }
    // business pickers
    const pickFrom = (q, exclude, add) => {
      q = String(q || '').trim().toLowerCase()
      if (q.length < 2) return []
      return biz.filter((b) => !exclude.includes(b.id) && (b.name.toLowerCase().includes(q) || (b.listed_as || '').toLowerCase().includes(q))).sort((a, b) => a.is_hidden - b.is_hidden).slice(0, 8)
        .map((b) => ({ n: b.name, sub: [catOf(b.category_key).label, hoodOf(b.neighbourhood_key).name, b.is_hidden ? 'hidden: shows once live' : 'live'].join(' · '), add: () => add(b.id) }))
    }
    v.isCollForm = type === 'coll'
    if (type === 'coll') {
      v.pickSel = d.ids.map((id, i) => ({ i: i + 1, n: (byId[id]?.name || 'Deleted business') + (byId[id]?.is_hidden ? ' (hidden)' : ''), remove: () => setDraft({ ids: d.ids.filter((x) => x !== id) }) }))
      v.noPickSel = !d.ids.length
      v.pick = s.pick
      v.onPick = (e) => set({ pick: e.target.value })
      v.pickRes = pickFrom(s.pick, d.ids, (id) => { setDraft({ ids: [...d.ids, id] }); set({ pick: '' }) })
    }
    v.isJourneyForm = type === 'journey'
    if (type === 'journey') {
      const S = d.steps, setSteps = (L2) => setDraft({ steps: L2 }), upd = (i, o) => setSteps(S.map((x, j) => (j === i ? { ...x, ...o } : x)))
      v.jSteps = S.map((x, i) => ({
        n: i + 1, when: x.when, t: x.t, d: x.d, onWhen: (e) => upd(i, { when: e.target.value }), onT: (e) => upd(i, { t: e.target.value }), onD: (e) => upd(i, { d: e.target.value }),
        vendors: x.ids.map((id) => ({ n: byId[id]?.name || 'Deleted business', remove: () => upd(i, { ids: x.ids.filter((z) => z !== id) }) })), noVendors: !x.ids.length, vcount: `${x.ids.length} business${x.ids.length === 1 ? '' : 'es'}`,
        pick: s.jpick[i] || '', onPick: (e) => set((y) => ({ jpick: { ...y.jpick, [i]: e.target.value } })),
        pickRes: pickFrom(s.jpick[i], x.ids, (id) => { upd(i, { ids: [...x.ids, id] }); set((y) => ({ jpick: { ...y.jpick, [i]: '' } })) }),
        up: () => { const M = swap(S, i, -1); if (M) { setSteps(M); set({ jpick: {} }) } }, down: () => { const M = swap(S, i, 1); if (M) { setSteps(M); set({ jpick: {} }) } },
        upDis: i === 0, downDis: i === S.length - 1, del: () => { setSteps(S.filter((_, j) => j !== i)); set({ jpick: {} }) },
      }))
      v.addStep = () => setSteps([...S, { when: '', t: '', d: '', ids: [] }])
      v.noSteps = !S.length
    }
    v.isStoryForm = type === 'story'
    if (type === 'story') {
      const S = d.slides, setSl = (L2) => setDraft({ slides: L2 }), upd = (i, o) => setSl(S.map((x, j) => (j === i ? { ...x, ...o } : x)))
      v.sSlides = S.map((x, i) => ({
        n: i + 1, kicker: x.kicker || '', title: x.title || '', text: x.text || '', href: x.href || '', cta: x.cta || '',
        onK: (e) => upd(i, { kicker: e.target.value }), onT: (e) => upd(i, { title: e.target.value }), onX: (e) => upd(i, { text: e.target.value }), onH: (e) => upd(i, { href: e.target.value }), onC: (e) => upd(i, { cta: e.target.value }),
        hasPhoto: !!x.photo, noPhoto: !x.photo, bg: bg(x.photo),
        onFile: async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          try {
            const path = await uploadPhoto(file, 'stories')
            setEdit((y) => ({ ...y, uploaded: [...y.uploaded, path], draft: { ...y.draft, slides: y.draft.slides.map((z, j) => (j === i ? { ...z, photo: path } : z)) } }))
          } catch (err) { flash('⚠ ' + err.message) }
        },
        rmPhoto: () => upd(i, { photo: '' }), up: () => { const M = swap(S, i, -1); if (M) setSl(M) }, down: () => { const M = swap(S, i, 1); if (M) setSl(M) },
        upDis: i === 0, downDis: i === S.length - 1, del: () => setSl(S.filter((_, j) => j !== i)),
      }))
      v.addSlide = () => setSl([...S, { kicker: '', title: '', text: '', href: '', cta: '', photo: '' }])
      v.noSlides = !S.length
    }
  }

  async function closeEdit() {
    // Photos uploaded during this edit but never saved are removed, so storage stays tidy.
    if (edit && !edit.savedOk && edit.uploaded.length) await removeFiles(edit.uploaded).catch(() => {})
    setEdit(null)
  }
  const fail = (msg) => setEdit((x) => ({ ...x, err: msg, saving: false }))

  async function save() {
    const { type, draft: d } = edit
    const id = edit.id
    const need = (cond, msg) => { if (!cond) throw Object.assign(new Error(msg), { form: true }) }
    setEdit((x) => ({ ...x, saving: true, err: '' }))
    try {
      if (type === 'biz') {
        need(d.name.trim(), 'Give the business a name.')
        need(d.category_key, 'Pick a category.')
        need(d.neighbourhood_key, 'Pick an area.')
        for (const [k, l] of [['phone', 'Phone'], ['cell', 'Mobile'], ['fax', 'Fax']]) need(!d[k] || digits(d[k]).length === 10, `${l} must be 10 digits, like 416 555 1234.`)
        need(!d.email || /^\S+@\S+\.\S+$/.test(d.email), 'That email doesn’t look right.')
        need(d.lat === '' || d.lat === null || (+d.lat >= 40 && +d.lat <= 50), 'Latitude should be about 43.')
        need(d.lng === '' || d.lng === null || (+d.lng >= -85 && +d.lng <= -75), 'Longitude should be about -79.')
        const slug = slugify(d.slug || d.name)
        need(slug, 'The web address can’t be empty.')
        const row = {
          name: d.name.trim(), slug, category_key: d.category_key, listed_as: d.listed_as.trim(), neighbourhood_key: d.neighbourhood_key, city: d.city.trim(), address: d.address.trim(),
          lat: d.lat === '' || d.lat === null ? null : +d.lat, lng: d.lng === '' || d.lng === null ? null : +d.lng,
          contact_name: d.contact_name.trim(), phone: digits(d.phone), cell: digits(d.cell), fax: digits(d.fax), email: d.email.trim().toLowerCase(), website: webUrl(d.website),
          google_maps_url: webUrl(d.google_maps_url), google_reviews_url: webUrl(d.google_reviews_url), short_description: d.short_description.trim(), deal: d.deal.trim(),
          jobs: String(d.jobsTxt || '').split(',').map((x) => x.trim()).filter(Boolean), hours: d.hours, by_appointment: !!d.by_appointment,
          social: Object.fromEntries(SOCIAL.map(([k]) => [k, socialUrl(k, d['s_' + k])]).filter(([, x]) => x)),
          plan: d.plan, is_featured: !!d.is_featured, featured_until: d.is_featured && d.featured_until ? d.featured_until : null, is_verified: !!d.is_verified, accepts_quotes: !!d.accepts_quotes, speaks_tamil: !!d.speaks_tamil,
        }
        if (d.is_verified && !d.verified_at) Object.assign(row, { verified_at: new Date().toISOString(), verified_by: s.user.id })
        if (!d.is_verified) Object.assign(row, { verified_at: null, verified_by: null })
        let bid = id
        if (!bid) {
          bid = (await run(sb().from('businesses').insert({ ...row, is_hidden: true, source: d.source || 'Admin', tone: TONES[Math.floor(Math.random() * 8)][1], seed: Math.floor(Math.random() * 2 ** 31) }).select('id')))[0].id
        }
        // photos: add new ones first, hide if needed, then remove, then order
        const old = id ? (byId[id]?.photos || []) : []
        const keep = d.photos
        for (const p of keep.filter((p) => !p.id)) p.id = (await run(sb().from('business_photos').insert({ business_id: bid, storage_path: p.path, sort: 1000 + keep.indexOf(p), alt: p.alt || row.name }).select('id')))[0].id
        if (id && d.is_hidden && !byId[id].is_hidden) await run(sb().from('businesses').update({ is_hidden: true }).eq('id', bid))
        const gone = old.filter((o) => !keep.some((p) => p.id === o.id))
        for (const o of gone) await run(sb().from('business_photos').delete().eq('id', o.id))
        for (const [i, p] of keep.entries()) await run(sb().from('business_photos').update({ sort: i }).eq('id', p.id))
        await run(sb().from('businesses').update({ ...row, is_hidden: !!d.is_hidden }).eq('id', bid))
        await removeFiles(gone.map((o) => o.storage_path).filter((p) => !keep.some((k) => k.path === p)))
        if (d._claimId) await run(sb().from('claims').update({ business_id: bid, status: 'approved', reviewed_by: s.user.id, reviewed_at: new Date().toISOString() }).eq('id', d._claimId))
        if (d._subId) await run(sb().from('submissions').update({ status: 'approved' }).eq('id', d._subId))
        finish(`${row.name} ${d.is_hidden ? 'saved (hidden)' : 'saved · live on the site'}`, ['biz', 'colls', 'journeys', 'claims', 'subs'])
      } else if (type === 'event') {
        need(d.title.trim(), 'Give the event a title.')
        need(d.date, 'Pick the date.')
        need(d.st, 'Pick the start time.')
        need(d.venue.trim(), 'Add the venue.')
        need(!d.ticket_url || /^https?:\/\//.test(webUrl(d.ticket_url)), 'The ticket link must be a web address.')
        const starts = torontoToISO(`${d.date}T${d.st}`)
        let ends = d.en ? torontoToISO(`${d.endDate || d.date}T${d.en}`) : null
        if (ends && ends < starts && !d.endDate) ends = new Date(new Date(ends).getTime() + 86400e3).toISOString()
        const row = { title: d.title.trim(), slug: slugify(d.slug || d.title), type: d.type, neighbourhood_key: d.neighbourhood_key || null, starts_at: starts, ends_at: ends, venue: d.venue.trim(), address: d.address.trim(), price: Math.max(0, +d.price || 0), description: d.description.trim(), ticket_url: webUrl(d.ticket_url), tone: d.tone, sold_out: !!d.sold_out, is_hidden: !!d.is_hidden }
        const eid = id ? (await run(sb().from('events').update(row).eq('id', id)), id) : (await run(sb().from('events').insert(row).select('id')))[0].id
        const old = id ? st.events.find((e) => e.id === id)?.photos || [] : []
        for (const p of d.photos.filter((p) => !p.id)) p.id = (await run(sb().from('event_photos').insert({ event_id: eid, storage_path: p.path, sort: 0, alt: row.title }).select('id')))[0].id
        const gone = old.filter((o) => !d.photos.some((p) => p.id === o.id))
        for (const o of gone) await run(sb().from('event_photos').delete().eq('id', o.id))
        for (const [i, p] of d.photos.entries()) await run(sb().from('event_photos').update({ sort: i }).eq('id', p.id))
        await removeFiles(gone.map((o) => o.storage_path))
        if (d._subId) await run(sb().from('submissions').update({ status: 'approved' }).eq('id', d._subId))
        finish(`${row.title} saved`, ['events', 'subs'])
      } else if (type === 'article') {
        need(d.title.trim(), 'Give the story a headline.')
        need(!d.sponsored || d.sponsor_name.trim(), 'A sponsored story must name its sponsor.')
        need(d.is_hidden || d.photos.length, 'Add a main photo before publishing, or tick “Hidden from the site”.')
        const row = {
          section: d.section, title: d.title.trim(), slug: slugify(d.slug || d.title), dek: d.dek.trim(), body: markupToBlocks(d.text), hero_image: d.photos[0]?.path || '', hero_alt: d.hero_alt.trim() || d.title.trim(),
          hero_caption: d.hero_caption.trim(), hero_credit: d.hero_credit.trim(), tags: String(d.tagsTxt || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean), neighbourhood: d.neighbourhood, author: d.author.trim() || 'TamilTO',
          publish_at: torontoToISO(`${d.pdate || ymdTO()}T${d.ptime || '09:00'}`), sponsored: !!d.sponsored, sponsor_name: d.sponsored ? d.sponsor_name.trim() : '', sponsor_url: d.sponsored ? webUrl(d.sponsor_url) : '',
          is_featured: !!d.is_featured, is_trending: !!d.is_trending, is_hidden: !!d.is_hidden,
        }
        if (id) await run(sb().from('articles').update(row).eq('id', id))
        else await run(sb().from('articles').insert(row))
        const old = id && st.articles.find((a) => a.id === id)?.hero_image
        if (old && old !== row.hero_image) await removeFiles([old])
        finish(`${row.title} ${row.is_hidden ? 'saved as a draft' : row.publish_at > new Date().toISOString() ? 'scheduled for ' + when(row.publish_at) : 'published'}`, ['articles'])
      } else if (type === 'coll') {
        need(d.title.trim(), 'Give the list a title.')
        need(d.ids.length, 'Add at least one business.')
        const row = { title: d.title.trim(), slug: slugify(d.slug || d.title), curated_by: d.curated_by.trim() || 'The TamilTO team', description: d.description.trim(), is_hidden: !!d.is_hidden }
        const cid = id ? (await run(sb().from('collections').update(row).eq('id', id)), id) : (await run(sb().from('collections').insert({ ...row, sort: st.colls.length }).select('id')))[0].id
        await run(sb().from('collection_items').delete().eq('collection_id', cid))
        await run(sb().from('collection_items').insert(d.ids.map((b, i) => ({ collection_id: cid, business_id: b, sort: i }))))
        finish(`${row.title} saved`, ['colls'])
      } else if (type === 'journey') {
        need(d.title.trim(), 'Give it a title.')
        need(d.steps.length, 'Add at least one step.')
        need(d.steps.every((x) => x.t.trim()), 'Every step needs a title.')
        const row = { title: d.title.trim(), slug: slugify(d.slug || d.title), tamil_name: d.tamil_name.trim(), quote_label: d.quote_label.trim() || 'Quote request', description: d.description.trim(), tone: d.tone, is_hidden: !!d.is_hidden }
        const jid = id ? (await run(sb().from('journeys').update(row).eq('id', id)), id) : (await run(sb().from('journeys').insert({ ...row, sort: st.journeys.length }).select('id')))[0].id
        const oldSteps = id ? (st.journeys.find((j) => j.id === id)?.journey_steps || []) : []
        for (const o of oldSteps) if (!d.steps.some((x) => x.id === o.id)) await run(sb().from('journey_steps').delete().eq('id', o.id))
        for (const [i, x] of d.steps.entries()) {
          const data = { journey_id: jid, sort: i, when_label: x.when.trim(), title: x.t.trim(), tip: x.d.trim() }
          const sid = x.id ? (await run(sb().from('journey_steps').update(data).eq('id', x.id)), x.id) : (await run(sb().from('journey_steps').insert(data).select('id')))[0].id
          await run(sb().from('journey_step_businesses').delete().eq('step_id', sid))
          if (x.ids.length) await run(sb().from('journey_step_businesses').insert(x.ids.map((b, k) => ({ step_id: sid, business_id: b, sort: k }))))
        }
        finish(`${row.title} saved`, ['journeys'])
      } else if (type === 'story') {
        need(d.label.trim(), 'Give the story a name.')
        need(d.slides.length, 'Add at least one slide.')
        need(d.slides.every((x) => x.title && x.title.trim()), 'Every slide needs a headline.')
        need(d.slides.every((x) => !x.href || /^(https?:\/\/|\/|#)/.test(x.href.trim())), 'Button links must start with https:// or / (a page on TamilTO).')
        const row = { label: d.label.trim(), tone: d.tone, is_hidden: !!d.is_hidden, slides: d.slides.map((x) => ({ photo: x.photo || '', kicker: (x.kicker || '').trim(), title: x.title.trim(), text: (x.text || '').trim(), href: (x.href || '').trim().replace(/^#\//, '/'), cta: (x.cta || '').trim() })) }
        if (id) await run(sb().from('home_stories').update(row).eq('id', id))
        else await run(sb().from('home_stories').insert({ ...row, sort: st.stories.length }))
        finish(`${row.label} saved`, ['stories'])
      } else if (type === 'cat') {
        need(d.label.trim(), 'Give the category a name.')
        if (id) await run(sb().from('categories').update({ label: d.label.trim(), colour: d.colour.toUpperCase() }).eq('key', id))
        else {
          let key = slugify(d.label).slice(0, 30) || 'category', n = 2
          while (cats.some((c) => c.key === key)) key = slugify(d.label).slice(0, 26) + '-' + n++
          await run(sb().from('categories').insert({ key, label: d.label.trim(), colour: d.colour.toUpperCase(), sort: cats.length }))
        }
        finish(`${d.label.trim()} saved`, ['cats'])
      } else if (type === 'hood') {
        need(d.tagline.trim(), 'Add a tagline.')
        await run(sb().from('neighbourhoods').update({ tagline: d.tagline.trim(), description: d.description.trim() }).eq('key', id))
        finish(`${d.name} saved`, ['hoods'])
      } else if (type === 'mitem') {
        const kind = d._kind, K = MK[kind], prev = id ? (st.mkt || []).find((x) => x.id === id) : null
        const data = fromDraft(kind, d, prev ? { id: prev.data?.id } : {})
        need(!d.expires_on || /^\d{4}-\d{2}-\d{2}$/.test(d.expires_on), 'Pick a full date.')
        if (K.slugFrom && !data.id) {
          let key = slugify(data[K.slugFrom]).slice(0, 40) || kind, n = 2
          while (mkOf(kind).some((x) => x.data?.id === key)) key = slugify(data[K.slugFrom]).slice(0, 36) + '-' + n++
          data.id = key
        }
        if (!data.id) delete data.id
        const row = { kind, data, slug: data.id || slugify(K.title(data, (x) => x, (x) => x) || '').slice(0, 60), is_hidden: !!d.is_hidden, expires_on: d.expires_on || null }
        if (id) await run(sb().from('market_items').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id))
        else await run(sb().from('market_items').insert({ ...row, sort: mkOf(kind).length, submission_id: d._subId || null }))
        if (d._subId) await run(sb().from('submissions').update({ status: 'approved' }).eq('id', d._subId))
        finish(`${(K.title(data, (x) => x, (x) => bySlug[x]?.name || x) || K.one)} saved`, ['mkt', ...(d._subId ? ['subs'] : [])])
      } else {
        const put = (key, value) => run(sb().from('site_settings').upsert({ key, value }))
        const txt = (k) => String(d[k] || '').trim()
        if (type === 'mpage') { need(txt('title') && txt('lead'), 'Add a title and intro text.'); await put('pages', { ...(RS.pages || {}), [id]: { kick: txt('kick'), ta: txt('ta'), title: txt('title'), lead: txt('lead') } }) }
        if (type === 'mnotice') await put('notices', { requests: txt('requests'), creators: txt('creators'), partners: txt('partners'), sponsored: txt('sponsored') })
        if (type === 'mnews') { need(txt('t') && txt('d'), 'Add a title and text.'); await put('newsletter', { t: txt('t'), d: txt('d'), sponsor: txt('sponsor') }) }
        if (type === 'mawards') {
          const cats2 = txt('cats').split('\n').map((x) => x.split('|').map((y) => y.trim())).filter((x) => x[0] && x[1]).map(([cid, t2, kw, neg, sponsor]) => ({ id: slugify(cid).slice(0, 40), t: t2, kw: kw || '', ...(neg ? { neg } : {}), ...(sponsor ? { sponsor } : {}) }))
          need(cats2.length, 'Add at least one category: code | name | keywords')
          need(new Set(cats2.map((c) => c.id)).size === cats2.length, 'Two categories have the same code.')
          const old = (RS.awards && RS.awards.cats) || []
          await put('awards', { year: txt('year'), stage: txt('stage'), voting: !!d.voting, dates: txt('dates').split('\n').map((x) => x.trim()).filter(Boolean).join('|'), cats: cats2.map((c) => ({ ...(old.find((o) => o.id === c.id)?.ids ? { ids: old.find((o) => o.id === c.id).ids } : {}), ...c })) })
        }
        if (type === 'sitehero') { need(d.a.trim() && d.b.trim() && d.sub.trim(), 'Fill in all three boxes.'); await put('hero', { a: d.a.trim(), b: d.b.trim(), sub: d.sub.trim() }) }
        if (type === 'siteex') { const L2 = d.list.split('\n').map((x) => x.trim()).filter(Boolean); need(L2.length, 'Add at least one suggestion.'); await put('searchExamples', L2) }
        if (type === 'siteperks' || type === 'sitehow') {
          const L2 = d.list.split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf('|'); return i < 0 ? { t: x, d: '' } : { t: x.slice(0, i).trim(), d: x.slice(i + 1).trim() } })
          need(L2.length, 'Add at least one line.')
          await put(type === 'siteperks' ? 'perks' : 'how', L2)
        }
        if (type === 'plan') {
          need(d.name.trim(), 'Give the plan a name.')
          const P = settings.plans.map((p) => (p.key === id ? { key: id, name: d.name.trim(), monthly: Math.max(0, +d.monthly || 0), yearly: Math.max(0, +d.yearly || 0), description: d.description.trim(), features: String(d.features || '').split('\n').map((x) => x.trim()).filter(Boolean) } : p))
          await put('plans', P)
        }
        finish(`${type === 'mpage' ? PAGE_NAMES[id] + ' intro' : NOUN[type][0].toUpperCase() + NOUN[type].slice(1)}${type === 'plan' ? ' “' + d.name.trim() + '”' : ''} saved`, ['settings'])
      }
    } catch (e) {
      fail(e.form ? e.message : friendly(e))
    }
  }
  function finish(msg, keys) {
    setEdit((x) => ({ ...x, savedOk: true }))
    setEdit(null)
    done(msg, keys).catch((e) => flash('⚠ ' + e.message))
  }

  return <View {...v} />
}

// Defaults are re-exported so the Site content tab can show them before anything is saved.
export { HERO, PERKS, HOW, PLANS, EXAMPLES }
