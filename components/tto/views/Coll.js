'use client'
// Cousin-approved list. Layout ported from TamilTO 3.0 (COLLECTION screen).
import { Fragment } from 'react'
import A from '../A'
import { useSite } from '../useSite'
import { enc } from '@/lib/tto'
import { SITE_URL } from '@/lib/site'

export default function CollView({ raw, nowAt, collId }) {
  const { site, byId, app } = useSite(raw, nowAt)
  const c = site.collections.find((x) => x.id === collId)
  const coll = {
    t: c.title, by: c.curatedBy, d: c.description, count: c.businessIds.length,
    saveAll: () => app.saveMany(c.businessIds),
    wa: 'https://wa.me/?text=' + enc(`${c.title}, on TamilTO:\n` + c.businessIds.map((id) => '• ' + (byId[id]?.name || '')).join('\n') + `\n${SITE_URL}/c/${c.id}`),
  }
  const collItems = c.businessIds.map((id, i) => byId[id] && { ...byId[id], rank: i + 1 }).filter(Boolean)

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "32px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Cousin-approved list · by {coll.by}</span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(50px,8vw,100px)", lineHeight: ".85", maxWidth: "960px", textWrap: "balance" }}>{coll.t}</h1>
<p style={{ margin: "0", fontSize: "18px", color: "var(--ink2)", maxWidth: "640px" }}>{coll.d}</p>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
<button type="button" onClick={coll.saveAll} style={{ minHeight: "48px", padding: "0 20px", borderRadius: "999px", border: "0", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", cursor: "pointer" }}>♥ Save all {coll.count}</button>
<A href={coll.wa} target="_blank" rel="noopener noreferrer" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", textDecoration: "none" }}>Share on WhatsApp</A>
</div>
</section>
<ol style={{ listStyle: "none", maxWidth: "1320px", margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,300px),1fr))", gap: "18px" }}>
{(collItems).map((x, _k1) => (<Fragment key={_k1}>
<li style={{ position: "relative", display: "flex", flexDirection: "column", borderRadius: "22px", overflow: "hidden", background: "var(--glass)", border: `1px solid ${x.border}`, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
<A href={x.href} aria-label={`${x.n} photos`} style={{ display: "block", position: "relative", aspectRatio: "16/9", backgroundColor: x.tone, backgroundImage: x.bgImg, backgroundSize: x.bgSize, backgroundPosition: "center" }}><span style={{ position: "absolute", left: "14px", bottom: "8px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "64px", lineHeight: "1", color: "#fff" }}>{x.rank}</span></A>
<button type="button" onClick={x.toggleSave} aria-pressed={x.savedAria} aria-label={x.saveLabel} style={{ position: "absolute", right: "10px", top: "10px", width: "44px", height: "44px", borderRadius: "99px", border: "0", background: "rgba(14,10,7,.55)", color: x.heartColor, fontSize: "20px", cursor: "pointer" }}>{x.heart}</button>
<div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: "1" }}>
<span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>{x.catLabel} · {x.hoodName}</span>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1" }}><A href={x.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{x.n}</A></h2>
<p style={{ margin: "0", fontSize: "15px", lineHeight: "1.45", color: "var(--ink2)" }}>{x.short}</p>
<span style={{ fontSize: "13px", fontWeight: "700", color: x.statusColor }}>● {x.status}</span>
<div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "6px" }}>
{(x.hasWa) && (<><A href={x.wa} target="_blank" rel="noopener noreferrer" style={{ flex: "1", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>WhatsApp</A></>)}
<A href={x.href} style={{ flex: "1", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Details</A>
</div>
</div>
</li>
</Fragment>))}
</ol>
    </>
  )
}
