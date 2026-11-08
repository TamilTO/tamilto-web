'use client'
// Events. Layout ported from TamilTO 3.0 (EVENTS screen); each event links to its own page and .ics file.
import { Fragment, useMemo, useState } from 'react'
import A from '../A'
import { pic } from '../useSite'
import { indexSite } from '@/lib/tto'
import { eventCard } from '@/lib/tto-events'
import { ymd, addDays } from '@/lib/dates.mjs'
import { track as plausible } from '@/lib/client'

export default function EventsView({ raw, events }) {
  const site = useMemo(() => indexSite({ ...raw, businesses: [] }), [raw])
  const [when, setWhen] = useState('all')
  const [type, setType] = useState('All')
  const chip = (label, active, onClick) => ({ label, onClick, pressed: active ? 'true' : 'false', bg: active ? 'var(--ink)' : 'var(--glass2)', fg: active ? 'var(--bg)' : 'var(--ink)', border: active ? 'var(--ink)' : 'var(--line2)' })
  const evs = useMemo(() => events.map((e) => ({ ...eventCard(e, site.hoodByKey), ...pic(e.image), date: ymd(e.start) })), [events, site])
  const today = ymd(), wk = addDays(today, 7), mo = today.slice(0, 7)
  const types = ['All', ...[...new Set(evs.map((e) => e.type))].sort()]
  const evList = evs.filter((e) => (when === 'all' || (when === 'week' ? e.date <= wk : e.date.slice(0, 7) === mo)) && (type === 'All' || e.type === type))
  const evEmpty = !evList.length
  const evWhenChips = [['all', 'All upcoming'], ['week', 'Next 7 days'], ['month', 'This month']].map(([k, l]) => chip(l, when === k, () => setWhen(k)))
  const evTypeChips = types.map((t) => chip(t, type === t, () => setType(t)))

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "36px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 16px" }}><h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(64px,11vw,140px)", lineHeight: ".82" }}>Events</h1><span lang="ta" style={{ fontFamily: "var(--tamil)", fontWeight: "700", fontSize: "22px", color: "var(--mariText)" }}>நிகழ்வுகள்</span></div>
<p style={{ margin: "0", fontSize: "18px", lineHeight: "1.5", color: "var(--ink2)", maxWidth: "620px" }}>Festivals, concerts, movie nights and everything worth leaving the house for, many of them hosted by businesses in the directory.</p>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
{(evWhenChips).map((c, _k1) => (<Fragment key={_k1}><button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ whiteSpace: "nowrap", minHeight: "42px", padding: "0 16px", borderRadius: "999px", border: `1.5px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>{c.label}</button></Fragment>))}
<span style={{ width: "1px", height: "28px", background: "var(--line2)" }}></span>
{(evTypeChips).map((c, _k2) => (<Fragment key={_k2}><button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ whiteSpace: "nowrap", minHeight: "40px", padding: "0 14px", borderRadius: "999px", border: `1px solid ${c.border}`, background: c.bg, color: c.fg, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>{c.label}</button></Fragment>))}
<span style={{ flex: "1" }}></span>
<A href="/submit?type=event" style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", padding: "0 16px", borderRadius: "999px", background: "var(--mari)", color: "#1A1410", fontWeight: "800", fontSize: "14px", textDecoration: "none" }}>Submit an event</A>
</div>
</section>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "20px clamp(16px,4vw,32px) 0", display: "flex", flexDirection: "column", gap: "14px" }}>
{(evEmpty) && (<><p style={{ margin: "0", padding: "32px", borderRadius: "22px", border: "1px dashed var(--line2)", textAlign: "center", color: "var(--ink2)" }}>Nothing matches. Try another filter.</p></>)}
{(evList).map((e, _k3) => (<Fragment key={_k3}>
<article style={{ display: "flex", flexWrap: "wrap", gap: "18px", padding: "14px", borderRadius: "24px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
<div role="img" aria-label={e.t} style={{ flex: "1 1 260px", maxWidth: "100%", aspectRatio: "16/10", borderRadius: "16px", position: "relative", backgroundColor: e.tone, backgroundImage: e.bgImg, backgroundSize: e.bgSize, backgroundPosition: "center" }}>
<span style={{ position: "absolute", left: "12px", top: "12px", width: "66px", borderRadius: "14px", background: "var(--mari)", color: "#1A1410", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", fontSize: "11px", fontWeight: "800", letterSpacing: ".1em" }}><span>{e.dow}</span><span style={{ fontFamily: "var(--display)", fontSize: "32px", lineHeight: "1", letterSpacing: "0" }}>{e.day}</span><span>{e.mon}</span></span>
</div>
<div style={{ flex: "3 1 320px", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px", padding: "4px" }}>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--teal)" }}>{e.type}</span>{(e.soldOut) && (<><span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".12em", textTransform: "uppercase", color: "var(--red)" }}>Sold out</span></>)}</div>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(30px,3.5vw,40px)", lineHeight: ".95" }}><A href={e.href} style={{ color: "var(--ink)", textDecoration: "none" }}>{e.t}</A></h2>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.5", color: "var(--ink2)" }}>{e.d}</p>
<span style={{ fontSize: "15px", fontWeight: "700" }}>{e.time} · {e.venue}, <A href={e.hoodHref}>{e.hoodName}</A> · {e.priceLabel}</span>
{(e.hasHost) && (<><span style={{ fontSize: "14px", color: "var(--ink2)" }}>Hosted by <A href={e.hostHref} style={{ fontWeight: "800" }}>{e.hostName}</A></span></>)}
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}><A href={e.ticket} target="_blank" rel="noopener noreferrer" style={{ minHeight: "46px", display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: "999px", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", textDecoration: "none" }}>{e.ticketLabel}</A><A href={e.ics} onClick={() => plausible('Add To Calendar')} style={{ minHeight: "46px", display: "inline-flex", alignItems: "center", padding: "0 20px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>Add to calendar</A><A href={e.href} style={{ minHeight: "46px", display: "inline-flex", alignItems: "center", padding: "0 12px", color: "var(--ink)", fontWeight: "800" }}>Details →</A></div>
</div>
</article>
</Fragment>))}
</section>
    </>
  )
}
