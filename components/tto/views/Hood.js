'use client'
// Neighbourhood page. Layout ported from TamilTO 3.0 (NEIGHBOURHOOD WORLD screen).
import { Fragment, useMemo } from 'react'
import A from '../A'
import { MapCanvas, pinsFor } from '../canvas'
import { useSite } from '../useSite'
import { focusB, score } from '@/lib/tto'
import { eventCard } from '@/lib/tto-events'

export default function HoodView({ raw, nowAt, hoodKey, events }) {
  const { site, all } = useSite(raw, nowAt)
  const h = site.hoodByKey[hoodKey]
  const l = all.filter((b) => b.neighbourhood === h.key).sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
  const bd = focusB(h, 1)
  const hood = { n: h.name, c: h.colour, tag: h.tagline, d: h.description, count: l.length, cats: new Set(l.map((b) => b.category)).size, web: l.filter((b) => b.website).length, allHref: '/directory?hood=' + h.key }
  const pinList = [...l.slice(0, 300), ...all.filter((b) => b.neighbourhood !== h.key).sort((a, b) => score(b) - score(a)).slice(0, 100)]
  const hoodCfg = { bounds: bd, pins: pinList, sel: null, focus: h.key }
  const hoodPins = pinsFor(bd, pinList).map((p) => ({ ...p, href: p.b.href, aria: `${p.b.name}, ${p.b.catLabel}. ${p.b.status}` }))
  const hoodCats = site.categories.map((c) => ({ label: c.label, c: c.colour, count: l.filter((b) => b.category === c.key).length, href: `/directory?cat=${c.key}&hood=${h.key}` })).filter((c) => c.count)
  const hoodBiz = l.slice(0, 24)
  const hoodEvents = useMemo(() => events.filter((e) => e.hood === h.key).map((e) => eventCard(e, site.hoodByKey)), [events, h, site])
  const hoodNoEvents = !hoodEvents.length
  const otherHoods = site.neighbourhoods.filter((x) => x.key !== h.key).map((x) => ({ n: x.name, c: x.colour, href: '/n/' + x.key }))

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "32px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))", gap: "24px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Neighbourhood world</span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(60px,10vw,132px)", lineHeight: ".82", letterSpacing: "-.015em" }}>{hood.n}</h1>
<span style={{ width: "120px", height: "8px", borderRadius: "99px", background: hood.c }}></span>
<strong style={{ fontSize: "22px" }}>{hood.tag}</strong>
<p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "560px" }}>{hood.d}</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px 22px", fontSize: "14px", fontWeight: "700", color: "var(--ink2)" }}><span><strong style={{ fontSize: "22px", color: "var(--ink)" }}>{hood.count}</strong> businesses</span><span><strong style={{ fontSize: "22px", color: "var(--green)" }}>{hood.cats}</strong> categories</span><span><strong style={{ fontSize: "22px", color: "var(--ink)" }}>{hood.web}</strong> with websites</span></div>
</div>
<div style={{ position: "relative", aspectRatio: "16/10", borderRadius: "26px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", boxShadow: "var(--shadow)" }}>
<MapCanvas cfg={hoodCfg} site={site} />
{(hoodPins).map((p, _k1) => (<Fragment key={_k1}><A href={p.href} aria-label={p.aria} style={{ position: "absolute", left: p.x, top: p.y, width: "28px", height: "28px", margin: "-14px 0 0 -14px", borderRadius: "99px", zIndex: "1" }}></A></Fragment>))}
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "28px clamp(16px,4vw,32px) 0" }}>
<div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>
{(hoodCats).map((c, _k2) => (<Fragment key={_k2}><A href={c.href} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", background: "var(--glass2)", color: "var(--ink)", fontWeight: "700", fontSize: "14px", textDecoration: "none" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: c.c }}></span>{c.label} <span style={{ opacity: ".6" }}>{c.count}</span></A></Fragment>))}
</div>
</section>
<section aria-labelledby="hood-list-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0" }}>
<h2 id="hood-list-h" style={{ margin: "0 0 16px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(36px,4.5vw,54px)", lineHeight: ".95" }}>{hood.count ? `${hood.count} listed in ${hood.n}` : `Listings coming soon to ${hood.n}`}</h2><A href={hood.allHref} style={{ display: "inline-block", margin: "-6px 0 16px", fontWeight: "800", color: "var(--ink)" }}>See all in the directory →</A>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "18px" }}>
{(hoodBiz).map((x, _k3) => (<Fragment key={_k3}>
<article style={{ position: "relative", display: "flex", flexDirection: "column", borderRadius: "22px", overflow: "hidden", background: "var(--glass)", border: `1px solid ${x.border}`, backdropFilter: "blur(14px) saturate(140%)", WebkitBackdropFilter: "blur(14px) saturate(140%)", boxShadow: x.glow }}>
<A href={x.href} aria-label={`${x.n} photos`} style={{ display: "block", position: "relative", aspectRatio: "16/9", backgroundColor: x.tone, backgroundImage: x.bgImg, backgroundSize: x.bgSize, backgroundPosition: "center" }}>
<span style={{ position: "absolute", left: "12px", top: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
{(x.feat) && (<><span style={{ background: "#F5B83D", color: "#1A1410", fontSize: "11px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 8px", borderRadius: "6px" }}>Featured</span></>)}
{(x.hasDeal) && (<><span style={{ background: "#1A1410", color: "#F5B83D", fontSize: "11px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", padding: "5px 8px", borderRadius: "6px" }}>Deal</span></>)}
</span>
<span style={{ position: "absolute", left: "12px", bottom: "10px", fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.92)" }}>{x.photo}</span>
</A>
<button type="button" onClick={x.toggleSave} aria-pressed={x.savedAria} aria-label={x.saveLabel} style={{ position: "absolute", right: "10px", top: "10px", width: "44px", height: "44px", borderRadius: "99px", border: "0", background: "rgba(14,10,7,.55)", color: x.heartColor, fontSize: "20px", cursor: "pointer" }}>{x.heart}</button>
<div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: "1" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: x.catColor }}></span>{x.catLabel}</span>
<h3 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1" }}><A href={x.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{x.n}</A></h3>
<p style={{ margin: "0", fontSize: "15px", lineHeight: "1.45", color: "var(--ink2)" }}>{x.short}</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: "13px", fontWeight: "700" }}><span style={{ color: x.statusColor }}>● {x.status}</span><span style={{ color: "var(--ink2)" }}>{x.recLabel}</span></div>
<div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "6px" }}>
{(x.hasWa) && (<><A href={x.wa} target="_blank" rel="noopener noreferrer" style={{ flex: "1", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>WhatsApp</A></>)}
{(x.hasPhone) && (<><A href={x.tel} style={{ flex: "1", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Call</A></>)}
</div>
</div>
</article>
</Fragment>))}
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "16px" }}>
<div style={{ padding: "20px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "34px" }}>Happening in {hood.n}</h2>
{(hoodNoEvents) && (<><span style={{ color: "var(--ink2)" }}>Nothing listed yet. <A href="/events">See all events</A>.</span></>)}
{(hoodEvents).map((e, _k4) => (<Fragment key={_k4}><A href={e.href} style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--line)", color: "var(--ink)", textDecoration: "none" }}><span style={{ flexShrink: "0", padding: "6px 10px", borderRadius: "10px", background: "var(--mari)", color: "#1A1410", fontWeight: "800", fontSize: "13px" }}>{e.dow} {e.day}</span><strong>{e.t}</strong></A></Fragment>))}
</div>
<div style={{ padding: "20px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "34px" }}>Next door</h2>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{(otherHoods).map((h, _k5) => (<Fragment key={_k5}><A href={h.href} style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", color: "var(--ink)", fontWeight: "700", textDecoration: "none" }}><span style={{ width: "10px", height: "10px", borderRadius: "99px", background: h.c }}></span>{h.n}</A></Fragment>))}</div>
</div>
</section>
    </>
  )
}
