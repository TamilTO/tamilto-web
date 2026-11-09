// Quote requests. One request goes to every business the visitor ticked:
// it is saved for the admin (Inbox → Quote requests) and emailed to each business that has an email.
// Businesses without an email are forwarded by the team on WhatsApp from the admin.
import { CAN_SAVE, admin } from '@/lib/server/supa'
import { CAN_EMAIL, TEAM, sendEmail, layout, esc } from '@/lib/server/email'
import { sameSite, allow, tooMany, notOurs } from '@/lib/server/guard'

const PHONE = /^[+\d][\d\s().-]{6,24}$/
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tamilto.com').replace(/\/$/, '')
const digits = (s) => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d }

export async function POST(req) {
  if (!sameSite(req)) return notOurs()
  const b = await req.json().catch(() => null)
  if (!b) return Response.json({ error: 'Invalid request.' }, { status: 400 })
  if (b.company_website) return Response.json({ ok: true }) // honeypot: pretend success
  if (!allow(req, 'lead', 6, 30 * 60_000)) return tooMany()
  const ids = Array.isArray(b.businessIds) ? [...new Set(b.businessIds.filter((x) => typeof x === 'string'))].slice(0, 20) : []
  const name = String(b.name || '').trim().slice(0, 80)
  const phone = String(b.phone || '').trim().slice(0, 30)
  if (!ids.length) return Response.json({ error: 'Tick at least one business.' }, { status: 400 })
  if (!name) return Response.json({ error: 'Please add your name.' }, { status: 400 })
  if (!PHONE.test(phone)) return Response.json({ error: 'Please add a phone or WhatsApp number we can pass on.' }, { status: 400 })
  const guests = parseInt(String(b.guests || '').replace(/\D/g, '').slice(0, 6), 10)
  const lead = {
    kind: String(b.kind || 'Quote request').trim().slice(0, 60) || 'Quote request',
    name,
    phone,
    event_date: /^\d{4}-\d{2}-\d{2}$/.test(b.eventDate || '') ? b.eventDate : null,
    guests: guests >= 1 && guests <= 100000 ? guests : null,
    message: String(b.message || '').trim().slice(0, 2000),
    source_page: String(b.sourcePage || '').slice(0, 200),
  }

  if (!CAN_SAVE) {
    if (process.env.NODE_ENV === 'production') return Response.json({ error: 'Quote requests open soon. For now, please WhatsApp or call the business directly.' }, { status: 503 })
    console.info('[lead:dev]', lead, ids)
    return Response.json({ ok: true, dev: true })
  }

  const db = admin()
  const { data: biz, error: bErr } = await db.from('businesses').select('id, slug, name, email').in('slug', ids).eq('is_hidden', false)
  if (bErr || !biz?.length) return Response.json({ error: 'Those businesses aren’t available. Please refresh the page and try again.' }, { status: 400 })
  const { data: saved, error } = await db.from('leads').insert(lead).select('id').single()
  if (error) {
    console.error('[lead] not saved:', error.message)
    return Response.json({ error: 'We couldn’t send that. Please try again, or WhatsApp the business directly.' }, { status: 500 })
  }
  await db.from('lead_recipients').insert(biz.map((x) => ({ lead_id: saved.id, business_id: x.id })))

  // Email each business its own copy (they never see who else was asked).
  const d = digits(phone)
  const phoneHtml = d.length === 10
    ? `<a href="tel:+1${d}">${esc(phone)}</a> · <a href="https://wa.me/1${d}">WhatsApp</a>`
    : esc(phone)
  const rows = [['Name', esc(name)], ['Phone', phoneHtml], ['Date', esc(lead.event_date || '')], ['Guests', lead.guests ? esc(lead.guests) : ''], ['Message', esc(lead.message).replace(/\n/g, '<br>')]]
  const emailed = []
  await Promise.all(biz.map(async (x) => {
    if (!x.email) return
    const ok = await sendEmail({
      to: x.email,
      subject: lead.kind === 'Quote request' ? 'New quote request from TamilTO' : `New quote request from TamilTO: ${lead.kind}`,
      html: layout({
        kicker: 'Quote request', title: `${name} would like a quote`,
        intro: `They found <strong>${esc(x.name)}</strong> on TamilTO and asked for a quote${lead.kind === 'Quote request' ? '' : ` for: <strong>${esc(lead.kind)}</strong>`}. Please contact them directly.`,
        rows, foot: `You got this because ${esc(x.name)} is listed on <a href="${SITE}/b/${esc(x.slug)}">TamilTO</a>. Reply to the customer, not to this email. To stop quote requests, email hello@tamilto.com.`,
      }),
      text: `New quote request from TamilTO\n\nFor: ${lead.kind}\nName: ${name}\nPhone: ${phone}${lead.event_date ? '\nDate: ' + lead.event_date : ''}${lead.guests ? '\nGuests: ' + lead.guests : ''}${lead.message ? '\n\n' + lead.message : ''}\n\nPlease contact them directly.`,
    })
    if (ok) emailed.push(x.id)
  }))
  if (emailed.length) await db.from('lead_recipients').update({ notified_at: new Date().toISOString() }).eq('lead_id', saved.id).in('business_id', emailed)

  // Tell the team, listing who still needs a WhatsApp forward.
  const missing = biz.filter((x) => !emailed.includes(x.id)).map((x) => x.name)
  if (CAN_EMAIL) {
    await sendEmail({
      to: TEAM,
      subject: `Quote request: ${lead.kind} from ${name}${missing.length ? ` (${missing.length} to forward)` : ''}`,
      html: layout({
        kicker: 'New quote request', title: `${lead.kind}: ${name}`,
        intro: missing.length ? `<strong>Forward on WhatsApp</strong> (no email on file): ${esc(missing.join(', '))}.` : 'Every business was emailed.',
        rows: [...rows, ['Businesses', esc(biz.map((x) => x.name).join(', '))], ['Sent from', esc(lead.source_page)]],
        button: ['Open the admin', `${SITE}/admin`],
      }),
    })
  }
  return Response.json({ ok: true })
}
