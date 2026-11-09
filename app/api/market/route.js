import { createHash } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { CAN_SAVE, admin } from '@/lib/server/supa'
import { CAN_EMAIL, TEAM, sendEmail, layout, esc } from '@/lib/server/email'
import { sameSite, allow, tooMany, notOurs, ipOf } from '@/lib/server/guard'

// Marketplace forms: customer requests, business replies, jobs, classifieds, creator sign-ups,
// creator bookings, award nominations, advertising enquiries and award votes.
// Posts go to the review queue (admin → Inbox). Nothing is published until the team approves it.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tamilto.com').replace(/\/$/, '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /\d[\d\s().+-]{8,}/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// form: [label, required fields, needs email, needs consent, max per visitor per hour]
const TYPES = {
  request: ['Customer request', ['t', 'cat', 'area', 'd', 'name', 'phone'], false, true, 4],
  job: ['Job post', ['t', 'biz', 'type', 'area', 'phone'], false, false, 4],
  classified: ['Classified ad', ['kind', 'area', 't', 'd', 'phone'], false, true, 4],
  creator: ['Creator sign-up', ['name', 'handle', 'niche', 'email'], true, true, 3],
  booking: ['Creator booking', ['creator', 'biz', 'phone', 'brief'], false, false, 5],
  nomination: ['Award nomination', ['cat', 'biz', 'why', 'email'], true, false, 6],
  ad: ['Advertising enquiry', ['biz', 'name', 'phone', 'email'], true, false, 4],
}
const KEEP = ['t', 'cat', 'sub', 'area', 'when', 'size', 'budget', 'd', 'name', 'phone', 'email', 'biz', 'type', 'pay', 'kind', 'price', 'handle', 'niche', 'plats', 'creator', 'creatorId', 'brief', 'why', 'package', 'interest', 'msg']
const LABELS = { t: 'Title', cat: 'Category', area: 'Area', when: 'When', size: 'Size', budget: 'Budget', d: 'Details', name: 'Name', phone: 'Phone', email: 'Email', biz: 'Business', type: 'Job type', pay: 'Pay', kind: 'Type', price: 'Price', handle: 'Handle', niche: 'Niche', plats: 'Platforms', creator: 'Creator', brief: 'Brief', why: 'Why', package: 'Package', interest: 'Interested in', msg: 'Message' }
const clean = (v) => (Array.isArray(v) ? v.map((x) => String(x).trim().slice(0, 120)).filter(Boolean).slice(0, 12).join(', ') : String(v ?? '').trim().slice(0, 3000))
const bad = (error, status = 400) => Response.json({ error }, { status })
const digits = (p) => String(p || '').replace(/\D/g, '').slice(-10)
const phoneHtml = (p) => { const d = digits(p); return d.length === 10 ? `<a href="tel:+1${d}">${esc(p)}</a> · <a href="https://wa.me/1${d}">WhatsApp</a>` : esc(p) }
// A one-way code per visitor, so a person can vote once per category without us keeping who they are.
const voterCode = (req) => createHash('sha256').update('tto-vote|' + (process.env.SUPABASE_SERVICE_ROLE_KEY || '') + '|' + ipOf(req) + '|' + (req.headers.get('user-agent') || '').slice(0, 200)).digest('base64url').slice(0, 32)
const offline = () => (process.env.NODE_ENV === 'production' ? bad('This opens soon. For now, email hello@tamilto.com.', 503) : Response.json({ ok: true, dev: true }))

export async function POST(req) {
  if (!sameSite(req)) return notOurs()
  const b = await req.json().catch(() => null)
  if (!b || typeof b !== 'object') return bad('Invalid form.')
  if (b.company_website) return Response.json({ ok: true }) // honeypot
  const type = String(b.form || '')
  if (type === 'vote') return vote(req, b)
  if (type === 'reply') return reply(req, b)
  const T = TYPES[type]
  if (!T) return bad('Unknown form.')
  const [label, need, needEmail, needConsent, max] = T
  if (!allow(req, 'mk-' + type, max, 60 * 60_000)) return tooMany()
  const f = {}
  for (const k of KEEP) if (b[k] != null && clean(b[k])) f[k] = clean(b[k])
  const missing = need.find((k) => !f[k])
  if (missing) return bad(`Please fill in ${(LABELS[missing] || missing).toLowerCase()}.`)
  if (f.email && !EMAIL.test(f.email)) return bad('Please add a valid email.')
  if (needEmail && !f.email) return bad('Please add your email.')
  if (f.phone && !PHONE.test(f.phone)) return bad('Please add a phone number we can reach.')
  if (needConsent && b.consent !== 'on' && b.consent !== true) return bad('Please tick the box to agree.')
  if (!CAN_SAVE) { console.info('[market:dev]', type, f); return offline() }

  const title = (f.t || f.biz || f.name || f.handle || '').slice(0, 200)
  const { error } = await admin().from('submissions').insert({
    kind: type, title, name: (f.name || '').slice(0, 120), email: (f.email || '').toLowerCase(),
    payload: { fields: Object.entries(f).map(([key, value]) => ({ key, value })) },
    consent_at: needConsent ? new Date().toISOString() : null,
  })
  if (error) { console.error('[market] not saved:', error.message); return bad('We couldn’t send that. Please try again, or email hello@tamilto.com.', 500) }
  if (CAN_EMAIL) {
    await sendEmail({
      to: TEAM, subject: `${label}: ${title || f.email || ''}`, replyTo: f.email || undefined,
      html: layout({
        kicker: label, title: title || label, intro: 'Nothing goes live until you approve it in the admin (Inbox).',
        rows: Object.entries(f).filter(([k]) => k !== 'creatorId').map(([k, v]) => [LABELS[k] || k, k === 'phone' ? phoneHtml(v) : esc(v).replace(/\n/g, '<br>')]),
        button: ['Review it in the admin', `${SITE}/admin`],
      }),
    })
  }
  return Response.json({ ok: true })
}

