// Quote requests. One request goes to every business the visitor ticked.
// Step 20 saves these to the leads tables in Supabase and emails each business through Resend.
const PHONE = /^[+\d][\d\s().-]{6,24}$/

export async function POST(req) {
  const b = await req.json().catch(() => null)
  if (!b) return Response.json({ error: 'Invalid request.' }, { status: 400 })
  if (b.company_website) return Response.json({ ok: true }) // honeypot: pretend success
  const ids = Array.isArray(b.businessIds) ? b.businessIds.filter((x) => typeof x === 'string').slice(0, 20) : []
  const name = String(b.name || '').trim().slice(0, 80)
  const phone = String(b.phone || '').trim().slice(0, 30)
  if (!ids.length) return Response.json({ error: 'Tick at least one business.' }, { status: 400 })
  if (!name) return Response.json({ error: 'Please add your name.' }, { status: 400 })
  if (!PHONE.test(phone)) return Response.json({ error: 'Please add a phone or WhatsApp number we can pass on.' }, { status: 400 })
  const lead = {
    kind: String(b.kind || 'Quote request').slice(0, 60),
    name,
    phone,
    eventDate: /^\d{4}-\d{2}-\d{2}$/.test(b.eventDate || '') ? b.eventDate : null,
    guests: String(b.guests || '').replace(/\D/g, '').slice(0, 6) || null,
    message: String(b.message || '').slice(0, 2000),
    sourcePage: String(b.sourcePage || '').slice(0, 200),
    businessIds: ids,
  }
  if (process.env.NODE_ENV === 'production') {
    // Not connected yet: refuse rather than pretend the businesses were told.
    return Response.json({ error: 'Quote requests open soon. For now, please WhatsApp or call the business directly.' }, { status: 503 })
  }
  console.info('[lead:dev]', lead)
  return Response.json({ ok: true, dev: true })
}
