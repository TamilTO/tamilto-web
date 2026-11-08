'use client'
// Life-moment journey (wedding, baby, new home). Layout ported from TamilTO 3.0 (JOURNEY screen).
import { Fragment } from 'react'
import A from '../A'
import { useSite } from '../useSite'
import { enc } from '@/lib/tto'

export default function JourneyView({ raw, nowAt, journeyId }) {
  const { site, byId, app } = useSite(raw, nowAt)
  const j = site.journeys.find((x) => x.id === journeyId)
  const jr = { t: j.title, ta: j.tamil, d: j.description }
  const journeyTabs = site.journeys.map((x) => { const on = x.id === j.id; return { label: x.title, href: '/journey/' + x.id, current: on ? 'page' : undefined, bg: on ? 'var(--ink)' : 'var(--glass2)', fg: on ? 'var(--bg)' : 'var(--ink)', border: on ? 'var(--ink)' : 'var(--line2)' } })
  const steps = j.steps.map((s, i) => ({ n: i + 1, when: s.when, t: s.title, d: s.tip, vendors: s.businessIds.map((id) => byId[id]).filter(Boolean).map((b) => ({ ...b, planBorder: b.inPlan ? 'var(--green)' : 'var(--line)', planAria: b.inPlan ? 'true' : 'false' })) }))
  const ids = new Set(j.steps.flatMap((x) => x.businessIds))
  const plan = app.plan.filter((id) => ids.has(id) && byId[id])
  const planCount = plan.length, hasPlan = plan.length > 0
  const sharePlan = 'https://wa.me/?text=' + enc(`My ${j.title.toLowerCase()} plan, from TamilTO:\n` + plan.map((id) => `• ${byId[id].name} (${byId[id].catLabel})`).join('\n'))
  const quotePlan = () => app.openQuote(plan, j.quoteLabel)

  return (
    <>
<section style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "16px" }}>
<div role="group" aria-label="Life moments" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
{(journeyTabs).map((c, _k1) => (<Fragment key={_k1}><A href={c.href} aria-current={c.current} style={{ whiteSpace: "nowrap", minHeight: "42px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", border: `1.5px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>{c.label}</A></Fragment>))}
</div>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Life moment · <span lang="ta" style={{ fontFamily: "var(--tamil)", letterSpacing: "0" }}>{jr.ta}</span></span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(52px,8vw,104px)", lineHeight: ".85", textWrap: "balance" }}>{jr.t}</h1>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "680px" }}>{jr.d}</p>
</section>
<ol style={{ listStyle: "none", maxWidth: "1100px", margin: "0 auto", padding: "28px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "0" }}>
{(steps).map((st, _k2) => (<Fragment key={_k2}>
<li style={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr)", gap: "16px" }}>
<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
<span style={{ width: "48px", height: "48px", borderRadius: "99px", background: "var(--mari)", color: "#1A1410", display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: "900", fontSize: "26px", flexShrink: "0" }}>{st.n}</span>
<span style={{ flex: "1", width: "2px", background: "linear-gradient(var(--mari),transparent)", minHeight: "24px" }}></span>
</div>
<div style={{ paddingBottom: "32px", display: "flex", flexDirection: "column", gap: "10px", minWidth: "0" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)", paddingTop: "4px" }}>{st.when}</span>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(32px,4vw,44px)", lineHeight: ".95" }}>{st.t}</h2>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.5", color: "var(--ink2)" }}>{st.d}</p>
{(!st.vendors.length) && (<p style={{ margin: "4px 0 0", padding: "14px 16px", borderRadius: "18px", border: "1.5px dashed var(--line2)", fontSize: "14px", lineHeight: "1.5", color: "var(--ink2)" }}>We're still picking cousin-approved businesses for this step. Know a good one? <A href="/submit" style={{ color: "var(--ink)", fontWeight: "800" }}>Tell us</A> or <A href="/business" style={{ color: "var(--ink)", fontWeight: "800" }}>list your business</A>.</p>)}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "10px", marginTop: "4px" }}>
{(st.vendors).map((v, _k3) => (<Fragment key={_k3}>
<div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "18px", background: "var(--glass)", border: `1.5px solid ${v.planBorder}`, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<A href={v.href} aria-label={v.n} style={{ flex: "0 0 58px", height: "58px", borderRadius: "12px", backgroundColor: v.tone, backgroundImage: v.bgImg, backgroundSize: v.bgSize, backgroundPosition: "center" }}></A>
<div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
<A href={v.href} style={{ fontWeight: "800", color: "var(--ink)", textDecoration: "none", lineHeight: "1.2" }}>{v.n}</A>
<span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{v.hoodName} · {v.recLabel}</span>
</div>
<button type="button" onClick={v.togglePlan} aria-pressed={v.planAria} style={{ flexShrink: "0", minHeight: "40px", padding: "0 12px", borderRadius: "999px", border: "1.5px solid var(--green)", background: v.planBg, color: v.planFg, fontWeight: "800", fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}>{v.planLabel}</button>
</div>
</Fragment>))}
</div>
</div>
</li>
</Fragment>))}
</ol>
{(hasPlan) && (<>
<div style={{ position: "sticky", bottom: "12px", zIndex: "30", maxWidth: "1100px", margin: "0 auto", padding: "0 clamp(12px,3vw,32px)" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "12px 12px 12px 20px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--green)", boxShadow: "var(--shadow)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
<strong style={{ fontSize: "16px", flex: "1 1 160px" }}>{planCount} in your plan</strong>
<A href={sharePlan} target="_blank" rel="noopener noreferrer" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Share plan</A>
<button type="button" onClick={quotePlan} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>Request quotes from all</button>
</div>
</div>
</>)}
    </>
  )
}
