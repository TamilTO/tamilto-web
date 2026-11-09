'use client'
// The TamilTO frame: header, footer, background, shortlist drawer, quote requests,
// Stories viewer and toasts, plus the visitor's saved state (kept in their browser).
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Background } from './canvas'
import { openStatus, enc } from '@/lib/tto'
import { track as plausible } from '@/lib/client'
import { CookiePrefsButton } from '@/components/ConsentBanner'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const load = (k, d) => { try { const v = localStorage.getItem('tto2-' + k); return v ? JSON.parse(v) : d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem('tto2-' + k, JSON.stringify(v)) } catch {} }

/** First-party activity counting (stored without names, phone numbers or IP addresses). */
export function track(kind, businessId = '', extra = '', ref = '') {
  try {
    const body = JSON.stringify({ kind, businessId, extra, ref, path: location.pathname })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
  } catch {}
}

export function AppProvider({ index, children }) {
  const byId = useMemo(() => Object.fromEntries(index.map((b) => [b.id, b])), [index])
  const [theme, setThemeS] = useState('dark')
  const [saved, setSaved] = useState([])
  const [plan, setPlan] = useState([])
  const [recd, setRecd] = useState([])
  const [toast, setToast] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [quote, setQuote] = useState(null)
  const [story, setStory] = useState(null)
  const [listName, setListName] = useState('My TamilTO shortlist')
  const tRef = useRef(0)

  useEffect(() => {
    setThemeS(document.documentElement.getAttribute('data-theme') || 'dark')
    setSaved(load('saved', []).filter((id) => byId[id]))
    setPlan(load('plan', []))
    setRecd(load('recd', []))
  }, [byId])

  const flash = useCallback((m) => { clearTimeout(tRef.current); setToast(m); tRef.current = setTimeout(() => setToast(''), 2800) }, [])
  const setTheme = useCallback((t) => { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('tto-theme', t) } catch {} setThemeS(t) }, [])
  const toggleSave = useCallback((id) => {
    setSaved((s) => {
      const on = s.includes(id), next = on ? s.filter((x) => x !== id) : [...s, id]
      save('saved', next)
      if (!on) { track('save', id); flash(`Saved to your shortlist (${next.length})`) }
      return next
    })
  }, [flash])
  const saveMany = useCallback((ids) => { setSaved((s) => { const next = [...new Set([...s, ...ids])]; save('saved', next); return next }); flash(`Saved ${ids.length} spots to your shortlist`) }, [flash])
  const clearSaved = useCallback(() => { setSaved([]); save('saved', []) }, [])
  const togglePlan = useCallback((id) => { setPlan((p) => { const next = p.includes(id) ? p.filter((x) => x !== id) : [...p, id]; save('plan', next); return next }) }, [])
  const toggleRec = useCallback((id) => { setRecd((r) => { const next = r.includes(id) ? r.filter((x) => x !== id) : [...r, id]; save('recd', next); return next }) }, [])
  const openQuote = useCallback((ids, kind) => {
    const q = ids.filter((id) => byId[id]?.acceptsQuotes)
    const list = q.length ? q : ids
    setQuote({ ids: list, on: list, kind: kind || 'Quote request', done: false, doneN: '', sending: false, error: '' })
    setDrawer(false)
  }, [byId])

  // Count taps on WhatsApp, phone, email, maps and outside links (same rules as the prototype).
  const pathname = usePathname()
  useEffect(() => {
    const onClk = (e) => {
      const a = e.target?.closest?.('a[href]'); if (!a) return
      const h = a.getAttribute('href') || '', p = location.pathname.split('/').filter(Boolean), cur = p[0] === 'b' ? p[1] : ''
      const phId = (n) => index.find((b) => b.phone === n || b.cell === n)?.id || ''
      let m
      if ((m = h.match(/wa\.me\/1?(\d{10})/))) { track('whatsapp', phId(m[1]) || cur); plausible('Directory WhatsApp') }
      else if (/wa\.me\/\?/.test(h)) { track('share', cur, p.join('/')); plausible('Share', { network: 'whatsapp' }) }
      else if ((m = h.match(/^tel:\+?1?(\d{10})/))) { track('call', phId(m[1]) || cur); plausible('Directory Call') }
      else if (/^mailto:/.test(h)) track('email', cur)
      else if (/google\.[a-z.]+\/maps|maps\.app\.goo|goo\.gl\/maps/.test(h)) { track('directions', cur); plausible('Directory Map') }
      else if (/g\.page|review/.test(h)) track('reviews', cur)
      else if (cur && (m = h.match(/(instagram|facebook|tiktok|youtube|x\.com|twitter|linkedin)/))) { track('social', cur, m[1]); plausible('Directory Social') }
      else if (cur && /^https?:/.test(h)) { track('website', cur, h); plausible('Directory Website') }
    }
    document.addEventListener('click', onClk, true)
    return () => document.removeEventListener('click', onClk, true)
  }, [index])
  const lastPath = useRef('')
  useEffect(() => {
    const p = pathname.split('/').filter(Boolean)
    // Where this view came from: the previous TamilTO page, or the website/app that sent them here.
    const ref = lastPath.current ? location.origin + lastPath.current : document.referrer
    lastPath.current = pathname
    track('view', p[0] === 'b' ? p[1] : '', '', ref)
  }, [pathname])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (story) setStory(null); else if (quote) setQuote(null); else if (drawer) setDrawer(false) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [story, quote, drawer])

  const value = { index, byId, theme, setTheme, saved, toggleSave, saveMany, clearSaved, plan, togglePlan, recd, toggleRec, toast, flash, drawer, setDrawer, quote, setQuote, openQuote, story, setStory, listName, setListName }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const T = "var(--display)"
