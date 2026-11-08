import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleView from '@/components/ArticleView'
import Img from '@/components/Img'
import JsonLd from '@/components/JsonLd'
import MapEmbed from '@/components/MapEmbed'
import ShareBar from '@/components/ShareBar'
import { priceLabel } from '@/components/EventCard'
import { getEvent, getArticle, getEvents } from '@/lib/data'
import { SITE_URL, eventHref } from '@/lib/site'
import { pageMeta, articleMeta, eventLd, breadcrumbLd } from '@/lib/seo'
import { eventParts, timeRange } from '@/lib/dates.mjs'

export const revalidate = 900

// /events/[slug] serves both event listings and articles filed under Events.
export async function generateStaticParams() {
  const events = await getEvents()
  return events.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const e = await getEvent(slug)
  if (e) {
    const d = eventParts(e.start)
    return pageMeta({ title: e.title, description: `${d.long} · ${e.venue}, ${e.neighbourhood}. ${e.description || ''}`.trim(), path: eventHref(e) })
  }
  const a = await getArticle(slug)
  return a?.category === 'events' ? articleMeta(a) : {}
}

export default async function EventPage({ params }) {
  const { slug } = await params
  const e = await getEvent(slug)
  if (!e) {
    const a = await getArticle(slug)
    if (a?.category === 'events') return <ArticleView article={a} />
    notFound()
  }
  const d = eventParts(e.start)
  const url = SITE_URL + eventHref(e)
  return (
    <div className="container narrow stack-20" style={{ paddingTop: 24 }}>
      <JsonLd data={[eventLd(e), breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Events', path: '/events' }, { name: e.title, path: eventHref(e) }])]} />
      <nav aria-label="Breadcrumb" className="crumbs"><Link href="/events">← All events</Link></nav>
      <div className="row-wrap">
        <span className="pill-date">{d.dow} {d.mon} {d.day}</span>
        <span className="tag tag-events">{e.type}</span>
        {e.soldOut ? <span className="tag tag-eat">Sold out</span> : null}
      </div>
      <h1 className="display h1">{e.title}</h1>
      <Img media={e.image} ratio="16/9" priority sizes="(min-width: 1080px) 1016px, 100vw" />
      <div className="article-layout" style={{ paddingTop: 0 }}>
        <div className="article-main">
          {e.description ? <p className="lede">{e.description}</p> : null}
          <MapEmbed name={e.venue} address={`${e.address || ''} ${e.neighbourhood || ''}`} slug={e.slug} />
          <ShareBar url={url} title={e.title} slug={e.slug} />
        </div>
        <aside className="article-aside">
          <dl className="info">
            <div><dt>When</dt><dd><time dateTime={e.start}>{d.long}<br />{timeRange(e.start, e.end)}</time></dd></div>
            <div><dt>Where</dt><dd>{e.venue}{e.address ? <><br />{e.address}</> : null}{e.neighbourhood ? <><br />{e.neighbourhood}</> : null}</dd></div>
            <div><dt>Price</dt><dd>{priceLabel(e)}</dd></div>
          </dl>
          {e.ticketUrl ? <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{e.soldOut ? 'Join waitlist' : e.price ? 'Get tickets' : 'RSVP'}</a> : null}
          <a href={`${eventHref(e)}/ics`} className="btn btn-outline" download>Add to calendar</a>
        </aside>
      </div>
    </div>
  )
}