/** A business answers a customer request. The customer gets the business's details by email;
 *  the customer's own contact details are never shown to the business. */
async function reply(req, b) {
  if (!allow(req, 'mk-reply', 10, 60 * 60_000)) return tooMany()
  const item = String(b.item || ''), biz = clean(b.biz).slice(0, 160), phone = clean(b.phone).slice(0, 40), msg = clean(b.msg).slice(0, 2000)
  if (!biz) return bad('Please add your business name.')
  if (!PHONE.test(phone)) return bad('Please add a phone number the customer can call.')
  if (!CAN_SAVE) { console.info('[market:dev] reply', { item, biz, phone, msg }); return offline() }
  if (!UUID.test(item)) return bad('That request has closed.', 404)
  const db = admin()
  const { data: it } = await db.from('market_items').select('id, data, is_hidden, expires_on, submission_id').eq('id', item).eq('kind', 'request').maybeSingle()
  if (!it || it.is_hidden) return bad('That request has closed.', 404)
  const { data: sub } = it.submission_id ? await db.from('submissions').select('email, name').eq('id', it.submission_id).maybeSingle() : { data: null }
  const { data: saved, error } = await db.from('request_replies').insert({ item_id: it.id, business_name: biz, phone, message: msg }).select('id').single()
  if (error) { console.error('[market] reply not saved:', error.message); return bad('We couldn’t send that. Please try again.', 500) }
  const t = (it.data && it.data.t) || 'your request'
  const rows = [['Business', esc(biz)], ['Phone', phoneHtml(phone)], ['Message', esc(msg).replace(/\n/g, '<br>')]]
  let sent = false
  if (CAN_EMAIL && sub && EMAIL.test(sub.email || '')) {
    sent = await sendEmail({
      to: sub.email, subject: `A business replied: ${t}`,
      html: layout({ kicker: 'Reply to your TamilTO request', title: t, intro: `${esc(sub.name ? 'Hi ' + sub.name + ', a' : 'A')} Tamil Toronto business would like to help. Contact them directly:`, rows, foot: 'You get this because you posted a request on tamilto.com. Your contact details were not shared with the business.' }),
      text: `A business replied to your TamilTO request "${t}".\n\nBusiness: ${biz}\nPhone: ${phone}${msg ? '\n\n' + msg : ''}`,
    })
    if (sent) await db.from('request_replies').update({ notified_at: new Date().toISOString() }).eq('id', saved.id)
  }
  if (CAN_EMAIL) {
    await sendEmail({ to: TEAM, subject: `Reply to request: ${t}`, html: layout({ kicker: 'Request reply', title: t, intro: sent ? 'The customer was emailed these details.' : 'The customer has no email on file. Please pass this on by phone or WhatsApp.', rows }) })
  }
  revalidateTag('market') // the reply count on the request updates straight away
  return Response.json({ ok: true })
}

/** One vote per visitor per award category. */
async function vote(req, b) {
  if (!allow(req, 'mk-vote', 30, 60 * 60_000)) return tooMany()
  const cat = String(b.cat || '').slice(0, 60), slug = String(b.biz || '').slice(0, 120)
  if (!cat || !slug) return bad('Please pick a business.')
  if (!CAN_SAVE) return offline()
  const db = admin()
  const { data: s } = await db.from('site_settings').select('value').eq('key', 'awards').maybeSingle()
  const cats = (s && s.value && s.value.cats) || []
  if (!cats.some((c) => c.id === cat)) return bad('That category is closed.', 404)
  if (s.value.voting === false) return bad('Voting is closed right now.', 403)
  const { data: biz } = await db.from('businesses').select('id').eq('slug', slug).eq('is_hidden', false).maybeSingle()
  if (!biz) return bad('That business isn’t listed.', 404)
  const { error } = await db.from('award_votes').insert({ category: cat, business_id: biz.id, voter: voterCode(req) })
  if (error) return error.code === '23505' ? bad('You already voted in this category.', 409) : bad('Your vote didn’t count. Please try again.', 500)
  revalidateTag('market')
  return Response.json({ ok: true })
}
