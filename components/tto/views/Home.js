'use client'
// Home page. Layout ported from TamilTO 3.0 (the HOME screen).
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import A from '../A'
import { MapCanvas, pinsFor, hoodLabelsFor } from '../canvas'
import { useSite, pic } from '../useSite'
import { FULL, proj, hexA, enc, score, QR, TONES } from '@/lib/tto'
import { eventCard } from '@/lib/tto-events'
import { articleHref } from '@/lib/site'
import { track as plausible } from '@/lib/client'
import { useMarketView } from '../useMarket'

const HERO = { a: 'Find anything Tamil in the', b: 'GTA.', sub: "Kothu at 1 AM, a saree by Sunday, a caterer for 400, a tutor who speaks Tamil. Ask the way you'd ask your cousin." }

export default function HomeView({ raw, nowAt, events: rawEvents, eat, culture, market }) {
  const { site, all, byId, app } = useSite(raw, nowAt)
  const { hReqs, hVerts, hAw, aw } = useMarketView('home', raw, market, nowAt)
  const NEWS = market.newsletter
  const router = useRouter()
  const EX = site.searchExamples
  const [ph, setPh] = useState(0)
  const [askDraft, setAskDraft] = useState('')
  const [hover, setHover] = useState(null)
  const [nl, setNl] = useState({ done: false, busy: false, err: '' })
  useEffect(() => { const t = setInterval(() => setPh((x) => x + 1), 3400); return () => clearInterval(t) }, [])

  const hero = site.hero || HERO
  const stats = { biz: all.length, open: all.filter((b) => b.isOpen).length, cats: site.categories.length, hoods: site.neighbourhoods.length }
  const askPlaceholder = 'Ask: “' + EX[ph % EX.length] + '”'
  const onAskDraft = (e) => setAskDraft(e.target.value)
  const go = (q) => router.push('/directory?q=' + enc(q))
  const askSubmit = (e) => { e.preventDefault(); go((askDraft || '').trim() || EX[ph % EX.length]) }
  const examples = EX.slice(0, 4).map((q) => ({ label: q, onClick: () => go(q) }))

  const heroCfg = { bounds: FULL, pins: all, threads: true, sel: hover }
  const heroHoods = hoodLabelsFor(FULL, site.neighbourhoods)
  const heroPins = pinsFor(FULL, all).map((p) => ({ ...p, href: p.b.href, aria: `${p.b.name}, ${p.b.catLabel}, ${p.b.hoodName}. ${p.b.status}`, hover: () => setHover(p.b.id) }))
  const unhover = () => setHover(null)
  let tip = { show: false }
  const hb = hover && byId[hover]
  if (hb) { const [x, y] = proj(FULL, hb.lng, hb.lat); tip = { show: true, x: x * 100 + '%', y: y * 100 + '%', tf: y < 0.35 ? 'translate(-50%,22px)' : 'translate(-50%,calc(-100% - 22px))', n: hb.name, sub: `${hb.catLabel} · ${hb.hoodName}`, status: hb.status, statusColor: hb.statusColor } }

  const evs = useMemo(() => rawEvents.map((e) => ({ ...eventCard(e, site.hoodByKey), ...pic(e.image) })), [rawEvents, site])
  const pick = (re, n) => all.filter((b) => re.test(b.listedAs)).sort((a, b) => score(b) - score(a)).slice(0, n)
  const rings = useMemo(() => {
    const sl = (b) => ({ kicker: b.catLabel + ' · ' + b.hoodName, title: b.name, text: b.address || b.short, tone: b.tone, bgImg: b.bgImg, bgSize: b.bgSize, href: b.href, cta: 'See ' + b.name })
    const first = site.collections[0]
    // Stories made in the admin come first; the automatic ones follow unless switched off there.
    const own = (site.stories || []).map((g) => ({
      label: g.label, c1: g.tone || '#F5B83D', c2: '#FF6B7D',
      slides: g.slides.map((x) => ({ kicker: x.kicker, title: x.title, text: x.text, tone: g.tone, bgImg: x.photo ? `url("${x.photo}")` : 'none', bgSize: 'cover', href: x.href || '/', cta: x.cta || 'Take a look' })),
    }))
    if (site.autoStories === false) return own.filter((r) => r.slides.length)
    return [...own, 
      { label: 'Wedding season', c1: '#F5C443', c2: '#E2629B', slides: (first ? first.businessIds : []).map((id) => byId[id]).filter(Boolean).map(sl) },
      { label: 'Buying a home', c1: '#F5B83D', c2: '#FF6B7D', slides: pick(/real estate agents|mortgage/i, 6).map(sl) },
      { label: 'Reno season', c1: '#A5C25A', c2: '#5EC2D1', slides: pick(/renovation|kitchen/i, 6).map(sl) },
      { label: 'Food & catering', c1: '#FF6B5E', c2: '#F59A3D', slides: pick(/cater|sweet|grocer/i, 6).map(sl) },
      { label: 'Auto', c1: '#FF9A66', c2: '#9C86F0', slides: pick(/auto|driving/i, 6).map(sl) },
      { label: 'Coming up', c1: '#F59A3D', c2: '#F5B83D', slides: evs.slice(0, 4).map((e) => ({ kicker: `${e.dow} ${e.mon} ${e.day} · ${e.hoodName}`, title: e.t, text: e.d, tone: e.tone, bgImg: e.bgImg, bgSize: e.bgSize, href: e.href, cta: 'See event' })) },
    ].filter((r) => r.slides.length)
  }, [all, byId, evs, site])
  const storyRings = rings.map((g, i) => {
    const s0 = g.slides[0], ph0 = s0 && /^url/.test(s0.bgImg || '')
    return { label: g.label, c1: g.c1, c2: g.c2, tone: s0 ? s0.tone : TONES[0], bgImg: ph0 ? s0.bgImg : 'radial-gradient(rgba(255,255,255,.22) 1.2px,transparent 1.6px)', bgSize: ph0 ? 'cover' : '9px 9px', open: () => app.setStory({ rings, ring: i, slide: 0 }) }
  })

  const catTiles = site.categories.map((c) => { const l = all.filter((b) => b.category === c.key); return { label: c.label, c: c.colour, href: '/directory?cat=' + c.key, count: l.length, open: l.filter((b) => b.isOpen).length } })
  const journeyCards = site.journeys.map((j) => ({ ...pic(j), t: j.title, ta: j.tamil, d: j.description, tone: j.tone, href: '/journey/' + j.id, meta: ((n) => `${j.steps.length} steps` + (n ? ` · ${n} business${n === 1 ? '' : 'es'}` : ''))(new Set(j.steps.flatMap((x) => x.businessIds)).size) }))
  const hoodCards = site.neighbourhoods.map((h) => { const l = all.filter((b) => b.neighbourhood === h.key); return { n: h.name, tag: h.tagline, c: h.colour, glow: hexA(h.colour, 0.35), href: '/n/' + h.key, count: l.length, open: l.filter((b) => b.isOpen).length } })
  const collCards = site.collections.map((c) => ({ t: c.title, by: c.curatedBy, d: c.description, href: '/c/' + c.id, count: c.businessIds.length, dots: c.businessIds.slice(0, 5).map((id) => ({ tone: byId[id]?.tone, ...pic(byId[id], '7px 7px') })), wa: 'https://wa.me/?text=' + enc(`${c.title}, on TamilTO:\n` + c.businessIds.map((id) => '• ' + (byId[id]?.name || '')).join('\n') + '\nhttps://tamilto.com/c/' + c.id) }))
  const homeEvents = evs.slice(0, 4)
  const art = (a) => ({ t: a.title, tag: a.sponsored ? 'Sponsored' : (a.tags && a.tags[0]) || a.category, href: articleHref(a), tone: a.hero?.tone, ...pic(a.hero, '9px 9px') })
  const teasers = [{ t: 'Eat', ta: 'சாப்பாடு', href: '/eat', items: eat.slice(0, 3).map(art) }, { t: 'Culture', ta: 'கலாச்சாரம்', href: '/culture', items: culture.slice(0, 3).map(art) }].filter((x) => x.items.length)

  const news = { ...NEWS, hasSponsor: !!NEWS.sponsor, notDone: !nl.done, done: nl.done }
  const nlSubmit = async (e) => {
    e.preventDefault()
    if (nl.busy) return
    const email = new FormData(e.target).get('email')
    setNl({ done: false, busy: true, err: '' })
    try {
      const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, placement: 'home_band' }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'That didn’t work. Please try again.')
      plausible('Newsletter Signup', { placement: 'home_band' })
      setNl({ done: true, busy: false, err: '' })
    } catch (err) { setNl({ done: false, busy: false, err: err.message }) }
  }
  const qr = QR

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "clamp(28px,5vw,64px) clamp(16px,4vw,32px) 12px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,470px),1fr))", gap: "clamp(24px,4vw,56px)", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Tamil Toronto, all in one place · <span lang="ta" style={{ fontFamily: "var(--tamil)", letterSpacing: "0" }}>தமிழ் டொராண்டோ</span></span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(56px,8.6vw,118px)", lineHeight: ".84", letterSpacing: "-.015em", textWrap: "balance" }}>{hero.a} <span style={{ color: "var(--red)" }}>{hero.b}</span></h1>
<p style={{ margin: "0", maxWidth: "560px", fontSize: "clamp(17px,1.8vw,20px)", lineHeight: "1.5", color: "var(--ink2)", textWrap: "pretty" }}>{hero.sub}</p>
<form onSubmit={askSubmit} role="search" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 7px 7px 20px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--line2)", boxShadow: "var(--shadow)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
<label htmlFor="ask-home" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Ask a cousin</label>
<input id="ask-home" type="search" value={askDraft} onChange={onAskDraft} placeholder={askPlaceholder} autoComplete="off" style={{ flex: "1", minWidth: "0", height: "50px", border: "0", background: "transparent", color: "var(--ink)", fontSize: "17px" }} />
<button type="submit" style={{ height: "50px", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", flexShrink: "0" }}>Ask</button>
</form>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
<span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>Try:</span>
{(examples).map((e, _k1) => (<Fragment key={_k1}>
<button type="button" onClick={e.onClick} style={{ minHeight: "36px", whiteSpace: "nowrap", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "13px", fontWeight: "600", cursor: "pointer", backdropFilter: "blur(10px)" }}>{e.label}</button>
</Fragment>))}
</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", fontSize: "14px", fontWeight: "700", color: "var(--ink2)" }}>
{(stats.biz > 0) ? (<span style={{ whiteSpace: "nowrap" }}><strong style={{ color: "var(--ink)", fontSize: "18px" }}>{stats.biz}</strong> <span>Tamil businesses</span></span>) : (<span style={{ whiteSpace: "nowrap" }}>New listings going live every week</span>)}
<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: "var(--green)" }}></span><strong style={{ color: "var(--ink)", fontSize: "18px" }}>{stats.cats}</strong> categories</span>
<span style={{ whiteSpace: "nowrap" }}><strong style={{ color: "var(--ink)", fontSize: "18px" }}>{stats.hoods}</strong> areas</span>
</div>
</div>
<div style={{ position: "relative", borderRadius: "28px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", aspectRatio: "4/3", boxShadow: "var(--shadow)", minWidth: "0" }}>
<MapCanvas cfg={heroCfg} site={site} />
{(heroHoods).map((h, _k2) => (<Fragment key={_k2}>
<A href={h.href} style={{ position: "absolute", left: h.x, top: h.y, transform: "translate(-50%,-190%)", padding: "5px 11px", borderRadius: "999px", background: "var(--glass2)", border: "1px solid var(--line2)", color: "var(--ink)", fontSize: "12px", fontWeight: "800", textDecoration: "none", whiteSpace: "nowrap", backdropFilter: "blur(8px)", zIndex: "2" }}>{h.n}</A>
</Fragment>))}
{(heroPins).map((p, _k3) => (<Fragment key={_k3}>
<A href={p.href} aria-label={p.aria} onMouseEnter={p.hover} onFocus={p.hover} onMouseLeave={unhover} onBlur={unhover} style={{ position: "absolute", left: p.x, top: p.y, width: "26px", height: "26px", margin: "-13px 0 0 -13px", borderRadius: "99px", zIndex: "1" }}></A>
</Fragment>))}
{(tip.show) && (<>
<div style={{ position: "absolute", left: tip.x, top: tip.y, transform: tip.tf, zIndex: "3", pointerEvents: "none", minWidth: "200px", maxWidth: "260px", padding: "12px 14px", borderRadius: "14px", background: "var(--glass2)", border: "1px solid var(--line2)", boxShadow: "var(--shadow)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "3px" }}>
<strong style={{ fontSize: "15px", lineHeight: "1.2" }}>{tip.n}</strong>
<span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{tip.sub}</span>
<span style={{ fontSize: "12px", fontWeight: "800", color: tip.statusColor }}>{tip.status}</span>
</div>
</>)}
<div style={{ position: "absolute", left: "14px", top: "14px", zIndex: "2", display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap", padding: "6px 12px", borderRadius: "999px", background: "var(--glass2)", border: "1px solid var(--line2)", fontSize: "12px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase" }}>Live GTA <span style={{ width: "7px", height: "7px", borderRadius: "99px", background: "var(--green)" }}></span><span style={{ fontWeight: "700", letterSpacing: "0", textTransform: "none", color: "var(--ink2)" }}>{stats.biz} on the map</span></div>
<A href="/directory?view=map" style={{ position: "absolute", right: "14px", bottom: "14px", zIndex: "2", minHeight: "40px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", fontSize: "13px", textDecoration: "none" }}>Explore the map →</A>
</div>
</section>
<section aria-label="Stories" style={{ maxWidth: "1320px", margin: "0 auto", padding: "28px 0 0" }}>
<div style={{ display: "flex", gap: "18px", overflowX: "auto", scrollbarWidth: "none", padding: "4px clamp(16px,4vw,32px) 8px" }}>
{(storyRings).map((s, _k4) => (<Fragment key={_k4}>
<button type="button" onClick={s.open} style={{ flex: "0 0 auto", width: "88px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "none", border: "0", color: "var(--ink)", cursor: "pointer", padding: "0" }}>
<span style={{ width: "78px", height: "78px", borderRadius: "99px", padding: "3px", background: `conic-gradient(from 210deg,${s.c1},${s.c2},${s.c1})` }}><span style={{ display: "block", width: "100%", height: "100%", borderRadius: "99px", border: "3px solid var(--bg)", backgroundColor: s.tone, backgroundImage: s.bgImg, backgroundSize: s.bgSize, backgroundPosition: "center" }}></span></span>
<span style={{ fontSize: "13px", fontWeight: "700", textAlign: "center", lineHeight: "1.2" }}>{s.label}</span>
</button>
</Fragment>))}
</div>
</section>
<section aria-labelledby="cat-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "44px clamp(16px,4vw,32px) 0" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "8px 20px", marginBottom: "18px" }}>
<h2 id="cat-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>What do you need?</h2>
<span style={{ flex: "1" }}></span>
<A href="/directory" style={{ fontWeight: "800", color: "var(--ink)" }}>Open the full directory →</A>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(46%,210px),1fr))", gap: "12px" }}>
{(catTiles).map((c, _k5) => (<Fragment key={_k5}>
<A href={c.href} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "22px", minHeight: "132px", padding: "16px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textDecoration: "none", color: "var(--ink)", transition: "transform .25s ease,border-color .25s ease,box-shadow .25s ease" }} className="x2">
<span style={{ display: "flex", alignItems: "center", gap: "6px" }}><span style={{ width: "30px", height: "6px", borderRadius: "99px", background: c.c }}></span><span style={{ width: "6px", height: "6px", borderRadius: "99px", background: c.c, opacity: ".6" }}></span></span>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}><strong style={{ fontSize: "17px", lineHeight: "1.2" }}>{c.label}</strong><span style={{ fontSize: "13px", color: "var(--ink2)", fontWeight: "600" }}>{c.count ? `${c.count} listed` : 'Coming soon'}</span></span>
</A>
</Fragment>))}
</div>
</section>
<section aria-labelledby="moments-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Life moments</span>
<h2 id="moments-h" style={{ margin: "8px 0 18px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92", maxWidth: "820px", textWrap: "balance" }}>Big day coming? We've mapped every vendor you'll need.</h2>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "16px" }}>
{(journeyCards).map((j, _k6) => (<Fragment key={_k6}>
<A href={j.href} style={{ display: "flex", flexDirection: "column", borderRadius: "24px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textDecoration: "none", color: "var(--ink)", transition: "transform .25s ease" }} className="x3">
<span style={{ position: "relative", aspectRatio: "16/9", backgroundColor: j.tone, backgroundImage: j.bgImg, backgroundSize: j.bgSize, backgroundPosition: "center", display: "flex", alignItems: "flex-end", padding: "16px" }}>
<span lang="ta" style={{ fontFamily: "var(--tamil)", fontWeight: "700", fontSize: "clamp(28px,3vw,38px)", color: "#fff", lineHeight: "1.1" }}>{j.ta}</span>
</span>
<span style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
<strong style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "32px", lineHeight: "1" }}>{j.t}</strong>
<span style={{ fontSize: "15px", lineHeight: "1.5", color: "var(--ink2)" }}>{j.d}</span>
<span style={{ fontSize: "14px", fontWeight: "800", color: "var(--mariText)" }}>{j.meta} →</span>
</span>
</A>
</Fragment>))}
</div>
</section>
<section aria-labelledby="hoods-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Neighbourhood worlds</span>
<h2 id="hoods-h" style={{ margin: "8px 0 18px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>Every corner has a personality.</h2>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "14px" }}>
{(hoodCards).map((h, _k7) => (<Fragment key={_k7}>
<A href={h.href} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "10px", padding: "20px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textDecoration: "none", color: "var(--ink)", overflow: "hidden", transition: "transform .25s ease,border-color .25s ease" }} className="x4">
<span style={{ position: "absolute", right: "-40px", top: "-40px", width: "150px", height: "150px", borderRadius: "99px", background: `radial-gradient(circle,${h.glow},transparent 70%)` }}></span>
<span style={{ width: "40px", height: "6px", borderRadius: "99px", background: h.c }}></span>
<strong style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "40px", lineHeight: ".95" }}>{h.n}</strong>
<span style={{ fontSize: "15px", color: "var(--ink2)", fontWeight: "600" }}>{h.tag}</span>
<span style={{ fontSize: "13px", fontWeight: "800" }}>{h.count ? `${h.count} businesses` : 'Coming soon'}</span>
</A>
</Fragment>))}
</div>
</section>
{(collCards.length > 0) && (<>
<section aria-labelledby="coll-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Cousin-approved</span>
<h2 id="coll-h" style={{ margin: "8px 0 18px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>Lists your group chat will steal.</h2>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "14px" }}>
{(collCards).map((c, _k8) => (<Fragment key={_k8}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "18px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<div style={{ display: "flex" }}>
{(c.dots).map((d, _k9) => (<Fragment key={_k9}><span style={{ width: "40px", height: "40px", marginRight: "-10px", borderRadius: "99px", border: "3px solid var(--solid)", backgroundColor: d.tone, backgroundImage: d.bgImg, backgroundSize: d.bgSize, backgroundPosition: "center" }}></span></Fragment>))}
</div>
<A href={c.href} style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", color: "var(--ink)", textDecoration: "none" }}>{c.t}</A>
<span style={{ fontSize: "14px", lineHeight: "1.45", color: "var(--ink2)" }}>{c.d}</span>
<span style={{ fontSize: "13px", fontWeight: "700" }}>{c.count} spots · by {c.by}</span>
<div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
<A href={c.href} style={{ flex: "1", minHeight: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Open list</A>
<A href={c.wa} target="_blank" rel="noopener noreferrer" style={{ flex: "1", minHeight: "42px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Share</A>
</div>
</div>
</Fragment>))}
</div>
</section>
</>)}
{(homeEvents.length > 0) && (<>
<section aria-labelledby="ev-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "8px 20px", marginBottom: "18px" }}>
<h2 id="ev-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>Coming up</h2>
<span style={{ flex: "1" }}></span>
<A href="/events" style={{ fontWeight: "800", color: "var(--ink)" }}>All events →</A>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "14px" }}>
{(homeEvents).map((e, _k10) => (<Fragment key={_k10}>
<A href="/events" style={{ display: "flex", gap: "14px", padding: "14px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textDecoration: "none", color: "var(--ink)" }}>
<span style={{ flexShrink: "0", width: "62px", borderRadius: "14px", background: "var(--mari)", color: "#1A1410", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0", fontSize: "11px", fontWeight: "800", letterSpacing: ".1em" }}><span>{e.dow}</span><span style={{ fontFamily: "var(--display)", fontSize: "30px", lineHeight: "1", letterSpacing: "0" }}>{e.day}</span><span>{e.mon}</span></span>
<span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "0" }}>
<strong style={{ fontSize: "16px", lineHeight: "1.25" }}>{e.t}</strong>
<span style={{ fontSize: "13px", color: "var(--ink2)", fontWeight: "600" }}>{e.time} · {e.hoodName}</span>
<span style={{ fontSize: "13px", fontWeight: "800", color: "var(--mariText)" }}>{e.priceLabel}</span>
</span>
</A>
</Fragment>))}
</div>
</section>
</>)}
{(teasers.length > 0) && (<>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "16px" }}>
{(teasers).map((x, _k11) => (<Fragment key={_k11}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "24px", borderRadius: "24px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}><A href={x.href} style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "56px", lineHeight: ".9", color: "var(--ink)", textDecoration: "none" }}>{x.t}</A><span lang="ta" style={{ fontFamily: "var(--tamil)", fontWeight: "700", color: "var(--ink2)" }}>{x.ta}</span></div>
{(x.items).map((i, _k12) => (<Fragment key={_k12}>
<A href={i.href} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}>
<span style={{ flex: "0 0 60px", height: "60px", borderRadius: "12px", backgroundColor: i.tone, backgroundImage: i.bgImg, backgroundSize: i.bgSize, backgroundPosition: "center" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mariText)" }}>{i.tag}</span><strong style={{ fontSize: "16px", lineHeight: "1.25" }}>{i.t}</strong></span>
</A>
</Fragment>))}
<A href={x.href} style={{ fontWeight: "800", color: "var(--ink)" }}>More {x.t} →</A>
</div>
</Fragment>))}
</section>
</>)}



<section aria-labelledby="req-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "8px 20px", marginBottom: "18px" }}><div style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Customer requests</span><h2 id="req-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,54px)", lineHeight: ".95", textWrap: "balance" }}>Need a caterer for 200? Post one request.</h2></div><span style={{ flex: "1" }}></span><A href="/requests" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>Post a request</A></div>
{(hReqs.length > 0) && (<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "16px" }}>{(hReqs).map((x, _k13) => (<Fragment key={_k13}><A href="/requests" style={{ padding: "18px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "8px", textDecoration: "none", color: "var(--ink)" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>{x.cat} · {x.areaN}</span><strong style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", fontSize: "24px" }}>{x.t}</strong><span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>{x.agoT} · {x.respLabel}</span></A></Fragment>))}</div>)}
</section>
<section aria-labelledby="vert-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Marketplaces</span>
<h2 id="vert-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,54px)", lineHeight: ".95", textWrap: "balance", margin: "8px 0 18px" }}>The big moments, sorted.</h2>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,260px),1fr))", gap: "16px" }}>{(hVerts).map((h, _k14) => (<Fragment key={_k14}><A href={h.href} style={{ display: "flex", flexDirection: "column", borderRadius: "24px", overflow: "hidden", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", textDecoration: "none", color: "var(--ink)", transition: "transform .25s ease" }} className="x3"><span style={{ aspectRatio: "16/8", backgroundColor: h.tone, backgroundImage: "radial-gradient(rgba(255,255,255,.16) 1.2px,transparent 1.6px)", backgroundSize: "14px 14px", display: "flex", alignItems: "flex-end", padding: "14px" }}><span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", fontSize: "28px", color: "#fff" }}>{h.ta}</span></span><span style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}><strong style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", fontSize: "30px" }}>{h.t}</strong><span style={{ fontSize: "14px", lineHeight: "1.45", color: "var(--ink2)" }}>{h.d}</span><span style={{ fontSize: "13px", fontWeight: "800", color: "var(--mariText)" }}>{h.count} businesses →</span></span></A></Fragment>))}</div>
</section>
{(hAw.length > 0) && (<>
<section aria-labelledby="aw-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<div style={{ padding: "clamp(22px,4vw,40px)", borderRadius: "28px", background: "var(--glass)", border: "1.5px solid var(--mari)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "24px", alignItems: "center", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>TamilTO Best of {aw.year} · {aw.stage}</span><h2 id="aw-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,54px)", lineHeight: ".95", textWrap: "balance" }}>Who makes the best kothu in the GTA? You decide.</h2><div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><A href="/awards" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>Vote now</A><A href="/awards" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 22px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", fontSize: "15px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" }}>Nominate a business</A></div></div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{(hAw).map((c, _k15) => (<Fragment key={_k15}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "var(--glass2)", border: "1px solid var(--line)" }}><strong>{c.t}</strong><span style={{ fontSize: "13px", color: "var(--ink2)", textAlign: "right" }}>Leading: {c.lead}</span></div></Fragment>))}</div>
</div>
</section>
</>)}
<section aria-labelledby="nl-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}><div style={{ padding: "clamp(22px,4vw,44px)", borderRadius: "28px", background: "var(--glass)", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "24px", alignItems: "center", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}><div style={{ display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>The Friday newsletter</span><h2 id="nl-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,54px)", lineHeight: ".95", textWrap: "balance" }}>{news.t}</h2><p style={{ margin: "0", fontSize: "16px", lineHeight: "1.55", color: "var(--ink2)" }}>{news.d}</p>{(news.hasSponsor) && (<><span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>This week sponsored by {news.sponsor}</span></>)}</div>{(news.notDone) && (<><form onSubmit={nlSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}><div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}><label style={{ flex: "1 1 220px", display: "flex" }}><span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Email</span><input name="email" type="email" required={true} autoComplete="email" placeholder="you@email.com" style={{ minHeight: "48px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass2)", color: "var(--ink)", fontSize: "16px", width: "100%", borderRadius: "999px", minHeight: "52px" }} /></label><button type="submit" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", minHeight: "52px" }}>Sign me up</button></div><span style={{ fontSize: "13px", color: "var(--ink2)" }}>We’ll send a confirmation email first (double opt-in).</span></form></>)}{(news.done) && (<><p role="status" style={{ margin: "0", fontSize: "18px", fontWeight: "800", color: "var(--green)" }}>Almost there. Check your inbox to confirm. Nandri!</p></>)}</div></section>
<section aria-labelledby="biz-cta-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<div style={{ position: "relative", overflow: "hidden", borderRadius: "28px", padding: "clamp(24px,4vw,48px)", background: "var(--glass)", border: "1.5px solid var(--mari)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "28px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>For Tamil-owned businesses</span>
<h2 id="biz-cta-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(40px,5.5vw,68px)", lineHeight: ".9", textWrap: "balance" }}>Is your business glowing on the map yet?</h2>
<p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", color: "var(--ink2)" }}>Claim your free listing, get the Verified Tamil-owned badge, and take WhatsApp messages and quote requests straight from TamilTO.</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
<A href="/business" style={{ minHeight: "50px", display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: "999px", background: "var(--act)", color: "#fff", fontWeight: "800", textDecoration: "none" }}>Claim your free listing</A>
<A href="/business" style={{ minHeight: "50px", display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>See pricing & perks</A>
</div>
</div>
<div style={{ justifySelf: "center", width: "min(100%,300px)", transform: "rotate(-3deg)", background: "#FFFFFF", color: "#1A1410", borderRadius: "22px", padding: "20px", boxShadow: "0 30px 60px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center" }}>
<span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "40px", lineHeight: "1", display: "inline-flex", alignItems: "baseline" }}><span>Tamil</span><svg viewBox="0 -42 64 142" aria-hidden="true" style={{ height: "1.18em", width: ".53em", overflow: "visible", margin: "0 .015em 0 .035em", color: "#B3122E" }}><path fill="currentColor" d="M31 -42H33L34.2 -10H29.8Z M29.5 -4H34.5V0H29.5Z M9.5 0H54.5A9.5 9.5 0 0 1 54.5 19H9.5A9.5 9.5 0 0 1 9.5 0Z M15 19H49L46 26H18Z M23 26H41L45 100H19Z" /><path fill="#F0A202" d="M29 -12H35Q37 -12 37 -10V-6Q37 -4 35 -4H29Q27 -4 27 -6V-10Q27 -12 29 -12Z" /></svg><span style={{ color: "#B3122E" }}>O</span></span>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "#1F7A4D" }}>✓ Verified Tamil-owned</span>
<div style={{ width: "120px", display: "grid", gridTemplateColumns: "repeat(21,1fr)" }}>{(qr).map((q, _k16) => (<Fragment key={_k16}><span style={{ aspectRatio: "1", background: q.c }}></span></Fragment>))}</div>
<span style={{ fontSize: "13px", fontWeight: "700" }}>Scan to find us on TamilTO</span>
</div>
</div>
</section>
      {nl.err ? <p role="alert" style={{ maxWidth: 1320, margin: '8px auto 0', padding: '0 clamp(16px,4vw,32px)', color: 'var(--red)', fontWeight: 700 }}>{nl.err}</p> : null}
    </>
  )
}
