// Activity counting: page views, searches, WhatsApp taps, calls, directions, saves, shares, quote requests.
// Nothing personal is kept. Instead of an IP address we store a short code made from it that changes
// every day (so one visitor counts once per day, but nobody can be followed from day to day).
import { createHash } from 'node:crypto'
import { CAN_SAVE, admin } from '@/lib/server/supa'
import { ipOf, allow } from '@/lib/server/guard'

const KINDS = new Set(['view', 'search', 'whatsapp', 'call', 'directions', 'reviews', 'website', 'social', 'email', 'save', 'share', 'quote', 'listing'])
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless|lighthouse|pingdom|uptime|monitor/i
const SALT = process.env.ACTIVITY_SALT || process.env.REVALIDATE_SECRET || 'tamilto'
const ok = () => new Response(null, { status: 204 })

// Where a profile view came from: a TamilTO page section, or the other website's name.
function source(ref, host) {
  if (!ref) return 'direct'
  try {
    const u = new URL(ref)
    if (u.host === host) return u.pathname.replace(/^\/+/, '').split('/')[0] || 'home'
    const h = u.hostname.replace(/^www\.|^m\.|^l\.|^lm\./, '')
    if (/google\./.test(h)) return 'google'
    if (/bing\.|duckduckgo|yahoo\./.test(h)) return 'search engine'
    return h.slice(0, 60)
  } catch {
    return 'direct'
  }
}

export async function POST(req) {
  const ua = req.headers.get('user-agent') || ''
  if (!ua || BOT.test(ua)) return ok()
  const body = await req.json().catch(() => null)
  if (!body || !KINDS.has(body.kind)) return ok()
  if (!allow(req, 'track', 240, 60_000)) return ok()

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })
  const event = {
    p_kind: body.kind,
    p_business: String(body.businessId || '').slice(0, 120),
    p_path: String(body.path || '').slice(0, 200),
    p_ref: body.kind === 'view' ? source(String(body.ref || ''), host) : body.kind === 'search' ? '' : String(body.extra || '').slice(0, 60),
    // Searches keep their words, minus anything that looks like a phone number or email.
    p_query: body.kind === 'search' ? String(body.extra || '').replace(/\S+@\S+/g, '').replace(/[\d\s().+-]{7,}/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80) : '',
    p_session: createHash('sha256').update(`${SALT}|${day}|${ipOf(req)}|${ua}`).digest('base64url').slice(0, 16),
    p_device: /mobi|android|iphone|ipad/i.test(ua) ? 'm' : 'd',
  }
  if (!CAN_SAVE) {
    if (process.env.NODE_ENV !== 'production') console.info('[track:dev]', event)
    return ok()
  }
  const { error } = await admin().rpc('record_activity', event)
  if (error) console.error('[track] not saved:', error.message)
  return ok()
}
