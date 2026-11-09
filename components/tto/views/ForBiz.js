'use client'
// For businesses: perks, claim or add a listing, pricing. Layout ported from TamilTO 3.0 (FOR BUSINESSES screen).
// The claim goes to TamilTO's review queue. Nothing is published, and nothing is charged, until the team checks it.
import { Fragment, useEffect, useRef, useState } from 'react'
import A from '../A'
import { useSite } from '../useSite'
import { enc, fmtPhone, QR } from '@/lib/tto'
import { SITE_URL } from '@/lib/site'
import { track } from '../App'
import { track as plausible } from '@/lib/client'

const PERKS = [
  { t: 'A glowing pin on the Live GTA map', d: 'Featured pins pulse, so people spot you while they explore.', c: '#F5B83D' },
  { t: 'One-tap WhatsApp & calls', d: 'Customers message you straight from your listing.', c: '#5FC98A' },
  { t: 'Quote requests', d: 'Wedding and event planners ask several businesses for quotes at once. You’re on the list.', c: '#FF6B7D' },
  { t: 'Stories, deals & jobs', d: 'Post an offer or a job and it shows up across the site.', c: '#9C86F0' },
]
const HOW = [
  { n: '1', t: 'Claim', d: 'Find your business, or add it if you’re new.' },
  { n: '2', t: 'Verify', d: 'We call or WhatsApp the business number to confirm. Then we add the Verified Tamil-owned badge.' },
  { n: '3', t: 'Grow', d: 'Get WhatsApp messages, calls and quote requests from people who find you.' },
]
const START = { step: 1, q: '', pick: null, plan: 'free', ok: false, details: null, err: '', sending: false, sendErr: '', draftName: '' }

