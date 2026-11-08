'use client'
// Eat. Layout ported from TamilTO 3.0 (EAT screen).
import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import A from '../A'
import { useSite, pic } from '../useSite'
import { score, enc } from '@/lib/tto'
import { articleHref } from '@/lib/site'

const art = (a, sz) => ({ t: a.title, tag: a.sponsored ? 'Sponsored' : (a.tags && a.tags[0]) || a.category, href: articleHref(a), tone: a.hero?.tone, ...pic(a.hero, sz) })

export default function EatView({ raw, nowAt, articles }) {
  const { site, all } = useSite(raw, nowAt)
  const router = useRouter()
  const food = all.filter((b) => b.category === 'food').sort((a, b) => (b.isOpen - a.isOpen) || score(b) - score(a))
  const eatOpen = food.slice(0, 12)
  const eatNoneOpen = false
  const cravings = ['catering in Scarborough', 'groceries', 'sweets and snacks', 'cake decorations', 'fish and meat', 'wholesale'].map((q) => ({ label: q, onClick: () => router.push('/directory?q=' + enc(q)) }))
  const kothu = food.filter((b) => /cater/i.test(b.listedAs)).slice(0, 5).map((b, i) => ({ n: b.name, note: b.address || b.city, rank: i + 1, has: true, missing: false, href: b.href }))
  const lead = articles.find((a) => /kothu/i.test(a.slug)) || articles[0]
  const kothuHref = lead ? articleHref(lead) : '', kothuTitle = lead ? lead.title : ''
  const eatArticles = articles.filter((a) => a !== lead).map((a) => art(a, '9px 9px'))
  const firstList = site.collections[0]

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(64px,11vw,140px)", lineHeight: ".82" }}>Eat</h1><span lang="ta" style={{ fontFamily: "var(--tamil)", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>சாப்பாடு</span></div>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--ink2)", maxWidth: "620px" }}>Kothu, dosai, short eats and the spots worth the drive. Saapadu first, always.</p>
<div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>{(cravings).map((c, _k1) => (<Fragment key={_k1}><button type="button" onClick={c.onClick} style={{ flexShrink: "0", whiteSpace: "nowrap", minHeight: "42px", padding: "0 16px", borderRadius: "999px", border: "1px solid var(--line2)", background: "var(--glass2)", color: "var(--ink)", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>{c.label}</button></Fragment>))}</div>
</section>
<section aria-labelledby="open-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0" }}>
<h2 id="open-h" style={{ margin: "0 0 14px", display: "flex", alignItems: "center", gap: "12px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,52px)", lineHeight: "1" }}><span style={{ width: "12px", height: "12px", borderRadius: "99px", background: "#FF6B5E" }}></span>Food, catering & groceries</h2>
{(eatNoneOpen) && (<><p style={{ margin: "0 0 10px", color: "var(--ink2)" }}>Everything’s closed right now, so here’s where to go when they open.</p></>)}
<div style={{ display: "flex", gap: "12px", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "8px" }}>
{(eatOpen).map((v, _k2) => (<Fragment key={_k2}>
<A href={v.href} style={{ flex: "0 0 min(78vw,260px)", scrollSnapAlign: "start", display: "flex", flexDirection: "column", borderRadius: "20px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}>
<span style={{ aspectRatio: "4/3", backgroundColor: v.tone, backgroundImage: v.bgImg, backgroundSize: v.bgSize, backgroundPosition: "center" }}></span>
<span style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "3px" }}><strong style={{ fontSize: "17px", lineHeight: "1.2" }}>{v.n}</strong><span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{v.hoodName} · {v.photo}</span><span style={{ fontSize: "12px", fontWeight: "800", color: v.statusColor }}>{v.status}</span></span>
</A>
</Fragment>))}
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "16px" }}>
<div style={{ padding: "22px", borderRadius: "24px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>In the directory</span>
<h2 style={{ margin: "0 0 6px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "40px", lineHeight: ".95" }}>Caterers to call</h2>
<ol style={{ listStyle: "none", margin: "0", padding: "0", display: "flex", flexDirection: "column" }}>
{(kothu).map((k, _k3) => (<Fragment key={_k3}><li style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}><span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "40px", lineHeight: ".9", color: "var(--red)", minWidth: "28px" }}>{k.rank}</span><span style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}><strong style={{ fontSize: "17px" }}>{k.n}</strong><span style={{ fontSize: "14px", color: "var(--ink2)" }}>{k.note}</span></span>{(k.has) && (<><A href={k.href} style={{ fontWeight: "800", fontSize: "14px", whiteSpace: "nowrap" }}>Open →</A></>)}{(k.missing) && (<><A href="/business" style={{ fontSize: "12px", fontWeight: "700", color: "var(--ink2)", whiteSpace: "nowrap" }}>Not listed yet</A></>)}</li></Fragment>))}
</ol>
{kothuHref && <A href={kothuHref} style={{ fontWeight: "800", marginTop: "6px" }}>Read: {kothuTitle} →</A>}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
{(eatArticles).map((i, _k4) => (<Fragment key={_k4}><A href={i.href} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "12px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}><span style={{ flex: "0 0 88px", height: "88px", borderRadius: "14px", backgroundColor: i.tone, backgroundImage: i.bgImg, backgroundSize: i.bgSize, backgroundPosition: "center" }}></span><span style={{ display: "flex", flexDirection: "column", gap: "4px" }}><span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mariText)" }}>{i.tag}</span><strong style={{ fontFamily: "var(--display)", fontWeight: "800", fontSize: "24px", lineHeight: "1" }}>{i.t}</strong></span></A></Fragment>))}
{firstList && <A href={'/c/' + firstList.id} style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1.5px solid var(--mari)", textDecoration: "none", color: "var(--ink)", display: "flex", flexDirection: "column", gap: "4px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)" }}>Cousin-approved list</span><strong style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "28px" }}>{firstList.title} →</strong></A>}
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px clamp(16px,4vw,32px) 0", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
<A href="/directory?cat=food" style={{ minHeight: "50px", display: "inline-flex", alignItems: "center", padding: "0 22px", borderRadius: "999px", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", textDecoration: "none" }}>All food & catering →</A>
<A href="/directory?cat=events" style={{ minHeight: "50px", display: "inline-flex", alignItems: "center", padding: "0 22px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>Weddings & events →</A>
</section>
    </>
  )
}
