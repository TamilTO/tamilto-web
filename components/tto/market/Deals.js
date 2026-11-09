'use client'
// Marketplace: Deals page. Layout converted from TamilTO 3.0 (Claude Design); values come from useMarket.js.
import { Fragment } from 'react'
import A from '../A'
import { useMarketView } from '../useMarket'

export default function DealsView({ raw, market, nowAt, id }) {
  const { dealChips, dealEmpty, dealList, pg } = useMarketView('deals', raw, market, nowAt, { id })
  return (
    <>

<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>{pg.kick}</span><div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(56px,9vw,120px)", lineHeight: ".84", letterSpacing: "-.01em", textWrap: "balance" }}>{pg.title}</h1><span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>{pg.ta}</span></div><p style={{ margin: "0", fontSize: "18px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "680px", textWrap: "pretty" }}>{pg.lead}</p></section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "22px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}><div role="group" style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none", padding: "2px 0" }}>{(dealChips).map((c, _k1) => (<Fragment key={_k1}><button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 16px", borderRadius: "999px", border: `1.5px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>{c.label}</button></Fragment>))}</div>{(dealEmpty) && (<><p style={{ margin: "0", color: "var(--ink2)" }}>No deals right now. Check back Friday.</p></>)}</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "14px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,290px),1fr))", gap: "16px" }}>
{(dealList).map((x, _k2) => (<Fragment key={_k2}><article style={{ display: "flex", flexDirection: "column", borderRadius: "22px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}><A href={x.href} aria-label={x.n} style={{ display: "block", aspectRatio: "16/8", backgroundColor: x.tone, backgroundImage: x.bgImg, backgroundSize: x.bgSize, backgroundPosition: "center" }}></A><div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", flex: "1" }}><div style={{ padding: "10px 12px", borderRadius: "12px", border: "1.5px dashed var(--mari)", fontSize: "16px", fontWeight: "800", color: "var(--mariText)" }}>{x.dealT}</div><A href={x.href} style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", fontSize: "24px", color: "var(--ink)", textDecoration: "none" }}>{x.n}</A><span style={{ fontSize: "13px", color: "var(--ink2)", fontWeight: "600" }}>{x.catLabel} · {x.hoodName}</span>{(x.hasUntil) && (<><span style={{ fontSize: "13px", fontWeight: "700" }}>Until {x.until}</span></>)}<A href={x.wa} target="_blank" rel="noopener" style={{ minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 16px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap", marginTop: "auto" }}>Ask on WhatsApp</A></div></article></Fragment>))}
</section>

    </>
  )
}