export default function ForBizView({ raw, nowAt, claimId }) {
  const { site, all, byId } = useSite(raw, nowAt)
  const [c, setCS] = useState(START)
  const [billing, setBilling] = useState('monthly')
  const setC = (o) => setCS((x) => ({ ...x, ...o }))
  const claimRef = useRef(false)
  const scrollClaim = () => { const el = document.getElementById('claim'); el && window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }) }
  useEffect(() => {
    if (claimId && byId[claimId] && !claimRef.current) { claimRef.current = true; setC({ pick: claimId, step: 2 }); setTimeout(scrollClaim, 50) }
  }, [claimId, byId])

  const TIERS = site.plans
  const tier = TIERS.find((t) => t.key === c.plan) || TIERS[0]
  const pb = c.pick && c.pick !== 'new' ? byId[c.pick] : null
  const perks = site.perks && site.perks.length ? site.perks : PERKS, howSteps = site.how && site.how.length ? site.how : HOW
  const claimBar = [1, 2, 3, 4].map((i) => ({ c: i <= c.step ? 'var(--mari)' : 'var(--line2)' }))
  const q = c.q.trim().toLowerCase()
  const claim = {
    step: c.step, s1: c.step === 1, s2: c.step === 2, s3: c.step === 3, s4: c.step === 4,
    q: c.q, onQ: (e) => setC({ q: e.target.value }),
    results: (q.length >= 2 ? all.filter((b) => b.name.toLowerCase().includes(q)) : all.slice(0, 4)).slice(0, 4).map((b) => ({ n: b.name, sub: `${b.catLabel} · ${b.hoodName}`, pick: () => setC({ pick: b.id, step: 2, err: '' }) })),
    addNew: () => setC({ pick: 'new', step: 2, err: '' }),
    formTitle: pb ? 'Check and complete your listing' : 'Add your business',
    formKey: 'f-' + (c.pick || 'new'),
    catOpts: site.categories.map((x) => ({ k: x.key, l: x.label })),
    hoodOpts: site.neighbourhoods.map((h) => ({ k: h.key, n: h.name })),
    pf: pb ? { n: pb.name, cat: pb.category, hood: pb.neighbourhood, addr: pb.address || '', city: pb.city || '', short: pb.short && !/^Serving /.test(pb.short) ? pb.short : '', tagsTxt: pb.listedAs || '', contact: pb.contactName || '', phoneFmt: fmtPhone(pb.phone || pb.cell), email: pb.email || '', web: pb.website || '' } : { n: c.q || '', cat: '', hood: '', addr: '', city: '', short: '', tagsTxt: '', contact: '', phoneFmt: '', email: '', web: '' },
    submitDetails: (e) => {
      e.preventDefault()
      const files = [...(e.target.photos?.files || [])]
      if (files.some((f) => f.size > 10 * 1024 * 1024 || !/^image\//.test(f.type))) return setC({ err: 'Photos must be images under 10 MB each.' })
      setC({ step: 3, err: '', details: new FormData(e.target), draftName: e.target.biz.value })
      scrollClaim()
    },
    name: c.draftName || (pb ? pb.name : c.q || 'Your business'),
    hasErr: !!c.err, err: c.err,
    back: () => setC({ step: 1, pick: null }),
    plans: TIERS.map((t) => ({ name: t.name, price: t.monthly ? `$${t.monthly}/mo` : 'Free', d: t.description, on: t.key === c.plan ? 'true' : 'false', border: t.key === c.plan ? 'var(--mari)' : 'var(--line2)', pick: () => setC({ plan: t.key }) })),
    ok: c.ok, notOk: !c.ok, btnOpacity: c.ok && !c.sending ? 1 : 0.5,
    toggleOk: () => setC({ ok: !c.ok }),
    sending: c.sending, sendErr: c.sendErr,
    finish: async () => {
      if (!c.ok || c.sending) return
      const fd = c.details
      fd.set('plan', c.plan)
      fd.set('claimOf', pb ? pb.id : '')
      fd.set('tamilOwnedConfirmed', 'yes')
      setC({ sending: true, sendErr: '' })
      try {
        const r = await fetch('/api/claims', { method: 'POST', body: fd })
        const j = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(j.error || 'We couldn’t send that. Please try again.')
        track('listing', pb ? pb.id : '', c.plan)
        plausible('Submission', { kind: 'listing' })
        setC({ step: 4, sending: false })
        scrollClaim()
      } catch (err) { setC({ sending: false, sendErr: err.message }) }
    },
    planName: tier.name,
    listingHref: pb ? '/b/' + pb.id : '/directory',
    shareHref: 'https://wa.me/?text=' + enc(`Find ${pb ? pb.name : 'us'} on TamilTO: ${SITE_URL}/${pb ? 'b/' + pb.id : 'directory'}`),
    reset: () => setCS(START),
  }
  const yr = billing === 'yearly'
  const chip = (label, active, onClick) => ({ label, onClick, pressed: active ? 'true' : 'false', bg: active ? 'var(--ink)' : 'var(--glass2)', fg: active ? 'var(--bg)' : 'var(--ink)', border: active ? 'var(--ink)' : 'var(--line2)' })
  const billingChips = [['monthly', 'Monthly'], ['yearly', 'Yearly · 2 months free']].map(([k, l]) => chip(l, billing === k, () => setBilling(k)))
  const tiers = TIERS.map((t) => ({ name: t.name, d: t.description, f: t.features, price: t.monthly ? `$${yr ? t.yearly : t.monthly}` : '$0', per: t.monthly ? (yr ? '/ year' : '/ month') : 'forever', popular: t.key === 'featured', border: t.key === 'featured' ? '2px solid var(--mari)' : '1px solid var(--line)', glow: t.key === 'featured' ? '0 24px 60px rgba(245,184,61,.18)' : 'none', cta: t.monthly ? `Start ${t.name}` : 'Claim free listing', btnBg: t.key === 'featured' ? 'var(--act)' : 'transparent', btnFg: t.key === 'featured' ? '#fff' : 'var(--ink)', pick: () => setC({ plan: t.key }) }))
  const qr = QR

  return (
    <>
<section style={{ maxWidth: "1320px", margin: "0 auto", padding: "40px clamp(16px,4vw,32px) 0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,460px),1fr))", gap: "32px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>For Tamil-owned businesses</span>
<h1 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(54px,8vw,108px)", lineHeight: ".84", textWrap: "balance" }}>Put your business on the map. <span style={{ color: "var(--red)" }}>Literally.</span></h1>
<p style={{ margin: "0", fontSize: "19px", lineHeight: "1.55", color: "var(--ink2)", maxWidth: "560px" }}>Tamil Toronto already searches here for kothu, caterers, sarees and dentists. Claim your listing in two minutes and start getting WhatsApp messages and quote requests.</p>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><A href="#claim" style={{ minHeight: "52px", display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: "999px", background: "var(--act)", color: "#fff", fontWeight: "800", textDecoration: "none" }}>Claim your free listing</A><A href="#pricing" style={{ minHeight: "52px", display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: "999px", border: "1.5px solid var(--line2)", color: "var(--ink)", fontWeight: "800", textDecoration: "none" }}>See pricing</A></div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "12px" }}>
{(perks).map((p, _k1) => (<Fragment key={_k1}>
<div style={{ padding: "18px", borderRadius: "20px", background: "var(--glass)", border: "1px solid var(--line)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ width: "28px", height: "6px", borderRadius: "99px", background: p.c }}></span><strong style={{ fontSize: "17px", lineHeight: "1.25" }}>{p.t}</strong><span style={{ fontSize: "14px", lineHeight: "1.45", color: "var(--ink2)" }}>{p.d}</span></div>
</Fragment>))}
</div>
</section>
<section aria-labelledby="how-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<h2 id="how-h" style={{ margin: "0 0 18px", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>Three steps. No tech skills needed.</h2>
<ol style={{ listStyle: "none", margin: "0", padding: "0", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: "14px" }}>
{(howSteps).map((h, _k2) => (<Fragment key={_k2}><li style={{ padding: "20px", borderRadius: "22px", background: "var(--glass)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "56px", lineHeight: ".85", color: "var(--mari)" }}>{h.n}</span><strong style={{ fontSize: "19px" }}>{h.t}</strong><span style={{ color: "var(--ink2)", lineHeight: "1.5" }}>{h.d}</span></li></Fragment>))}
</ol>
</section>
<section id="claim" aria-labelledby="claim-h" style={{ maxWidth: "860px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0", scrollMarginTop: "90px" }}>
<div style={{ padding: "clamp(20px,4vw,36px)", borderRadius: "28px", background: "var(--glass2)", border: "1.5px solid var(--mari)", boxShadow: "var(--shadow)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", flexDirection: "column", gap: "18px" }}>
<div style={{ display: "flex", gap: "6px" }} aria-hidden="true">{(claimBar).map((b, _k3) => (<Fragment key={_k3}><span style={{ flex: "1", height: "6px", borderRadius: "99px", background: b.c }}></span></Fragment>))}</div>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Step {claim.step} of 4</span>
{(claim.s1) && (<>
<h2 id="claim-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,48px)", lineHeight: ".95" }}>Find your business</h2>
<label htmlFor="claim-q" style={{ fontWeight: "700", fontSize: "14px" }}>Business name</label>
<input id="claim-q" type="search" value={claim.q} onChange={claim.onQ} placeholder="e.g. Kuyil Bakery" style={{ minHeight: "54px", padding: "0 18px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "17px" }} />
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
{(claim.results).map((c, _k4) => (<Fragment key={_k4}><div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 10px 10px 14px", borderRadius: "16px", border: "1px solid var(--line)" }}><span style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}><strong>{c.n}</strong><span style={{ fontSize: "13px", color: "var(--ink2)" }}>{c.sub}</span></span><button type="button" onClick={c.pick} style={{ minHeight: "42px", padding: "0 16px", borderRadius: "999px", border: "0", background: "var(--ink)", color: "var(--bg)", fontWeight: "800", cursor: "pointer" }}>This is mine</button></div></Fragment>))}
</div>
<button type="button" onClick={claim.addNew} style={{ alignSelf: "flex-start", minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "1.5px dashed var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", cursor: "pointer" }}>Not listed? Add a new business</button>
</>)}
{(claim.s2) && (<>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,48px)", lineHeight: ".95" }}>{claim.formTitle}</h2>
<p style={{ margin: "0", fontSize: "15px", lineHeight: "1.5", color: "var(--ink2)" }}>Fill in everything you can. Our team checks every listing by phone before it goes live, usually within a day, and then adds your Verified Tamil-owned badge.</p>
<form key={claim.formKey} onSubmit={claim.submitDetails} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<input name="company_website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
<h3 style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)" }}>The business</h3>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Business name *<input name="biz" required={true} defaultValue={claim.pf.n} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Category *<select name="cat" required={true} defaultValue={claim.pf.cat} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }}><option value="">Choose…</option>{(claim.catOpts).map((o, _k5) => (<Fragment key={_k5}><option value={o.k}>{o.l}</option></Fragment>))}</select></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Area *<select name="area" required={true} defaultValue={claim.pf.hood} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }}><option value="">Choose…</option>{(claim.hoodOpts).map((o, _k6) => (<Fragment key={_k6}><option value={o.k}>{o.n}</option></Fragment>))}</select></label></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Street address *<input name="addr" required={true} autoComplete="street-address" defaultValue={claim.pf.addr} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>City<input name="city" autoComplete="address-level2" defaultValue={claim.pf.city} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Postal code<input name="postal" autoComplete="postal-code" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>One-line description *<input name="short" required={true} placeholder="e.g. Jaffna-style catering for 50 to 1,000 guests" defaultValue={claim.pf.short} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Known for (comma separated)<input name="tags" placeholder="e.g. Kothu, biryani, party trays" defaultValue={claim.pf.tagsTxt} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Services, menu or price list<textarea name="services" rows="3" placeholder="What you offer, specialties, starting prices…" style={{ padding: "12px 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", resize: "vertical", width: "100%" }}></textarea></label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Opening hours<textarea name="hours" rows="3" placeholder="e.g. Mon–Fri 9 AM–6 PM · Sat 10 AM–4 PM · Sun closed, or “By appointment”" style={{ padding: "12px 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", resize: "vertical", width: "100%" }}></textarea></label>
<h3 style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)" }}>Contact</h3>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Owner or contact name *<input name="contact" required={true} autoComplete="name" defaultValue={claim.pf.contact} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Your role<select name="role" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }}><option>Owner</option><option>Manager</option><option>Staff</option><option>Family member</option></select></label></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Business phone *<input name="phone" required={true} type="tel" autoComplete="tel" defaultValue={claim.pf.phoneFmt} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>WhatsApp (if different)<input name="whatsapp" type="tel" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label></div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Email *<input name="email" required={true} type="email" autoComplete="email" defaultValue={claim.pf.email} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Website<input name="web" type="url" placeholder="https://" defaultValue={claim.pf.web} style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label></div>
<h3 style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)" }}>Online</h3>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap: "12px" }}><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Instagram<input name="instagram" placeholder="@yourbusiness" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Facebook<input name="facebook" placeholder="facebook.com/…" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>TikTok<input name="tiktok" placeholder="@yourbusiness" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label><label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Google Maps link<input name="gmap" type="url" placeholder="https://maps.app.goo.gl/…" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label></div>
<h3 style={{ margin: "6px 0 0", fontSize: "12px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "var(--mariText)" }}>Extras</h3>
<fieldset style={{ border: "0", margin: "0", padding: "0", display: "flex", flexDirection: "column", gap: "8px" }}><legend style={{ fontWeight: "700", fontSize: "14px", marginBottom: "6px", padding: "0" }}>Languages spoken</legend><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="lang" value="Tamil" style={{ width: "18px", height: "18px" }} />Tamil</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="lang" value="English" style={{ width: "18px", height: "18px" }} />English</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="lang" value="French" style={{ width: "18px", height: "18px" }} />French</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="lang" value="Sinhala" style={{ width: "18px", height: "18px" }} />Sinhala</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="lang" value="Hindi" style={{ width: "18px", height: "18px" }} />Hindi</label></div></fieldset>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="quotes" value="yes" style={{ width: "18px", height: "18px" }} />We take quote requests</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="hiring" value="yes" style={{ width: "18px", height: "18px" }} />We’re hiring</label><label style={{ display: "inline-flex", gap: "8px", alignItems: "center", minHeight: "42px", padding: "0 14px", borderRadius: "999px", border: "1px solid var(--line2)", fontSize: "14px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}><input type="checkbox" name="delivery" value="yes" style={{ width: "18px", height: "18px" }} />Delivery or home visits</label></div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Current deal (optional)<input name="deal" placeholder="e.g. 10% off party trays for TamilTO readers" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Job openings (optional)<input name="jobs" placeholder="e.g. Line cook, weekend server" style={{ minHeight: "50px", padding: "0 14px", borderRadius: "12px", border: "1.5px solid var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "16px", width: "100%" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: "700", fontSize: "14px" }}>Photos (at least 3: storefront, inside, what you sell)<input name="photos" type="file" accept="image/*" multiple={true} style={{ padding: "12px", borderRadius: "12px", border: "1.5px dashed var(--line2)", background: "var(--glass)", color: "var(--ink)", fontSize: "15px", width: "100%" }} /></label>
<span style={{ fontSize: "13px", color: "var(--ink2)", marginTop: "-6px" }}>No photos handy? Skip this, and we’ll collect them on WhatsApp.</span>
<label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", lineHeight: "1.45" }}><input type="checkbox" name="consent" required={true} style={{ width: "20px", height: "20px", marginTop: "2px", flexShrink: "0" }} />I confirm this business is Tamil-owned, I’m allowed to list it, and TamilTO can contact me to verify the details.</label>
{(claim.hasErr) && (<><span role="alert" style={{ color: "var(--red)", fontWeight: "700" }}>{claim.err}</span></>)}
<div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}><button type="submit" style={{ minHeight: "52px", padding: "0 24px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", fontSize: "16px", cursor: "pointer" }}>Save details and continue</button><button type="button" onClick={claim.back} style={{ border: "0", background: "none", color: "var(--ink2)", fontWeight: "700", textDecoration: "underline", cursor: "pointer", padding: "0" }}>← Pick a different business</button></div>
</form>
</>)}
{(claim.s3) && (<>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(34px,4.5vw,48px)", lineHeight: ".95" }}>Pick your plan</h2>
<div role="radiogroup" aria-label="Plan" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))", gap: "10px" }}>
{(claim.plans).map((p, _k7) => (<Fragment key={_k7}><button type="button" role="radio" aria-checked={p.on} onClick={p.pick} style={{ textAlign: "left", padding: "16px", borderRadius: "18px", border: `2px solid ${p.border}`, background: "var(--glass)", color: "var(--ink)", cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px" }}><strong style={{ fontSize: "18px" }}>{p.name}</strong><span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "32px" }}>{p.price}</span><span style={{ fontSize: "13px", color: "var(--ink2)" }}>{p.d}</span></button></Fragment>))}
</div>
<label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "15px", lineHeight: "1.45" }}><input type="checkbox" checked={claim.ok} onChange={claim.toggleOk} style={{ width: "20px", height: "20px", marginTop: "2px", flexShrink: "0" }} />I confirm this business is Tamil-owned. TamilTO may check with a quick call before adding the Verified badge.</label>
{(claim.sendErr) && (<><span role="alert" style={{ color: "var(--red)", fontWeight: "700" }}>{claim.sendErr}</span></>)}
<button type="button" onClick={claim.finish} disabled={claim.notOk || claim.sending} style={{ alignSelf: "flex-start", minHeight: "52px", padding: "0 24px", borderRadius: "999px", border: "0", background: "var(--act)", color: "#fff", fontWeight: "800", cursor: "pointer", opacity: claim.btnOpacity }}>{claim.sending ? 'Sending…' : 'Send for review'}</button>
</>)}
{(claim.s4) && (<>
<h2 style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,56px)", lineHeight: ".92" }}>Nandri! We’ve got your details.</h2>
<p style={{ margin: "0", fontSize: "17px", lineHeight: "1.5" }}>We’ll call or WhatsApp you to confirm {claim.name}, usually within a day. Your listing and Verified badge go live after that check. You picked the <strong>{claim.planName}</strong> plan; paid plans are invoiced only after you approve.</p>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}><A href={claim.listingHref} style={{ minHeight: "52px", display: "inline-flex", alignItems: "center", padding: "0 24px", borderRadius: "999px", background: "var(--act)", color: "#fff", fontWeight: "800", textDecoration: "none" }}>See my listing</A><A href={claim.shareHref} target="_blank" rel="noopener noreferrer" style={{ minHeight: "52px", display: "inline-flex", alignItems: "center", padding: "0 22px", borderRadius: "999px", background: "#1F7A4D", color: "#fff", fontWeight: "800", textDecoration: "none" }}>Share on WhatsApp</A><button type="button" onClick={claim.reset} style={{ minHeight: "52px", padding: "0 22px", borderRadius: "999px", border: "1.5px solid var(--line2)", background: "transparent", color: "var(--ink)", fontWeight: "800", cursor: "pointer" }}>Claim another</button></div>
</>)}
</div>
</section>
<section id="pricing" aria-labelledby="price-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0", scrollMarginTop: "90px" }}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "12px 20px", marginBottom: "18px" }}>
<h2 id="price-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,60px)", lineHeight: ".92" }}>Simple pricing</h2>
<span style={{ flex: "1" }}></span>
<div role="group" aria-label="Billing" style={{ display: "flex", border: "1.5px solid var(--line2)", borderRadius: "999px", overflow: "hidden", background: "var(--glass2)" }}>{(billingChips).map((c, _k8) => (<Fragment key={_k8}><button type="button" onClick={c.onClick} aria-pressed={c.pressed} style={{ whiteSpace: "nowrap", minHeight: "42px", padding: "0 16px", border: "0", background: c.bg, color: c.fg, fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>{c.label}</button></Fragment>))}</div>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))", gap: "14px" }}>
{(tiers).map((t, _k9) => (<Fragment key={_k9}>
<div style={{ position: "relative", padding: "24px", borderRadius: "24px", background: "var(--glass)", border: t.border, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", flexDirection: "column", gap: "12px", boxShadow: t.glow }}>
{(t.popular) && (<><span style={{ position: "absolute", right: "18px", top: "18px", background: "#F5B83D", color: "#1A1410", fontSize: "11px", fontWeight: "800", letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 9px", borderRadius: "6px" }}>Most picked</span></>)}
<strong style={{ fontSize: "20px" }}>{t.name}</strong>
<span style={{ display: "flex", alignItems: "baseline", gap: "6px" }}><span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "64px", lineHeight: ".9" }}>{t.price}</span><span style={{ color: "var(--ink2)", fontWeight: "700" }}>{t.per}</span></span>
<span style={{ color: "var(--ink2)", lineHeight: "1.45" }}>{t.d}</span>
<ul style={{ margin: "4px 0 0", padding: "0", listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>{(t.f).map((x, _k10) => (<Fragment key={_k10}><li style={{ display: "flex", gap: "10px", fontSize: "15px" }}><span style={{ color: "var(--green)", fontWeight: "800" }}>✓</span>{x}</li></Fragment>))}</ul>
<a href="#claim" onClick={t.pick} style={{ marginTop: "auto", minHeight: "50px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: t.btnBg, color: t.btnFg, border: "1.5px solid var(--line2)", fontWeight: "800", textDecoration: "none" }}>{t.cta}</a>
</div>
</Fragment>))}
</div>
<p style={{ margin: "14px 0 0", fontSize: "13px", color: "var(--ink2)" }}>Launch pricing in CAD, plus HST. Cancel anytime. Paid placements never change our editorial rankings.</p>
</section>
<section aria-labelledby="kit-h" style={{ maxWidth: "1320px", margin: "0 auto", padding: "64px clamp(16px,4vw,32px) 0" }}>
<div style={{ padding: "clamp(20px,4vw,40px)", borderRadius: "28px", background: "var(--glass)", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "28px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: ".16em", textTransform: "uppercase", color: "var(--mariText)" }}>Partner programme</span>
<h2 id="kit-h" style={{ margin: "0", fontFamily: "var(--display)", fontWeight: "900", fontSize: "clamp(38px,5vw,56px)", lineHeight: ".92" }}>Wear the badge in your window.</h2>
<p style={{ margin: "0", fontSize: "17px", lineHeight: "1.55", color: "var(--ink2)" }}>Verified businesses get a window sticker and counter card with a QR code. Customers scan it to save you, recommend you and share you on WhatsApp.</p>
</div>
<div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
<div style={{ width: "220px", transform: "rotate(-4deg)", background: "#FFFFFF", color: "#1A1410", borderRadius: "20px", padding: "18px", boxShadow: "0 30px 60px rgba(0,0,0,.35)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
<span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "32px", lineHeight: "1" }}>Tamil<span style={{ color: "#B3122E" }}>TO</span></span>
<span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase", color: "#1F7A4D" }}>✓ Verified Tamil-owned</span>
<div style={{ width: "110px", display: "grid", gridTemplateColumns: "repeat(21,1fr)" }}>{(qr).map((q, _k11) => (<Fragment key={_k11}><span style={{ aspectRatio: "1", background: q.c }}></span></Fragment>))}</div>
<span style={{ fontSize: "12px", fontWeight: "700" }}>Scan to save & share us</span>
</div>
<div style={{ width: "150px", height: "150px", alignSelf: "center", transform: "rotate(5deg)", borderRadius: "99px", background: "#B3122E", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", textAlign: "center", boxShadow: "0 24px 50px rgba(0,0,0,.3)" }}><span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: ".14em", textTransform: "uppercase" }}>Find us on</span><span style={{ fontFamily: "var(--display)", fontWeight: "900", fontSize: "34px", lineHeight: "1" }}>TamilTO</span><span style={{ fontSize: "11px", fontWeight: "700", color: "#FFD27A" }}>Cousin-approved</span></div>
</div>
</div>
</section>
    </>
  )
}
