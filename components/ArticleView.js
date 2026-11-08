import Link from 'next/link'
import Img from './Img'
import ArticleCard from './ArticleCard'
import PortableBody, { splitBody } from './PortableBody'
import NewsletterForm from './NewsletterForm'
import ShareBar from './ShareBar'
import AdSlot from './AdSlot'
import JsonLd from './JsonLd'
import { getArticles } from '@/lib/data'
import { CATEGORIES, SITE_URL, articleHref } from '@/lib/site'
import { articleLd, breadcrumbLd } from '@/lib/seo'
import { fmtDate } from '@/lib/dates.mjs'

export default async function ArticleView({ article: a }) {
  const all = await getArticles({ limit: 40 })
  const others = all.filter((x) => x.slug !== a.slug)
  const related = [...others].sort((x, y) => (y.category === a.category) - (x.category === a.category)).slice(0, 3)
  const mostRead = others.filter((x) => x.trending).slice(0, 5)
  const c = CATEGORIES[a.category]
  const path = articleHref(a)
  const url = SITE_URL + path
  const [first, middle, last] = splitBody(a.body)

  return (
    <article>
      <JsonLd data={[articleLd(a), breadcrumbLd([{ name: 'Home', path: '/' }, { name: c.label, path: `/${a.category}` }, { name: a.title, path }])]} />
      {a.sponsored ? (
        <div className="sponsor-bar" role="note">
          <div className="container narrow sponsor-in">
            <strong>
              Sponsored by {a.sponsorUrl ? <a href={a.sponsorUrl} target="_blank" rel="sponsored noopener">{a.sponsorName}</a> : a.sponsorName}
            </strong>
            <span>Paid partner content, produced with our team. <Link href="/editorial-policy#sponsored">How sponsorship works</Link></span>
          </div>
        </div>
      ) : null}

      <header className="container narrow article-head">
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href={`/${a.category}`}>{c.label}</Link>
        </nav>
        <Link href={`/${a.category}`} className={`kicker plain tag-${a.category}`}>{c.label}{a.neighbourhood ? ` · ${a.neighbourhood}` : ''}</Link>
        <h1 className="display h1">{a.title}</h1>
        <p className="dek">{a.dek}</p>
        <div className="byline">
          <span><strong>By {a.author}</strong> <span className="muted">· <time dateTime={a.publishDate}>{fmtDate(a.publishDate)}</time> · {a.readTime} min read</span></span>
          <span className="spacer" />
          <ShareBar url={url} title={a.title} slug={a.slug} compact />
        </div>
      </header>

      <figure className="container narrow article-hero">
        <Img media={a.hero} ratio="16/9" label={a.hero?.label} priority sizes="(min-width: 1080px) 1016px, 100vw" />
        {a.hero?.caption || a.hero?.credit ? (
          <figcaption>{a.hero.caption ? <span>{a.hero.caption}</span> : null}{a.hero.credit ? <span>Photo: {a.hero.credit}</span> : null}</figcaption>
        ) : null}
      </figure>

      <div className="container narrow article-layout">
        <div className="article-main">
          <div className="prose">
            <PortableBody value={first} />
            <aside className="inline-nl" aria-label="Newsletter signup">
              <strong className="display inline-nl-h">Like this? Get it every Friday.</strong>
              <NewsletterForm placement="inline" showLabel={false} button="Subscribe" />
            </aside>
            <PortableBody value={middle} />
            {last.length ? <AdSlot format="rect" /> : null}
            <PortableBody value={last} />
          </div>
          <div className="article-end">
            <strong className="kicker">Send this to the group chat</strong>
            <ShareBar url={url} title={a.title} slug={a.slug} />
            <p className="muted small">Know something we missed? <Link href="/submit">Submit a tip</Link>. Spotted an error? <a href="mailto:hello@tamilto.com">Tell our editor</a>.</p>
          </div>
        </div>
        <aside className="article-aside" aria-label="More from TamilTO">
          <AdSlot format="rect" />
          {mostRead.length ? (
            <div>
              <h2 className="kicker">Most read</h2>
              <ol className="mostread">
                {mostRead.map((m, i) => <li key={m.slug}><Link href={articleHref(m)}><span>{i + 1}</span>{m.title}</Link></li>)}
              </ol>
            </div>
          ) : null}
        </aside>
      </div>

      {related.length ? (
        <section className="container narrow section" aria-labelledby="rel-h">
          <h2 id="rel-h" className="display h2 section-rule" style={{ marginBottom: 18 }}>Keep reading</h2>
          <div className="grid-fit">{related.map((r) => <ArticleCard key={r.slug} a={r} />)}</div>
        </section>
      ) : null}
    </article>
  )
}
