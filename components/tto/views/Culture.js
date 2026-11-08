'use client'
// Culture. Layout ported from TamilTO 3.0 (CULTURE screen).
import { Fragment, useMemo } from 'react'
import A from '../A'
import { useSite, pic } from '../useSite'
import { eventCard } from '@/lib/tto-events'
import { articleHref } from '@/lib/site'

const art = (a, sz) => ({ t: a.title, tag: a.sponsored ? 'Sponsored' : (a.tags && a.tags[0]) || a.category, href: articleHref(a), tone: a.hero?.tone, ...pic(a.hero, sz) })

export default function CultureView({ raw, nowAt, articles, events }) {
  const { site, all } = useSite(raw, nowAt)
  const cultFeature = articles[0] ? art(articles[0]) : {}
  const cultArticles = articles.slice(1).map((a) => art(a))
  const classes = all.filter((b) => b.category === 'learn').slice(0, 8)
  const cultEvents = useMemo(() => events.filter((e) => ['Culture', 'Concert', 'Film', 'Festival'].includes(e.type)).map((e) => eventCard(e, site.hoodByKey)), [events, site])

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(64px,11vw,140px)", lineHeight: ".82" }}>Culture</h1><span lang="ta" style={{ fontFamily: "var(--tamil)", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>கலாச்சாரம்</span></div>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--ink2)", maxWidth: "620px" }}>Nostalgia, humour, weddings and traditions: the stuff we grew up with, and what we're making of it now.</p>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 0" }}>
{cultFeature.href && <A href={cultFeature.href} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "0", borderRadius: "28px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}>
<span style={{ minHeight: "280px", backgroundColor: cultFeature.tone, backgroundImage: cultFeature.bgImg, backgroundSize: cultFeature.bgSize, backgroundPosition: "center" }}></span>
<span style={{ padding: "clamp(20px,4vw,40px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>{cultFeature.tag}</span><strong style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(36px,4.5vw,58px)", lineHeight: ".92", textWrap: "balance" }}>{cultFeature.t}</strong><span style={{ fontWeight: "800" }}>Read it →</span></span>
</A>}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "16px", marginTop: "16px" }}>
{(cultArticles).map((i, _k1) => (<Fragment key={_k1}><A href={i.href} style={{ display: "flex", flexDirection: "column", gap: "10px", textDecoration: "none", color: "var(--ink)" }}><span style={{ aspectRatio: "3/2", borderRadius: "18px", backgroundColor: i.tone, backgroundImage: i.bgImg, backgroundSize: i.bgSize, backgroundPosition: "center" }}></span><span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mariText)" }}>{i.tag}</span><strong style={{ fontFamily: "var(--display)", fontWeight: "800", fontSize: "26px", lineHeight: "1" }}>{i.t}</strong></A></Fragment>))}
</div>
</section>
<section aria-labelledby="learn-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "48px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "16px" }}>
<div style={{ padding: "22px", borderRadius: "24px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
<h2 id="learn-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "36px" }}>Learn it yourself</h2>
{(classes).map((v, _k2) => (<Fragment key={_k2}><A href={v.href} style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}><span style={{ flex: "0 0 52px", height: "52px", borderRadius: "12px", backgroundColor: v.tone }}></span><span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><strong>{v.n}</strong><span style={{ fontSize: "13px", color: "var(--ink2)" }}>{v.hoodName} · {v.photo}</span></span></A></Fragment>))}
</div>
<div style={{ padding: "22px", borderRadius: "24px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "10px" }}>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "36px" }}>On stage soon</h2>
{(cultEvents).map((e, _k3) => (<Fragment key={_k3}><A href={e.href} style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "10px", borderTop: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}><span style={{ flexShrink: "0", padding: "6px 10px", borderRadius: "10px", background: "var(--mari)", color: "#1A1410", fontWeight: "800", fontSize: "13px" }}>{e.dow} {e.day}</span><span style={{ display: "flex", flexDirection: "column" }}><strong>{e.t}</strong><span style={{ fontSize: "13px", color: "var(--ink2)" }}>{e.venue} · {e.hoodName}</span></span></A></Fragment>))}
</div>
</section>
    </>
  )
}
