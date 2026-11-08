'use client'
// Business profile. Layout ported from TamilTO 3.0 (BUSINESS PROFILE screen).
import { Fragment } from 'react'
import A from '../A'
import { MapCanvas } from '../canvas'
import { useSite } from '../useSite'
import { focusB, enc, hoursToRanges, fmtH, DAYS_LONG, TONES } from '@/lib/tto'
import { SITE_URL, CONTACT_EMAIL } from '@/lib/site'

const SOCIALS = [['instagram', 'Instagram', 'https://instagram.com/', '#E1306C'], ['facebook', 'Facebook', 'https://facebook.com/', '#1877F2'], ['tiktok', 'TikTok', 'https://tiktok.com/@', '#25F4EE'], ['youtube', 'YouTube', 'https://youtube.com/@', '#FF0000'], ['x', 'X', 'https://x.com/', '#9A9A9A'], ['linkedin', 'LinkedIn', 'https://linkedin.com/company/', '#0A66C2']]
const fixUrl = (u, base) => { u = String(u || '').trim(); if (!u) return ''; if (/^https?:\/\//i.test(u)) return u; u = u.replace(/^@/, ''); return /\./.test(u) && /\//.test(u) ? 'https://' + u : base + u }

export default function BizView({ raw, nowAt, id }) {
  const { site, all, byId, app, now } = useSite(raw, nowAt)
  const b = byId[id]
  const recd = app.recd.includes(b.id)
  const url = SITE_URL + '/b/' + b.id
  const similar = all.filter((x) => x.id !== b.id && (x.neighbourhood === b.neighbourhood || x.category === b.category)).sort((x, y) => (y.category === b.category) - (x.category === b.category)).slice(0, 6)
  const ranges = hoursToRanges(b.hours)
  const hoursRows = ranges
    ? DAYS_LONG.map((d, i) => ({ d, t: ranges[i] ? `${fmtH(ranges[i][0])} – ${fmtH(ranges[i][1])}` : 'Closed', weight: i === now.d ? 800 : 500 }))
    : [{ d: b.byAppointment ? 'By appointment' : 'Hours', t: b.byAppointment ? 'Call or WhatsApp to book.' : 'Not listed yet. Call ahead.', weight: 600 }]
  const pics = b.pics
  const biz = {
    ...b,
    catHref: '/directory?cat=' + b.category,
    hoodHref: '/n/' + b.neighbourhood,
    ta: !!b.speaksTamil,
    addr: b.address || `Serving ${b.city || b.hoodName} and the GTA. Call for location.`,
    tags: [b.listedAs, b.city].filter(Boolean),
    gallery: [['Storefront', '1 / 3', '1'], [b.listedAs || 'Inside', '1', '2 / 4'], [b.city || 'Inside', '2', '2 / 4']].map(([alt, row, col], i) => {
      const u = pics[i]
      return { alt: u ? `${b.name}, photo ${i + 1}` : alt, label: u ? (i === 2 && pics.length > 3 ? `${pics.length} photos` : '') : alt, row, col, tone: TONES[(TONES.indexOf(b.tone) + i * 3) % 8], bgImg: u ? `url("${u}")` : 'radial-gradient(rgba(255,255,255,.16) 1.2px,transparent 1.6px)', bgSize: u ? 'cover' : '14px 14px' }
    }),
    recNow: (b.recommendations || 0) + (recd ? 1 : 0),
    recPressed: recd ? 'true' : 'false',
    recBtn: recd ? '✓ You recommend this' : 'I recommend this',
    recBg: recd ? 'var(--green)' : 'transparent',
    recFg: recd ? '#0E0A07' : 'var(--ink)',
    recommend: () => app.toggleRec(b.id),
    quotes: [],
    contactRows: [b.contactName && { k: 'Contact', v: b.contactName }, b.cell && b.phone && { k: 'Mobile', v: b.cell.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'), href: 'tel:+1' + b.cell }, b.fax && { k: 'Fax', v: b.fax.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') }, b.email && { k: 'Email', v: b.email, href: 'mailto:' + b.email }, b.website && { k: 'Website', v: b.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), href: b.website, ext: true }]
      .filter(Boolean)
      .map((r) => ({ ...r, isLink: !!r.href, isText: !r.href, target: r.ext ? '_blank' : undefined })),
    fixHref: `mailto:${CONTACT_EMAIL}?subject=` + enc('Listing correction: ' + b.name),
    hoursRows,
    jobsList: (b.jobs || []).map((t) => ({ t, apply: `https://wa.me/1${b.cell || b.phone}?text=` + enc(`Hi! I saw on TamilTO that you're hiring: ${t}.`) })),
    dir: b.googleMapsUrl || 'https://www.google.com/maps/search/?api=1&query=' + enc(b.name + ' ' + (b.address || b.city)),
    review: b.googleReviewsUrl || '',
    hasReview: !!b.googleReviewsUrl,
    socials: SOCIALS.map(([k, l, base, c]) => ({ k, l, c, href: fixUrl((b.social || {})[k], base) })).filter((x) => x.href),
    share: 'https://wa.me/?text=' + enc(`${b.name} on TamilTO: ${url}`),
    claimHref: '/business?claim=' + b.id,
    similar,
  }
  biz.hasSocial = biz.socials.length > 0
  const hood = site.hoodByKey[b.neighbourhood]
  const bizCfg = { bounds: focusB(hood, 0.7), pins: all.filter((x) => x.neighbourhood === b.neighbourhood), sel: b.id, focus: b.neighbourhood }

  return (
    <>
<div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "18px" }}>
<nav aria-label="Breadcrumb" style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "14px", fontWeight: "700", color: "var(--ink2)" }}><A href="/directory" style={{ color: "var(--ink2)" }}>Directory</A><span aria-hidden="true">/</span><A href={biz.catHref} style={{ color: "var(--ink2)", whiteSpace: "nowrap" }}>{biz.catLabel}</A><span aria-hidden="true">/</span><A href={biz.hoodHref} style={{ color: "var(--ink2)", whiteSpace: "nowrap" }}>{biz.hoodName}</A></nav>
<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "repeat(2,minmax(0,1fr))", gap: "8px", aspectRatio: "21/8", minHeight: "220px", borderRadius: "24px", overflow: "hidden" }}>
{(biz.gallery).map((g, _k1) => (<Fragment key={_k1}>
<div role="img" aria-label={g.alt} style={{ gridRow: g.row, gridColumn: g.col, position: "relative", backgroundColor: g.tone, backgroundImage: g.bgImg, backgroundSize: g.bgSize, backgroundPosition: "center" }}><span style={{ position: "absolute", left: "12px", bottom: "10px", fontSize: "11px", fontWeight: "700", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.92)", textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>{g.label}</span></div>
</Fragment>))}
</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
<div style={{ flex: "2 1 520px", minWidth: "0", display: "flex", flexDirection: "column", gap: "18px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "800", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink2)" }}><span style={{ width: "10px", height: "10px", borderRadius: "99px", background: biz.catColor }}></span>{biz.catLabel} · {biz.hoodName}</span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(46px,7vw,84px)", lineHeight: ".88", textWrap: "balance" }}>{biz.n}</h1>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
{(biz.unclaimed) && (<><span style={{ display: "inline-flex", alignItems: "center", minHeight: "32px", padding: "0 12px", borderRadius: "999px", border: "1.5px dashed var(--line2)", fontSize: "13px", fontWeight: "800", color: "var(--ink2)" }}>Unclaimed listing</span></>)}{(biz.ver) && (<><span style={{ display: "inline-flex", alignItems: "center", gap: "6px", minHeight: "32px", padding: "0 12px", borderRadius: "999px", background: "var(--glass2)", border: "1.5px solid var(--teal)", fontSize: "13px", fontWeight: "800", color: "var(--teal)" }}>✓ Verified Tamil-owned</span></>)}
{(biz.feat) && (<><span style={{ display: "inline-flex", alignItems: "center", minHeight: "32px", padding: "0 12px", borderRadius: "999px", background: "#F5B83D", color: "#1A1410", fontSize: "13px", fontWeight: "800" }}>Featured partner</span></>)}
{(biz.ta) && (<><span style={{ display: "inline-flex", alignItems: "center", minHeight: "32px", padding: "0 12px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "13px", fontWeight: "700" }}>Tamil-speaking staff</span></>)}
</div>
<p style={{ margin: "0", fontSize: "19px", lineHeight: "1.55", maxWidth: "680px" }}>{biz.short}</p>
<span style={{ fontSize: "15px", fontWeight: "800", color: biz.statusColor }}>● {biz.status}</span>
</div>
{(biz.hasDeal) && (<><div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", padding: "16px 18px", borderRadius: "18px", background: "var(--glass)", border: "1.5px dashed var(--mari)" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mariText)" }}>Deal</span><strong style={{ fontSize: "17px", flex: "1 1 240px" }}>{biz.deal}</strong><span style={{ fontSize: "13px", color: "var(--ink2)" }}>Mention TamilTO</span></div></>)}
<section aria-labelledby="known-h" style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<h2 id="known-h" style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink2)" }}>Listed under</h2>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{(biz.tags).map((t, _k2) => (<Fragment key={_k2}><span style={{ minHeight: "36px", display: "inline-flex", alignItems: "center", padding: "0 14px", borderRadius: "999px", background: "var(--glass2)", border: "1px solid var(--line2)", fontWeight: "700", fontSize: "14px" }}>{t}</span></Fragment>))}</div>
</section>
<section aria-labelledby="rec-h" style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
<h2 id="rec-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "56px", lineHeight: ".9", color: "var(--green)" }}>{biz.recNow}</h2>
<span style={{ display: "flex", flexDirection: "column" }}><strong style={{ fontSize: "17px" }}>cousin recommendations</strong><span style={{ fontSize: "14px", color: "var(--ink2)" }}>Used them? Vouch for them.</span></span>
<span style={{ flex: "1" }}></span>
<button type="button" onClick={biz.recommend} aria-pressed={biz.recPressed} style={{ minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "1.5px solid var(--green)", background: biz.recBg, color: biz.recFg, fontWeight: "800", cursor: "pointer" }}>{biz.recBtn}</button>
</div>
{(biz.quotes).map((q, _k3) => (<Fragment key={_k3}><blockquote style={{ margin: "0", padding: "12px 0 0", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "4px" }}><p style={{ margin: "0", fontSize: "16px", lineHeight: "1.5" }}>“{q.t}”</p><cite style={{ fontStyle: "normal", fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>{q.who}</cite></blockquote></Fragment>))}
</section>
<section aria-labelledby="hrs-h" style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<h2 id="hrs-h" style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ink2)" }}>Hours</h2>
{(biz.hoursRows).map((h, _k4) => (<Fragment key={_k4}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderTop: "1px solid var(--line)", fontWeight: h.weight }}><span>{h.d}</span><span>{h.t}</span></div></Fragment>))}
</section>
{(biz.hiring) && (<>
<section aria-labelledby="jobs-h" style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1.5px solid var(--green)", display: "flex", flexDirection: "column", gap: "10px" }}>
<h2 id="jobs-h" style={{ margin: "0", fontSize: "13px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--green)" }}>Now hiring</h2>
{(biz.jobsList).map((j, _k5) => (<Fragment key={_k5}><div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", paddingTop: "10px", borderTop: "1px solid var(--line)" }}><strong style={{ flex: "1 1 220px", fontSize: "17px" }}>{j.t}</strong><A href={j.apply} target="_blank" rel="noopener noreferrer" style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Apply on WhatsApp</A></div></Fragment>))}
</section>
</>)}
<div style={{ position: "relative", aspectRatio: "16/9", borderRadius: "22px", overflow: "hidden", background: "var(--glass)", border: "1px solid var(--line)" }}>
<MapCanvas cfg={bizCfg} site={site} />
<A href={biz.dir} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", right: "12px", bottom: "12px", minHeight: "42px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Directions ↗</A>
</div>
</div>
<aside aria-label="Contact" style={{ flex: "1 1 300px", minWidth: "min(100%,280px)", position: "sticky", top: "84px", display: "flex", flexDirection: "column", gap: "10px", padding: "18px", borderRadius: "22px", background: "var(--glass2)", border: "1px solid var(--line2)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "var(--shadow)" }}>
{(biz.hasWa) && (<><A href={biz.wa} target="_blank" rel="noopener noreferrer" style={{ minHeight: "52px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", fontSize: "16px", textDecoration: "none" }}>Message on WhatsApp</A></>)}
<div style={{ display: "flex", gap: "8px" }}>
{(biz.hasPhone) && (<><A href={biz.tel} style={{ flex: "1", minHeight: "46px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>Call</A></>)}
<button type="button" onClick={biz.toggleSave} aria-pressed={biz.savedAria} style={{ flex: "1", minHeight: "46px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", cursor: "pointer" }}>{biz.heart} Save</button>
<A href={biz.share} target="_blank" rel="noopener noreferrer" style={{ flex: "1", minHeight: "46px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>Share</A>
</div>
{(biz.quote) && (<><button type="button" onClick={biz.getQuote} style={{ minHeight: "50px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "15px", cursor: "pointer" }}>Request a quote</button></>)}
<dl style={{ margin: "6px 0 0", display: "flex", flexDirection: "column", gap: "10px", fontSize: "15px" }}>
<div><dt style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink2)" }}>Address</dt><dd style={{ margin: "2px 0 0" }}>{biz.addr}</dd></div>
<div><dt style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink2)" }}>Phone</dt><dd style={{ margin: "2px 0 0" }}><A href={biz.tel}>{biz.phoneFmt}</A></dd></div>
{(biz.contactRows).map((r, _k6) => (<Fragment key={_k6}><div><dt style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink2)" }}>{r.k}</dt><dd style={{ margin: "2px 0 0", overflowWrap: "anywhere" }}>{(r.isLink) && (<><A href={r.href} target={r.target} rel="noopener noreferrer">{r.v}</A></>)}{(r.isText) && (<>{r.v}</>)}</dd></div></Fragment>))}
</dl>
<A href={biz.fixHref} style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)" }}>Wrong info? Tell us</A>
{(biz.hasSocial) && (<><div style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--ink2)" }}>Follow</span><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{(biz.socials).map((so, _k7) => (<Fragment key={_k7}><A href={so.href} target="_blank" rel="noopener noreferrer" style={{ minHeight: "40px", display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 14px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap" }}><span style={{ width: "8px", height: "8px", borderRadius: "99px", background: so.c }}></span>{so.l}</A></Fragment>))}</div></div></>)}
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}><A href={biz.dir} target="_blank" rel="noopener noreferrer" style={{ flex: "1 1 auto", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 14px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap" }}>Google Maps ↗</A>{(biz.hasReview) && (<><A href={biz.review} target="_blank" rel="noopener noreferrer" style={{ flex: "1 1 auto", minHeight: "44px", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 14px", borderRadius: "999px", border: "1.5px solid var(--mari)", color: "var(--ink)", fontWeight: "800", fontSize: "14px", textDecoration: "none", whiteSpace: "nowrap" }}>Google reviews ↗</A></>)}</div>
<A href={biz.claimHref} style={{ fontSize: "13px", fontWeight: "700", color: "var(--ink2)", marginTop: "4px" }}>Is this your business? Claim it, free →</A>
</aside>
</div>
<section aria-labelledby="sim-h" style={{ paddingTop: "16px" }}>
<h2 id="sim-h" style={{ margin: "0 0 14px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "40px", lineHeight: "1" }}>Also nearby</h2>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,280px),1fr))", gap: "10px" }}>
{(biz.similar).map((v, _k8) => (<Fragment key={_k8}>
<A href={v.href} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "18px", background: "var(--glass)", border: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)" }}>
<span style={{ flex: "0 0 60px", height: "60px", borderRadius: "12px", backgroundColor: v.tone, backgroundImage: v.bgImg, backgroundSize: v.bgSize, backgroundPosition: "center" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}><strong style={{ lineHeight: "1.2" }}>{v.n}</strong><span style={{ fontSize: "12px", color: "var(--ink2)", fontWeight: "600" }}>{v.catLabel} · {v.hoodName}</span><span style={{ fontSize: "12px", fontWeight: "800", color: v.statusColor }}>{v.status}</span></span>
</A>
</Fragment>))}
</div>
</section>
</div>
    </>
  )
}
