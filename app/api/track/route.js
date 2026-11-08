// Activity events (views, WhatsApp taps, calls, saves...). No names, emails, phone numbers or IPs are stored.
// Step 20 of the launch checklist saves these to the activity_events table in Supabase.
const KINDS = new Set(['view', 'search', 'whatsapp', 'call', 'directions', 'reviews', 'website', 'social', 'email', 'save', 'share', 'quote', 'listing'])
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|headless/i

export async function POST(req) {
  if (BOT.test(req.headers.get('user-agent') || '')) return new Response(null, { status: 204 })
  const body = await req.json().catch(() => null)
  if (!body || !KINDS.has(body.kind)) return new Response(null, { status: 204 })
  const event = {
    kind: body.kind,
    businessId: String(body.businessId || '').slice(0, 120),
    extra: String(body.extra || '').slice(0, 200),
    path: String(body.path || '').slice(0, 200),
  }
  if (process.env.NODE_ENV !== 'production') console.info('[track:dev]', event)
  return new Response(null, { status: 204 })
}