const Wordmark = ({ size = 30, slit = false }) => (
  <span style={{ fontFamily: T, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: '-.01em', display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap' }}>
    <span>Tamil</span>
    <svg viewBox="0 -42 64 142" aria-hidden="true" style={{ height: '1.18em', width: '.53em', overflow: 'visible', margin: '0 .015em 0 .035em', color: 'var(--red)', flexShrink: 0 }}>
      <path fill="currentColor" fillRule={slit ? 'evenodd' : undefined} d={'M31 -42H33L34.2 -10H29.8Z M29.5 -4H34.5V0H29.5Z M9.5 0H54.5A9.5 9.5 0 0 1 54.5 19H9.5A9.5 9.5 0 0 1 9.5 0Z M15 19H49L46 26H18Z M23 26H41L45 100H19Z' + (slit ? ' M31 33H33V94H31Z' : '')} />
      <path fill="var(--mari)" d="M29 -12H35Q37 -12 37 -10V-6Q37 -4 35 -4H29Q27 -4 27 -6V-10Q27 -12 29 -12Z" />
    </svg>
    <span style={{ color: 'var(--red)' }}>O</span>
  </span>
)

const NAV = [['Directory', '/directory', ['/directory', '/b/', '/n/', '/c/']], ['Plan an event', '/plan', ['/plan', '/journey', '/v/weddings']], ['Requests', '/requests', ['/requests']], ['Events', '/events', ['/events']], ['Eat', '/eat', ['/eat']], ['Culture', '/culture', ['/culture', '/people', '/guides']], ['More', '/more', ['/more', '/v/', '/creators', '/awards', '/jobs', '/classifieds', '/deals', '/partners', '/advertise']]]

export function Header() {
  const app = useApp()
  const path = usePathname()
  const dark = app.theme !== 'light'
  const n = app.saved.length
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--glass)', backdropFilter: 'blur(18px) saturate(150%)', WebkitBackdropFilter: 'blur(18px) saturate(150%)', borderBottom: '1px solid var(--line)' }}>
      <div className="tto-head" style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(12px,3vw,32px)', minHeight: 64, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/" aria-label="TamilTO home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'var(--ink)', flexShrink: 0 }}><Wordmark /></Link>
        <span className="tto-head-gap" style={{ flex: 1, display: 'none' }} />
        <nav aria-label="Main" className="tto-nav" style={{ flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', display: 'flex', WebkitMaskImage: 'linear-gradient(90deg,#000 calc(100% - 24px),transparent)', maskImage: 'linear-gradient(90deg,#000 calc(100% - 24px),transparent)', paddingRight: 20 }}>
          <div style={{ display: 'flex', gap: 2, width: 'max-content', margin: '0 auto' }}>
            {NAV.map(([label, href, match]) => {
              const on = path === href || match.some((m) => path.startsWith(m))
              return (
                <Link key={href} href={href} aria-current={on ? 'page' : undefined} style={{ flexShrink: 0, whiteSpace: 'nowrap', minHeight: 40, display: 'inline-flex', alignItems: 'center', padding: '0 clamp(8px,1vw,14px)', borderRadius: 999, textDecoration: 'none', fontWeight: 800, fontSize: 'clamp(13px,1.1vw,14px)', color: on ? 'var(--bg)' : 'var(--ink)', background: on ? 'var(--ink)' : 'transparent' }}>{label}</Link>
              )
            })}
          </div>
        </nav>
        <Link href="/business" style={{ flexShrink: 0, minHeight: 42, display: 'inline-flex', alignItems: 'center', padding: '0 14px', borderRadius: 999, border: '1.5px solid var(--mari)', color: 'var(--ink)', fontWeight: 800, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>For businesses</Link>
        <button type="button" onClick={() => app.setDrawer(true)} aria-label={`Your shortlist, ${n} saved`} style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: '1px solid var(--line2)', background: 'var(--glass2)', color: 'var(--red)', fontSize: 19, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          ♥{n > 0 && <span style={{ position: 'absolute', right: -4, top: -4, minWidth: 20, height: 20, padding: '0 5px', borderRadius: 99, background: 'var(--act)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{n}</span>}
        </button>
        <button type="button" onClick={() => app.setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 999, border: '1px solid var(--line2)', background: 'var(--glass2)', color: 'var(--ink)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" /></svg>
          )}
        </button>
      </div>
    </header>
  )
}

const fl = { color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }
const fh = { fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink2)' }
const col = { display: 'flex', flexDirection: 'column', gap: 10 }

export function Footer() {
  return (
    <footer style={{ position: 'relative', marginTop: 48, background: 'var(--glass)', borderTop: '1px solid var(--line)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px clamp(16px,4vw,32px) 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Wordmark size={52} slit />
            <span style={{ color: 'var(--ink2)', fontSize: 16 }}>The pulse of Tamil Toronto.</span>
          </div>
          <Link href="/business" style={{ minHeight: 48, display: 'inline-flex', alignItems: 'center', padding: '0 22px', borderRadius: 999, background: 'var(--mari)', color: '#1A1410', fontWeight: 800, textDecoration: 'none' }}>List your business, free</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,160px),1fr))', gap: 22, borderTop: '1px solid var(--line)', paddingTop: 22 }}>
          <div style={col}><strong style={fh}>Find</strong><Link href="/directory" style={fl}>Directory</Link><Link href="/directory?view=map" style={fl}>Live map</Link><Link href="/journey" style={fl}>Life moments</Link><Link href="/plan" style={fl}>Plan an event</Link><Link href="/requests" style={fl}>Customer requests</Link></div>
          <div style={col}><strong style={fh}>Community</strong><Link href="/jobs" style={fl}>Jobs</Link><Link href="/classifieds" style={fl}>Classifieds</Link><Link href="/deals" style={fl}>Deals</Link><Link href="/creators" style={fl}>Creators</Link><Link href="/awards" style={fl}>Best of awards</Link></div>
          <div style={col}><strong style={fh}>Read</strong><Link href="/eat" style={fl}>Eat</Link><Link href="/events" style={fl}>Events</Link><Link href="/culture" style={fl}>Culture</Link><Link href="/submit" style={fl}>Submit a tip</Link></div>
          <div style={col}><strong style={fh}>Businesses</strong><Link href="/business#claim" style={fl}>Claim your listing</Link><Link href="/business#pricing" style={fl}>Pricing</Link><Link href="/advertise" style={fl}>Advertise</Link><Link href="/partners" style={fl}>Trusted partners</Link></div>
          <div style={col}><strong style={fh}>TamilTO</strong><Link href="/about" style={fl}>About</Link><Link href="/editorial-policy" style={fl}>Editorial policy</Link><a href="mailto:hello@tamilto.com" style={fl}>hello@tamilto.com</a></div>
          <div style={col}><strong style={fh}>Follow</strong><a href="https://instagram.com/tamilto" target="_blank" rel="noopener noreferrer" style={fl}>Instagram</a><a href="https://tiktok.com/@tamilto" target="_blank" rel="noopener noreferrer" style={fl}>TikTok</a></div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', fontSize: 13, color: 'var(--ink2)' }}>
          <span>© {new Date().getFullYear()} TamilTO Media · Independent, never political · Listings compiled from public business information. Owners can claim, correct or remove theirs.</span>
          <span style={{ flex: 1 }} />
          <CookiePrefsButton />
        </div>
      </div>
    </footer>
  )
}

const inp = { minHeight: 48, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--line2)', background: 'var(--glass2)', color: 'var(--ink)' }
const lab = { display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, fontSize: 14 }

function QuoteModal() {
  const app = useApp()
  const q = app.quote
  if (!q) return null
  const close = () => app.setQuote(null)
  const vendors = q.ids.map((id) => app.byId[id]).filter(Boolean)
  const n = q.on.length
  const submit = async (e) => {
    e.preventDefault()
    if (!n || q.sending) return
    const fd = new FormData(e.target)
    const body = { kind: q.kind, businessIds: q.on, name: fd.get('name'), phone: fd.get('phone'), eventDate: fd.get('date'), guests: fd.get('guests'), message: fd.get('msg'), sourcePage: location.pathname, company_website: fd.get('company_website') }
    app.setQuote({ ...q, sending: true, error: '' })
    try {
      const r = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'We couldn’t send that. Please try again.')
      q.on.forEach((id) => track('quote', id, q.kind))
      plausible('Quote Request', { vendors: n })
      app.setQuote({ ...q, done: true, sending: false, doneN: n === 1 ? app.byId[q.on[0]].name : `${n} businesses` })
    } catch (err) {
      app.setQuote({ ...q, sending: false, error: err.message })
    }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="quote-h" style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(8,6,4,.7)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', padding: 12, overflowY: 'auto' }}>
      <div style={{ width: 'min(100%,600px)', maxHeight: '94vh', overflowY: 'auto', padding: 'clamp(18px,4vw,30px)', borderRadius: 26, background: 'var(--solid)', border: '1px solid var(--line2)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
          <h2 id="quote-h" style={{ margin: 0, flex: 1, fontFamily: T, fontWeight: 900, fontSize: 'clamp(32px,4vw,44px)', lineHeight: 0.95 }}>{q.done ? 'Request sent' : q.kind}</h2>
          <button type="button" onClick={close} aria-label="Close" style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 99, border: '1px solid var(--line2)', background: 'transparent', color: 'var(--ink)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {!q.done ? (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <legend style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, whiteSpace: 'nowrap', padding: 0 }}>Send to</legend>
              {vendors.map((v) => {
                const on = q.on.includes(v.id)
                return (
                  <label key={v.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--line2)', fontWeight: 700, cursor: 'pointer' }}>
                    <input type="checkbox" checked={on} onChange={() => app.setQuote({ ...q, on: on ? q.on.filter((x) => x !== v.id) : [...q.on, v.id] })} style={{ width: 20, height: 20, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}><span>{v.name}</span><span style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink2)' }}>{v.catLabel}</span></span>
                  </label>
                )
              })}
            </fieldset>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,170px),1fr))', gap: 10 }}>
              <label style={lab}>Your name<input name="name" required autoComplete="name" maxLength={80} style={inp} /></label>
              <label style={lab}>WhatsApp or phone<input name="phone" required type="tel" autoComplete="tel" maxLength={30} style={inp} /></label>
              <label style={lab}>Date<input name="date" type="date" style={inp} /></label>
              <label style={lab}>Guests<input name="guests" inputMode="numeric" placeholder="e.g. 400" maxLength={6} style={inp} /></label>
            </div>
            <label style={lab}>What do you need?<textarea name="msg" rows={3} maxLength={2000} placeholder="Menu ideas, budget, venue…" style={{ ...inp, padding: '12px 14px', resize: 'vertical' }} /></label>
            <input name="company_website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <span style={{ fontSize: 13, color: 'var(--ink2)' }}>Your details go only to the businesses you tick. They reply on WhatsApp or by phone.</span>
            {q.error && <span role="alert" style={{ color: 'var(--red)', fontWeight: 700 }}>{q.error}</span>}
            <button type="submit" disabled={!n || q.sending} style={{ minHeight: 52, borderRadius: 999, border: 0, background: 'var(--act)', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', opacity: n && !q.sending ? 1 : 0.5 }}>
              {q.sending ? 'Sending…' : n ? `Send to ${n} ${n === 1 ? 'business' : 'businesses'}` : 'Tick at least one business'}
            </button>
          </form>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>Sent to <strong>{q.doneN}</strong>. Expect replies on WhatsApp, usually within a day. Nandri!</p>
            <Link href="/directory" onClick={close} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink2)' }}>Browse more businesses →</Link>
            <button type="button" onClick={close} style={{ alignSelf: 'flex-start', minHeight: 48, padding: '0 22px', borderRadius: 999, border: 0, background: 'var(--ink)', color: 'var(--bg)', fontWeight: 800, cursor: 'pointer' }}>Done</button>
          </>
        )}
      </div>
    </div>
  )
}

function Drawer() {
  const app = useApp()
  if (!app.drawer) return null
  const close = () => app.setDrawer(false)
  const items = app.saved.map((id) => app.byId[id]).filter(Boolean)
  const quotable = items.filter((b) => b.acceptsQuotes)
  const share = 'https://wa.me/?text=' + enc(`${app.listName}, from TamilTO:\n` + items.map((b) => `• ${b.name}${b.phone ? ' ' + b.phone : ''}`).join('\n'))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', justifyContent: 'flex-end' }}>
      <button type="button" onClick={close} aria-label="Close shortlist" style={{ position: 'absolute', inset: 0, border: 0, background: 'rgba(8,6,4,.55)', cursor: 'pointer' }} />
      <aside role="dialog" aria-modal="true" aria-labelledby="sl-h" style={{ position: 'relative', width: 'min(100%,420px)', height: '100%', overflowY: 'auto', padding: 22, background: 'var(--solid)', borderLeft: '1px solid var(--line2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 id="sl-h" style={{ margin: 0, flex: 1, fontFamily: T, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>Your shortlist</h2>
          <button type="button" onClick={close} aria-label="Close" style={{ width: 44, height: 44, borderRadius: 99, border: '1px solid var(--line2)', background: 'transparent', color: 'var(--ink)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        {!items.length ? (
          <p style={{ margin: 0, color: 'var(--ink2)', fontSize: 16, lineHeight: 1.5 }}>Tap ♡ on any business to save it here. Then share the whole list to the family group chat.</p>
        ) : (
          <>
            <label style={lab}>List name<input value={app.listName} onChange={(e) => app.setListName(e.target.value)} style={{ ...inp, minHeight: 46 }} /></label>
            {items.map((v) => {
              const st = openStatus(v)
              return (
                <div key={v.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, borderRadius: 16, border: '1px solid var(--line)' }}>
                  <Link href={'/b/' + v.id} onClick={close} aria-label={v.name} style={{ flex: '0 0 52px', height: 52, borderRadius: 12, backgroundColor: v.tone }} />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <Link href={'/b/' + v.id} onClick={close} style={{ fontWeight: 800, color: 'var(--ink)', textDecoration: 'none' }}>{v.name}</Link>
                    <span style={{ fontSize: 12, fontWeight: 700, color: st.open ? 'var(--green)' : 'var(--ink2)' }}>{st.text}</span>
                  </span>
                  <button type="button" onClick={() => app.toggleSave(v.id)} aria-label={'Remove ' + v.name} style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: 'transparent', color: 'var(--red)', fontSize: 18, cursor: 'pointer' }}>♥</button>
                </div>
              )
            })}
            <a href={share} target="_blank" rel="noopener noreferrer" style={{ minHeight: 50, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: '#1F7A4D', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>Share list on WhatsApp</a>
            {quotable.length > 0 && <button type="button" onClick={() => app.openQuote(quotable.map((b) => b.id))} style={{ minHeight: 50, borderRadius: 999, border: 0, background: 'var(--act)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Request quotes from {quotable.length}</button>}
            <button type="button" onClick={app.clearSaved} style={{ alignSelf: 'flex-start', border: 0, background: 'none', color: 'var(--ink2)', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Clear list</button>
          </>
        )}
      </aside>
    </div>
  )
}

function StoryViewer() {
  const app = useApp()
  const s = app.story
  const down = useRef(0)
  useEffect(() => {
    if (!s) return
    const t = setTimeout(() => step(1), 5000)
    const onKey = (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1) }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  })
  if (!s) return null
  const rings = s.rings
  const ring = rings[s.ring], sl = ring.slides[s.slide]
  function step(dir) {
    let r = s.ring, i = s.slide + dir
    if (i >= rings[r].slides.length) { r++; i = 0 } else if (i < 0) { r--; i = r >= 0 ? rings[r].slides.length - 1 : 0 }
    if (r < 0 || r >= rings.length) return app.setStory(null)
    app.setStory({ ...s, ring: r, slide: i })
  }
  const ringStep = (dir) => { const r = s.ring + dir; if (r < 0 || r >= rings.length) return app.setStory(null); app.setStory({ ...s, ring: r, slide: 0 }) }
  const close = () => app.setStory(null)
  const photo = /^url/.test(sl.bgImg || '')
  return (
    <div role="dialog" aria-modal="true" aria-label={ring.label} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(8,6,4,.88)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center', padding: 12 }}>
      <div onPointerDown={(e) => { down.current = e.clientX }} onPointerUp={(e) => { const dx = e.clientX - down.current; if (Math.abs(dx) > 60) ringStep(dx < 0 ? 1 : -1) }} style={{ position: 'relative', width: 'min(100%,calc(86vh * 9 / 16),420px)', aspectRatio: '9/16', maxHeight: '92vh', borderRadius: 24, overflow: 'hidden', backgroundColor: sl.tone, backgroundImage: photo ? `linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,0) 30%,rgba(0,0,0,.75)),${sl.bgImg}` : 'radial-gradient(rgba(255,255,255,.2) 1.4px,transparent 1.8px)', backgroundSize: photo ? 'cover' : '16px 16px', backgroundPosition: 'center', color: '#fff', touchAction: 'pan-y', userSelect: 'none' }}>
        <div style={{ position: 'absolute', left: 12, right: 12, top: 12, display: 'flex', gap: 4, zIndex: 3 }}>
          {ring.slides.map((_, i) => (
            <span key={i} style={{ position: 'relative', flex: 1, height: 3, borderRadius: 9, background: 'rgba(255,255,255,.35)', overflow: 'hidden' }}>
              {i < s.slide && <span style={{ position: 'absolute', inset: 0, background: '#fff' }} />}
              {i === s.slide && <span key={s.ring + '-' + s.slide} style={{ position: 'absolute', inset: 0, background: '#fff', transformOrigin: 'left', animation: 'ttofill 5s linear forwards' }} />}
            </span>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 26, display: 'flex', alignItems: 'center', gap: 10, zIndex: 3 }}>
          <strong style={{ fontSize: 14 }}>{ring.label}</strong><span style={{ flex: 1 }} />
          <button type="button" onClick={close} aria-label="Close stories" style={{ width: 44, height: 44, borderRadius: 99, border: 0, background: 'rgba(0,0,0,.35)', color: '#fff', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <button type="button" onClick={() => step(-1)} aria-label="Previous" style={{ position: 'absolute', left: 0, top: 80, bottom: 120, width: '35%', border: 0, background: 'transparent', cursor: 'pointer', zIndex: 2 }} />
        <button type="button" onClick={() => step(1)} aria-label="Next" style={{ position: 'absolute', right: 0, top: 80, bottom: 120, width: '65%', border: 0, background: 'transparent', cursor: 'pointer', zIndex: 2 }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 22, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#FFD27A' }}>{sl.kicker}</span>
          <strong style={{ fontFamily: T, fontWeight: 900, fontSize: 'clamp(34px,5vh,48px)', lineHeight: 0.92 }}>{sl.title}</strong>
          <span style={{ fontSize: 16, lineHeight: 1.45 }}>{sl.text}</span>
          <Link href={sl.href} onClick={close} style={{ alignSelf: 'flex-start', minHeight: 46, display: 'inline-flex', alignItems: 'center', padding: '0 20px', borderRadius: 999, background: '#fff', color: '#1A1410', fontWeight: 800, textDecoration: 'none', marginTop: 4 }}>{sl.cta} →</Link>
        </div>
      </div>
    </div>
  )
}

function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  return <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 95, background: 'var(--ink)', color: 'var(--bg)', padding: '12px 20px', borderRadius: 999, fontWeight: 800, fontSize: 15, maxWidth: 'calc(100% - 32px)', textAlign: 'center', boxShadow: 'var(--shadow)' }}>{toast}</div>
}

export function Frame({ index, children }) {
  return (
    <AppProvider index={index}>
      <Background />
      <div className="tto-frame">
        <a href="#main" className="skip">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </div>
      <StoryViewer />
      <QuoteModal />
      <Drawer />
      <Toast />
    </AppProvider>
  )
}

export { Wordmark, Fragment }
