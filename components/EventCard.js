import Link from 'next/link'
import Img from './Img'
import { eventHref } from '@/lib/site'
import { eventParts, timeRange } from '@/lib/dates.mjs'

export const priceLabel = (e) => (e.soldOut ? 'Sold out' : e.price ? `From $${e.price}` : 'Free')

export function EventMini({ e }) {
  const d = eventParts(e.start)
  return (
    <Link href={eventHref(e)} className="ev-mini">
      <span className="datebox" aria-hidden="true"><span>{d.dow}</span><b>{d.day}</b><span>{d.mon}</span></span>
      <span className="stack-4">
        <span className="ev-mini-title">{e.title}</span>
        <span className="ev-mini-meta"><time dateTime={e.start}>{d.dow} {d.mon} {d.day}, {d.time}</time> · {e.neighbourhood}</span>
        <span className="ev-mini-price">{priceLabel(e)}</span>
      </span>
    </Link>
  )
}

export default function EventCard({ e, as: H = 'h2' }) {
  const d = eventParts(e.start)
  return (
    <article className="ev-card">
      <Link href={eventHref(e)} className="ev-card-media" tabIndex={-1} aria-hidden="true">
        <Img media={e.image} ratio="16/10" sizes="(min-width: 800px) 320px, 100vw" />
      </Link>
      <div className="ev-card-body">
        <div className="row-wrap">
          <span className="pill-date">{d.dow} {d.mon} {d.day}</span>
          <span className="tag tag-events">{e.type}</span>
          {e.soldOut ? <span className="tag tag-eat">Sold out</span> : null}
        </div>
        <H className="display h-card"><Link href={eventHref(e)} className="plain">{e.title}</Link></H>
        {e.description ? <p className="muted">{e.description}</p> : null}
        <dl className="dl">
          <dt>When</dt><dd><time dateTime={e.start}>{d.long} · {timeRange(e.start, e.end)}</time></dd>
          <dt>Where</dt><dd>{[e.venue, e.neighbourhood].filter(Boolean).join(', ')}</dd>
          <dt>Price</dt><dd>{priceLabel(e)}</dd>
        </dl>
        <div className="row-wrap">
          {e.ticketUrl ? (
            <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
              {e.soldOut ? 'Join waitlist' : e.price ? 'Get tickets' : 'RSVP'}
            </a>
          ) : null}
          <a href={`${eventHref(e)}/ics`} className="btn btn-outline" download>Add to calendar</a>
        </div>
      </div>
    </article>
  )
}
