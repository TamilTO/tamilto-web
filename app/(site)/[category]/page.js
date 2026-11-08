import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleCard from '@/components/ArticleCard'
import JsonLd from '@/components/JsonLd'
import { getArticles } from '@/lib/data'
import { CATEGORIES, NEIGHBOURHOODS } from '@/lib/site'
import { pageMeta, breadcrumbLd } from '@/lib/seo'

const PAGE = 12

export function generateStaticParams() {
  // /eat, /culture, /events and /business have their own TamilTO 3.0 pages.
  return Object.keys(CATEGORIES).filter((k) => !['events', 'eat', 'culture', 'business'].includes(k)).map((category) => ({ category }))
}

export async function generateMetadata({ params }) {
  const { category } = await params
  const c = CATEGORIES[category]
  if (!c) return {}
  return pageMeta({ title: `${c.label} — Tamil Toronto`, description: c.desc, path: `/${category}` })
}

export default async function CategoryPage({ params, searchParams }) {
  const { category } = await params
  const sp = await searchParams
  const c = CATEGORIES[category]
  if (!c || category === 'events') notFound()
  const hood = NEIGHBOURHOODS.includes(sp.hood) ? sp.hood : null
  const page = Math.max(1, Math.min(50, parseInt(sp.page, 10) || 1))
  const all = await getArticles({ category, neighbourhood: hood ?? undefined, limit: PAGE * page + 1 })
  const items = all.slice(0, PAGE * page)
  const href = (o) => {
    const p = new URLSearchParams()
    const m = { hood, page: null, ...o }
    if (m.hood) p.set('hood', m.hood)
    if (m.page > 1) p.set('page', m.page)
    const s = p.toString()
    return `/${category}${s ? `?${s}` : ''}`
  }

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: 'Home', path: '/' }, { name: c.label, path: `/${category}` }])} />
      <section className="page-head">
        <div className="container page-head-in">
          <div className="row-wrap" style={{ alignItems: 'baseline', gap: '4px 16px' }}>
            <h1 className={`display h-page tag-${category}`}>{c.label}</h1>
            <span className="ta" lang="ta" style={{ fontSize: 20 }}>{c.ta}</span>
          </div>
          <p className="lede">{c.desc}</p>
          <div className="kolam" aria-hidden="true" style={{ marginTop: 8 }} />
          <nav className="chips" aria-label="Filter by neighbourhood">
            <Link href={href({ hood: null })} className="chip" aria-current={!hood ? 'true' : undefined}>All</Link>
            {NEIGHBOURHOODS.filter((n) => n !== 'GTA-wide').map((n) => (
              <Link key={n} href={href({ hood: n })} className="chip" aria-current={hood === n ? 'true' : undefined} scroll={false}>{n}</Link>
            ))}
          </nav>
        </div>
      </section>
      <div className="container" style={{ paddingTop: 28 }}>
        {items.length ? (
          <div className="grid">{items.map((a, i) => <ArticleCard key={a.slug} a={a} meta="date" dek as="h2" priority={i < 2} />)}</div>
        ) : (
          <p className="empty">Nothing in {hood} yet. Know a spot we should cover? <Link href="/submit">Submit a tip</Link>.</p>
        )}
        {all.length > items.length ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
            <Link href={href({ page: page + 1 })} className="btn btn-outline" scroll={false}>Load more</Link>
          </div>
        ) : null}
        {category === 'guides' ? (
          <Link href="/directory" className="spotlight row-wrap plain" style={{ marginTop: 36, display: 'flex' }}>
            <strong className="display h-card">Looking for a saree shop, grocer or wedding hall?</strong>
            <span className="strong-link" style={{ color: 'var(--teal)' }}>Search the Tamil-Owned Directory →</span>
          </Link>
        ) : null}
      </div>
    </>
  )
}
