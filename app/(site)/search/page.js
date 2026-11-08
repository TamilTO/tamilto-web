import Link from 'next/link'
import { search } from '@/lib/data'
import { CATEGORIES, articleHref, eventHref } from '@/lib/site'
import { pageMeta } from '@/lib/seo'
import { eventParts } from '@/lib/dates.mjs'

export const metadata = pageMeta({ title: 'Search', path: '/search', noindex: true })

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams
  const q = String(sp.q || '').slice(0, 80).trim()
  const r = await search(q)
  const groups = [
    ['Stories', r.articles.map((a) => ({ href: articleHref(a), label: a.title, sub: `${CATEGORIES[a.category]?.label}${a.neighbourhood ? ` · ${a.neighbourhood}` : ''}${a.sponsored ? ' · Sponsored' : ''}` }))],
    ['Events', r.events.map((e) => { const d = eventParts(e.start); return { href: eventHref(e), label: e.title, sub: `${d.dow} ${d.mon} ${d.day} · ${e.venue}` } })],
  ].filter(([, items]) => items.length)

  return (
    <div className="container reading stack-20" style={{ paddingTop: 36 }}>
      <h1 className="display h2">Search TamilTO</h1>
      <form role="search" action="/search" className="searchbar">
        <label htmlFor="q" className="sr-only">Search stories and events</label>
        <input id="q" name="q" type="search" defaultValue={q} autoFocus placeholder="Kothu, Pongal, saree, Markham…" className="input" />
        <button type="submit" className="btn btn-ink">Search</button>
      </form>
      {q.length >= 2 ? <p className="muted">Looking for a business? <Link href={`/directory?q=${encodeURIComponent(q)}`}>Search the directory for “{q}” →</Link></p> : null}
      {q.length >= 2 && !groups.length ? <p className="empty">No stories or events for “{q}” yet. <Link href="/submit">Tip us off?</Link></p> : null}
      {q.length < 2 ? <p className="muted">Search stories and events. For businesses, use the directory.</p> : null}
      {groups.map(([label, items]) => (
        <section key={label} className="results" aria-label={label}>
          <h2 className="kicker muted">{label} ({items.length})</h2>
          {items.map((it) => <Link key={it.href} href={it.href}><strong>{it.label}</strong><span className="meta">{it.sub}</span></Link>)}
        </section>
      ))}
    </div>
  )
}
