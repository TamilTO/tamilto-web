import { getEvent } from '@/lib/data'
import { SITE_URL, eventHref } from '@/lib/site'

const stamp = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s) => String(s || '').replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n')

export async function GET(_req, { params }) {
  const { slug } = await params
  const e = await getEvent(slug)
  if (!e) return new Response('Not found', { status: 404 })
  const end = e.end || new Date(new Date(e.start).getTime() + 2 * 3600e3).toISOString()
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TamilTO//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.slug}@tamilto.com`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc([e.venue, e.address, e.neighbourhood].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${esc(`${e.description || ''}\n\nvia TamilTO — ${SITE_URL}${eventHref(e)}`)}`,
    `URL:${SITE_URL}${eventHref(e)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${e.slug}.ics"` },
  })
}
