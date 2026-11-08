'use client'
// Directory with "Ask a cousin" search, filters, list and map. Layout ported from TamilTO 3.0.
// Filters live in the URL (/directory?cat=food&hood=markham) so results can be shared and indexed.
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import A from '../A'
import { MapCanvas, pinsFor, hoodLabelsFor } from '../canvas'
import { useSite } from '../useSite'
import { FULL, focusB, enc, score, matches, parseAsk, EMPTY_FILTER, DAYS_LONG } from '@/lib/tto'
import { track } from '../App'

const L = { wa: 'Mobile / WhatsApp', web: 'Has website', email: 'Has email', addr: 'Street address' }
const DOTS = { wa: '#5FC98A', web: 'var(--teal)', email: '#F5B83D', addr: '#FF6B7D' }

function toQuery(f, view, q) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  else {
    if (f.cat) p.set('cat', f.cat)
    if (f.hood) p.set('hood', f.hood)
    for (const k of ['wa', 'web', 'email', 'addr']) if (f[k]) p.set(k, '1')
  }
  if (view === 'map') p.set('view', 'map')
  const s = p.toString()
  return '/directory' + (s ? '?' + s : '')
}

export default function DirectoryView({ raw, nowAt, initial }) {
  const { site, all, byId } = useSite(raw, nowAt)
  const router = useRouter()
  const EX = site.searchExamples
  const [ph, setPh] = useState(0)
  const [askDraft, setAskDraft] = useState(initial.q || '')
  const [q, setQ] = useState(initial.q || '')
  const [f, setF] = useState(initial.filter)
  const [view, setView] = useState(initial.view)
  const [limit, setLimit] = useState(24)
  const [sel, setSel] = useState(null)
  useEffect(() => { const t = setInterval(() => setPh((x) => x + 1), 3400); return () => clearInterval(t) }, [])
  useEffect(() => { router.replace(toQuery(f, view, q), { scroll: false }) }, [f, view, q, router])
  useEffect(() => { if (q) track('search', '', q.slice(0, 80)) }, [q])

  const stats = { biz: all.length }
  const askPlaceholder = 'Ask: “' + EX[ph % EX.length] + '”'
  const onAskDraft = (e) => setAskDraft(e.target.value)
  const askSubmit = (e) => {
    e.preventDefault()
    const text = (askDraft || '').trim() || EX[ph % EX.length]
    setAskDraft(text); setQ(text); setF(parseAsk(text, site)); setSel(null); setLimit(24)
  }
  const setFil = (o) => { setF((x) => ({ ...x, ...o })); setQ(''); setSel(null); setLimit(24) }
  const clearAll = () => { setF({ ...EMPTY_FILTER }); setQ(''); setAskDraft(''); setSel(null) }
  const chip = (label, active, onClick, extra) => ({ label, onClick, pressed: active ? 'true' : 'false', bg: active ? 'var(--ink)' : 'var(--glass2)', fg: active ? 'var(--bg)' : 'var(--ink)', border: active ? 'var(--ink)' : 'var(--line2)', ...(extra || {}) })

  const res = useMemo(() => all.filter((b) => matches(b, f, site)).sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name)), [all, f, site])
  const interpL = []
  if (f.cat) interpL.push(['cat', site.catByKey[f.cat].label])
  if (f.hood) interpL.push(['hood', site.hoodByKey[f.hood].name])
  Object.keys(L).forEach((k) => { if (f[k]) interpL.push([k, L[k]]) })
  if (f.text) interpL.push(['text', '“' + f.text + '”'])
  const interp = interpL.map(([k, label]) => ({ label, aria: 'Remove ' + label, onClick: () => setFil({ [k]: k === 'text' ? '' : typeof EMPTY_FILTER[k] === 'boolean' ? false : null }) }))
  const hasInterp = interp.length > 0
  const toggles = ['wa', 'web', 'email', 'addr'].map((k) => chip(L[k], f[k], () => setFil({ [k]: !f[k] }), { dot: DOTS[k] }))
  const without = (k) => all.filter((b) => matches(b, { ...f, [k]: null }, site))
  const wc = without('cat'), wh = without('hood')
  const catChips = [chip('All', !f.cat, () => setFil({ cat: null }), { dot: 'var(--ink2)', count: wc.length }), ...site.categories.map((c) => chip(c.label, f.cat === c.key, () => setFil({ cat: f.cat === c.key ? null : c.key }), { dot: c.colour, count: wc.filter((b) => b.category === c.key).length }))]
  const hoodChips = [chip('Everywhere', !f.hood, () => setFil({ hood: null }), { count: wh.length }), ...site.neighbourhoods.map((h) => chip(h.name, f.hood === h.key, () => setFil({ hood: f.hood === h.key ? null : h.key }), { count: wh.filter((b) => b.neighbourhood === h.key).length }))]
  const n = res.length
  const resultText = `${n} Tamil ${n === 1 ? 'business' : 'businesses'}`
  const hasMore = view !== 'map' && n > limit, moreLeft = n - limit, showMore = () => setLimit(limit + 24)
  const viewChips = [['list', 'List'], ['map', 'Map']].map(([k, l]) => chip(l, view === k, () => setView(k)))
  const dirIsList = view !== 'map' && n > 0, dirIsMap = view === 'map' && n > 0, noResults = n === 0
  const results = (view === 'map' ? res.slice(0, 80) : res.slice(0, limit)).map((b) => ({ ...b, selBorder: sel === b.id ? 'var(--mari)' : 'var(--line)', showLabel: 'Show ' + b.name + ' on the map', select: () => setSel(b.id) }))
  const hoodObj = f.hood && site.hoodByKey[f.hood]
  const bd = hoodObj ? focusB(hoodObj, 1.15) : FULL
  const dirCfg = { bounds: bd, pins: res, threads: !f.hood, sel, focus: f.hood }
  const dirPins = dirIsMap ? pinsFor(bd, res).map((p) => ({ ...p, aria: `${p.b.name}, ${p.b.catLabel}, ${p.b.hoodName}. ${p.b.status}`, select: () => setSel(p.b.id) })) : []
  const dirHoods = hoodLabelsFor(bd, f.hood ? [hoodObj] : site.neighbourhoods)

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "32px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>The Tamil business directory · {stats.biz} listings</span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(46px,7vw,92px)", lineHeight: ".86", letterSpacing: "-.01em", textWrap: "balance" }}>Ask for anything. We'll find the Tamil spot.</h1>
<form onSubmit={askSubmit} role="search" style={{ maxWidth: "820px", display: "flex", alignItems: "center", gap: "8px", padding: "7px 7px 7px 20px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--line2)", boxShadow: "var(--shadow)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
<label htmlFor="ask-dir" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Ask a cousin</label>
<input id="ask-dir" type="search" value={askDraft} onChange={onAskDraft} placeholder={askPlaceholder} autoComplete="off" style={{ flex: "1", minWidth: "0", height: "50px", border: "0", background: "transparent", color: "var(--ink)", fontSize: "17px" }} />
<button type="submit" style={{ height: "50px", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", flexShrink: "0" }}>Ask</button>
</form>
{(hasInterp) && (<>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
<span style={{ fontSize: "13px", fontWeight: "800", color: "var(--mariText)" }}>Cousin heard:</span>
{(interp).map((c, _k1) => (<Fragment key={_k1}>
<button type="button" onClick={c.onClick} aria-label={c.aria} style={{ minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 12px", borderRadius: "999px", border: "1.5px solid var(--mari)", background: "var(--glass2)", color: "var(--ink)", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>{c.label} <span aria-hidden="true" style={{ opacity: ".7" }}>×</span></button>
</Fragment>))}
<button type="button" onClick={clearAll} style={{ minHeight: "36px", padding: "0 8px", border: "0", background: "none", color: "var(--ink2)", fontSize: "13px", fontWeight: "700", textDecoration: "underline", cursor: "pointer" }}>Clear all</button>
</div>
</>)}
<div role="group" aria-label="Quick filters" style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
{(toggles).map((c, _k2) => (<Fragment key={_k2}>
<button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: `1.5px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "700", fontSize: "14px", cursor: "pointer" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: c.dot }}></span>{c.label}</button>
</Fragment>))}
</div>
<div role="group" aria-label="Category" style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
{(catChips).map((c, _k3) => (<Fragment key={_k3}>
<button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: c.dot }}></span>{c.label} <span style={{ opacity: ".65" }}>{c.count}</span></button>
</Fragment>))}
</div>
<div role="group" aria-label="Neighbourhood" style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>
{(hoodChips).map((c, _k4) => (<Fragment key={_k4}>
<button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "40px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{c.label} <span style={{ opacity: ".65" }}>{c.count}</span></button>
</Fragment>))}
</div>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", paddingTop: "6px" }}>
<p role="status" style={{ margin: "0", fontWeight: "800", fontSize: "16px" }}>{resultText}</p>
<span style={{ flex: "1" }}></span>
<div role="group" aria-label="View" style={{ display: "flex", border: "1.5px solid var(--line2)", borderRadius: "999px", overflow: "hidden", background: "var(--glass2)" }}>
{(viewChips).map((c, _k5) => (<Fragment key={_k5}>
<button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ whiteSpace: "nowrap", minHeight: "42px", padding: "0 18px", border: "0", background: c.bg, color: c.fg, fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>{c.label}</button>
</Fragment>))}
</div>
</div>
</section>
{(dirIsMap) && (<>
<section aria-label="Map of results" style={{ maxWidth: "1320px", margin: "0 auto", padding: "16px clamp(16px,4vw,32px) 0", display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
<div style={{ flex: "3 1 560px", minWidth: "0", position: "relative", aspectRatio: "16/10", borderRadius: "26px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: "var(--shadow)" }}>
<MapCanvas cfg={dirCfg} site={site} />
{(dirHoods).map((h, _k6) => (<Fragment key={_k6}><A href={h.href} style={{ position: "absolute", left: h.x, top: h.y, transform: "translate(-50%,-190%)", padding: "4px 10px", borderRadius: "999px", background: "var(--glass2)", border: "1px solid var(--line2)", color: "var(--ink)", fontSize: "12px", fontWeight: "800", textDecoration: "none", whiteSpace: "nowrap", zIndex: "2" }}>{h.n}</A></Fragment>))}
{(dirPins).map((p, _k7) => (<Fragment key={_k7}><button type="button" onClick={p.select} aria-label={p.aria} style={{ position: "absolute", left: p.x, top: p.y, width: "28px", height: "28px", margin: "-14px 0 0 -14px", borderRadius: "99px", border: "0", background: "transparent", cursor: "pointer", zIndex: "1" }}></button></Fragment>))}
</div>
<div style={{ flex: "1 1 300px", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "min(72vh,680px)", overflow: "auto", paddingRight: "2px" }}>
{(results).map((v, _k8) => (<Fragment key={_k8}>
<div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "18px", background: "var(--glass)", border: `1.5px solid ${v.selBorder}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<button type="button" onClick={v.select} aria-label={v.showLabel} style={{ flex: "0 0 60px", height: "60px", borderRadius: "12px", border: "0", cursor: "pointer", backgroundColor: v.tone, backgroundImage: v.bgImg, backgroundSize: v.bgSize, backgroundPosition: "center" }}></button>
<div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
<A href={v.href} style={{ fontWeight: "800", color: "var(--ink)", textDecoration: "none", lineHeight: "1.2" }}>{v.n}</A>
<span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{v.catLabel} · {v.hoodName}</span>
<span style={{ fontSize: "12px", fontWeight: "800", color: v.statusColor }}>{v.status}</span>
</div>
{(v.hasWa) && (<><A href={v.wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${v.n}`} style={{ flexShrink: "0", width: "44px", height: "44px", borderRadius: "99px", background: "#1F7A4D", color: "#fff", display: "grid", placeItems: "center", textDecoration: "none", fontWeight: "800", fontSize: "12px" }}>WA</A></>)}
</div>
</Fragment>))}
</div>
</section>
</>)}
{(dirIsList) && (<>
<section aria-label="Results" style={{ maxWidth: "1320px", margin: "0 auto", padding: "16px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "18px" }}>
{(results).map((x, _k9) => (<Fragment key={_k9}>
<article style={{ position: "relative", display: "flex", flexDirection: "column", borderRadius: "22px", overflow: "hidden", background: "var(--glass)", border: `1px solid ${x.border}`, backdropFilter: "blur(14px) saturate(140%)", WebkitBackdropFilter: "blur(14px) saturate(140%)", boxShadow: x.glow }}>
<A href={x.href} aria-label={`${x.n} photos`} style={{ display: "block", position: "relative", aspectRatio: "16/9", backgroundColor: x.tone, backgroundImage: x.bgImg, backgroundSize: x.bgSize, backgroundPosition: "center" }}>
<span style={{ position: "absolute", left: "12px", top: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
{(x.feat) && (<><span style={{ background: "#F5B83D", color: "#1A1410", fontSize: "11px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 8px", borderRadius: "6px" }}>Featured</span></>)}
{(x.hasDeal) && (<><span style={{ background: "#1A1410", color: "#F5B83D", fontSize: "11px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 8px", borderRadius: "6px" }}>Deal</span></>)}
{(x.hiring) && (<><span style={{ background: "#FFFFFF", color: "#1A1410", fontSize: "11px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 8px", borderRadius: "6px" }}>Hiring</span></>)}
</span>
<span style={{ position: "absolute", left: "12px", bottom: "10px", fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.92)" }}>{x.photo}</span>
</A>
<button type="button" onClick={x.toggleSave} aria-pressed={x.savedAria} aria-label={x.saveLabel} style={{ position: "absolute", right: "10px", top: "10px", width: "44px", height: "44px", borderRadius: "99px", border: "0", background: "rgba(14,10,7,.55)", color: x.heartColor, fontSize: "20px", cursor: "pointer" }}>{x.heart}</button>
<div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: "1" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: x.catColor, flexShrink: "0" }}></span>{x.catLabel} · {x.hoodName}</span>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}><A href={x.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{x.n}</A>{(x.ver) && (<><span title="Verified Tamil-owned" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: "var(--sans)", fontSize: "11px", fontWeight: "800", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--teal)" }}>✓ Verified</span></>)}</h2>
<p style={{ margin: "0", fontSize: "15px", lineHeight: "1.45", color: "var(--ink2)" }}>{x.short}</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: "13px", fontWeight: "700" }}><span style={{ color: x.statusColor }}>● {x.status}</span><span style={{ color: "var(--ink2)" }}>{x.recLabel}</span></div>
{(x.ta) && (<><span style={{ alignSelf: "flex-start", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--line2)" }}>Tamil-speaking · <span lang="ta" style={{ fontFamily: "var(--tamil)" }}>தமிழ்</span></span></>)}
{(x.hasDeal) && (<><div style={{ padding: "8px 12px", borderRadius: "12px", border: "1px dashed var(--mari)", fontSize: "13px", fontWeight: "700", color: "var(--mariText)" }}>{x.deal}</div></>)}
<div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "6px", flexWrap: "wrap" }}>
{(x.hasWa) && (<><A href={x.wa} target="_blank" rel="noopener noreferrer" style={{ flex: "1 1 auto", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 14px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>WhatsApp</A></>)}
{(x.hasPhone) && (<><A href={x.tel} style={{ flex: "1 1 auto", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 14px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Call</A></>)}
{(x.quote) && (<><button type="button" onClick={x.getQuote} style={{ flex: "1 1 auto", minHeight: "44px", padding: "0 14px", borderRadius: "999px", border: "1.5px solid var(--mari)", background: "transparent", color: "var(--ink)", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>Get a quote</button></>)}
</div>
</div>
</article>
</Fragment>))}
</section>
</>)}
{(hasMore) && (<><div style={{ display: "flex", justifyContent: "center", padding: "24px 16px 0" }}><button type="button" onClick={showMore} style={{ minHeight: "50px", padding: "0 26px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "var(--glass2)", color: "var(--ink)", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>Show more · {moreLeft} left</button></div></>)}
{(noResults) && (<>
<div style={{ maxWidth: "760px", margin: "24px auto 0", padding: "32px 24px", borderRadius: "24px", background: "var(--glass)", border: "1px dashed var(--line2)", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
<strong style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "34px" }}>Aiyo, nothing yet.</strong>
<span style={{ color: "var(--ink2)", fontSize: "16px" }}>Try fewer filters, or tell us who's missing. We'll invite them.</span>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}><button type="button" onClick={clearAll} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "0", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", cursor: "pointer" }}>Clear filters</button><A href="/business" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", padding: "0 18px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>Add a business</A></div>
</div>
</>)}
    </>
  )
}
