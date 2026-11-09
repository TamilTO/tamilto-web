'use client'
// Marketplace: Partners page. Layout converted from TamilTO 3.0 (Claude Design); values come from useMarket.js.
import { Fragment } from 'react'
import A from '../A'
import { useMarketView } from '../useMarket'

export default function PartnersView({ raw, market, nowAt, id }) {
  const { notice, partnerEmpty, partnerList, pg } = useMarketView('partners', raw, market, nowAt, { id })
  return (
    <>

<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>{pg.kick}</span><div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(56px,9vw,120px)", lineHeight: ".84", letterSpacing: "-.01em", textWrap: "balance" }}>{pg.title}</h1><span lang="ta" style={{ fontFamily: "'Noto Sans Tamil'", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>{pg.ta}</span></div><p style={{ margin: "0", fontSize: "18px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "680px", textWrap: "pretty" }}>{pg.lead}</p></section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "18px clamp(16px,4vw,32px) 0" }}><p style={{ margin: "0", padding: "12px 16px", borderRadius: "14px", border: "1px dashed var(--line2)", fontSize: "14px", lineHeight: "1.5", color: "var(--ink2)" }}>{notice.partners}</p></section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "14px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "16px" }}>
{(partnerEmpty) && (<><p style={{ margin: "0", padding: "18px", borderRadius: "22px", background: "var(--glass)", border: "1px dashed var(--line2)", color: "var(--ink2)" }}>Trusted partners are coming soon.</p></>)}{(partnerList).map((p, _k1) => (<Fragment key={_k1}><article style={{ padding: "20px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "10px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>{p.kind}</span><h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px", lineHeight: "1", fontSize: "30px" }}>{p.n}</h2><p style={{ margin: "0", fontSize: "15px", lineHeight: "1.5", color: "var(--ink2)" }}>{p.d}</p>{(p.hasLic) && (<><span style={{ fontSize: "13px", fontWeight: "800", color: "var(--teal)" }}>✓ {p.lic}</span></>)}<A href={p.href} target="_blank" rel="noopener sponsored" style={{ minHeight: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 22px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", fontSize: "15px", cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap", marginTop: "auto" }}>Visit partner ↗</A></article></Fragment>))}
</section>

    </>
  )
}
