// Shape events for the TamilTO 3.0 cards (date block, area, price label).
import { eventParts, timeRange } from './dates.mjs'

export function eventCard(e, hoodByKey = {}) {
  const p = eventParts(e.start)
  const hood = hoodByKey[e.hood]
  return {
    ...e,
    t: e.title,
    d: e.description,
    href: `/events/${e.slug}`,
    dow: p.dow,
    mon: p.mon,
    day: p.day,
    long: p.long,
    time: timeRange(e.start, e.end),
    hoodName: hood ? hood.name : e.neighbourhood,
    hoodHref: hood ? '/n/' + hood.key : '/events',
    tone: e.image?.tone || '#1F4E5F',
    priceLabel: e.soldOut ? 'Sold out' : e.price ? `From $${e.price}` : 'Free',
    ticket: e.ticketUrl || '',
    ticketLabel: e.soldOut ? 'Join waitlist' : e.price ? 'Get tickets' : 'RSVP',
    ics: `/events/${e.slug}/ics`,
    hasHost: !!e.hostBusinessId,
    hostHref: e.hostBusinessId ? '/b/' + e.hostBusinessId : '',
  }
}
