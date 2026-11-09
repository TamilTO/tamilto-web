'use client'
// Marketplace: Plan page. Layout converted from TamilTO 3.0 (Claude Design); values come from useMarket.js.
import { Fragment } from 'react'
import A from '../A'
import { useMarketView } from '../useMarket'

export default function PlanView({ raw, market, nowAt, id }) {
  const { evTypes, onPlanQ, plan3, planGroups, planHoods, planQ, planSearch } = useMarketView('plan', raw, market, nowAt, { id })
  return (
    <>

<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Plan an event · ranked by cousins</span>
<div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(56px,9vw,120px)", lineHeight: ".84", letterSpacing: "-.01em", textWrap: "balance" }}>What are you celebrating?</h1><span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>விழா</span></div>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "680px", textWrap: "pretty" }}>Pick your event or search for it. We’ll line up every vendor type you need, with Tamil businesses ranked by how many cousins approve of them.</p>
<form onSubmit={planSearch} role="search" style={{ maxWidth: "760px", display: "flex", alignItems: "center", gap: "8px", padding: "7px 7px 7px 20px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--line2)", boxShadow: "var(--shadow)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
<label htmlFor="plan-q" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>Search an event or vendor</label>
<input id="plan-q" type="search" value={planQ} onChange={onPlanQ} placeholder="Try “saamathiya”, “1st birthday” or “nadaswaram”" autoComplete="off" style={{ flex: "1", minWidth: "0", height: "50px", border: "0", background: "transparent", color: "var(--ink)", fontSize: "17px" }} />
<button type="submit" style={{ height: "50px", padding: "0 22px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer", flexShrink: "0" }}>Search</button>
</form>
</section>
<section aria-label="Event types" style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px clamp(16px,4vw,32px) 0" }}>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(46%,190px),1fr))", gap: "10px" }}>
{(evTypes).map((e, _k1) => (<Fragment key={_k1}>
<button type="button" onClick={e.pick} aria-pressed={e.pressed} style={{ minHeight: "104px", padding: "14px", borderRadius: "18px", border: `1.5px solid ${e.border}`, background: e.bg, color: "var(--ink)", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", transition: "transform .2s ease" }} className="x5">
<span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", fontSize: "14px", color: "var(--ink2)" }}>{e.ta}</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><strong style={{ fontSize: "16px", lineHeight: "1.2" }}>{e.t}</strong><span style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink2)" }}>{e.count} vendor types</span></span>
</button>
</Fragment>))}
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "12px" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "6px 16px" }}><h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(36px,4.8vw,58px)", lineHeight: ".95" }}>{plan3.t}</h2><span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", color: "var(--mariText)", paddingBottom: "6px" }}>{plan3.ta}</span></div>
<p style={{ margin: "0", fontWeight: "700", color: "var(--ink2)" }}>{plan3.sub}</p>
<div role="group" aria-label="Area" className="chiprow" style={{ display: "flex", gap: "8px", padding: "2px 0" }}>{(planHoods).map((c, _k2) => (<Fragment key={_k2}><button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "40px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>{c.label}</button></Fragment>))}</div>
{(plan3.none) && (<><div style={{ padding: "24px", borderRadius: "20px", border: "1px dashed var(--line2)", color: "var(--ink2)", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}><span style={{ flex: "1 1 260px" }}>No vendors match yet. Try another area or event, or post a request and let businesses come to you.</span><A href="/requests" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", padding: "0 18px", borderRadius: "999px", background: "var(--act)", color: "#fff", fontWeight: "800", textDecoration: "none" }}>Post a request</A></div></>)}
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "12px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,400px),1fr))", gap: "16px", alignItems: "start" }}>
{(planGroups).map((g, _k3) => (<Fragment key={_k3}>
<div style={{ padding: "16px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "10px" }}>
<div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}><h3 style={{ margin: "0", flex: "1", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1" }}>{g.l}</h3><span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>{g.countLabel}</span></div>
{(g.empty) && (<><span style={{ fontSize: "14px", color: "var(--ink2)" }}>None listed here yet. <A href="/requests">Post a request</A> and we’ll find one.</span></>)}
{(g.list).map((x, _k4) => (<Fragment key={_k4}>
<div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "16px", background: "var(--glass2)", border: `1px solid ${x.border}` }}>
<span style={{ flex: "0 0 40px", height: "40px", borderRadius: "12px", background: x.rankBg, color: x.rankFg, display: "grid", placeItems: "center", fontFamily: "var(--display)", fontWeight: "900", fontSize: x.rankFs, letterSpacing: ".02em" }}>{x.rank}</span>
<div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "4px" }}>
<A href={x.href} style={{ fontWeight: "800", color: "var(--ink)", textDecoration: "none", lineHeight: "1.2" }}>{x.n}</A>
<span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{x.hoodName} · {x.recN}</span>
{(x.hasScore) && (<><span style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ flex: "1", maxWidth: "140px", height: "6px", borderRadius: "99px", background: "var(--line)" }}><span style={{ display: "block", height: "100%", width: x.pctW, borderRadius: "99px", background: "var(--green)" }}></span></span><span style={{ fontSize: "12px", fontWeight: "800", color: "var(--green)", whiteSpace: "nowrap" }}>{x.cousin}</span></span></>)}{(x.noScore) && (<><A href={x.href} style={{ fontSize: "12px", fontWeight: "800", color: "var(--mariText)", textDecoration: "none" }}>New · be the first to recommend →</A></>)}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: "0" }}>
<button type="button" onClick={x.togglePlan} aria-pressed={x.inPlan} style={{ minHeight: "36px", padding: "0 12px", borderRadius: "999px", border: "1.5px solid var(--green)", background: x.planBg, color: x.planFg, fontWeight: "800", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" }}>{x.planLabel}</button>
<A href={x.wa} target="_blank" rel="noopener" style={{ minHeight: "36px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 12px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "12px", textDecoration: "none" }}>WhatsApp</A>
</div>
</div>
</Fragment>))}
{(g.hasMore) && (<><button type="button" onClick={g.showMore} style={{ alignSelf: "flex-start", minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>{g.moreLabel}</button></>)}
</div>
</Fragment>))}
</section>
{(plan3.hasPlan) && (<>
<div style={{ position: "sticky", bottom: "12px", zIndex: "30", maxWidth: "1320px", margin: "20px auto 0", padding: "0 clamp(12px,3vw,32px)" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "12px 12px 12px 20px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--green)", boxShadow: "var(--shadow)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
<strong style={{ fontSize: "16px", flex: "1 1 160px" }}>{plan3.planLabel}</strong>
<A href={plan3.share} target="_blank" rel="noopener" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Share plan</A>
<button type="button" onClick={plan3.quote} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>Request quotes from all</button>
</div>
</div>
</>)}

    </>
  )
}
