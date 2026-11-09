
import { CAN_SAVE, admin, savePhoto } from '@/lib/server/supa'
import { CAN_EMAIL, TEAM, sendEmail, layout, esc } from '@/lib/server/email'
import { sameSite, allow, tooMany, notOurs } from '@/lib/server/guard'

const KINDS = ['tip', 'event', 'listing', 'ad']
const LABEL = { tip: 'Story tip', event: 'Event', listing: 'Business listing', ad: 'Advertising enquiry' }
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tamilto.com').replace(/\/$/, '')
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_PHOTO = 4 * 1024 * 1024 // stays under the hosting request limit
const SKIP = new Set(['kind', 'consent', 'company_website', 'photo'])

/** Tips, events and ad enquiries. Every one lands in the review queue (Inbox → Client submissions);
 *  nothing is ever auto-published. */
export async function POST(req) {
  if (!sameSite(req)) return notOurs()
  if (!allow(req, 'submit', 6, 60 * 60_000)) return tooMany()
  let fd
  try { fd = await req.formData() } catch { return Response.json({ error: 'Invalid form.' }, { status: 400 }) }

  if (fd.get('company_website')) return Response.json({ ok: true }) // honeypot: pretend success
  const kind = String(fd.get('kind') || '')
  if (!KINDS.includes(kind)) return Response.json({ error: 'Unknown submission type.' }, { status: 400 })
  const email = String(fd.get('email') || '').trim()
  if (!EMAIL.test(email)) return Response.json({ error: 'Please add a valid email.' }, { status: 400 })
  const consent = fd.get('consent') === 'on'
  if (kind !== 'ad' && !consent) return Response.json({ error: 'Please tick the consent box.' }, { status: 400 })

  const fields = []
  for (const [key, value] of fd.entries()) {
    if (SKIP.has(key) || typeof value !== 'string' || !value.trim()) continue
    fields.push({ _key: key, key, value: value.slice(0, 5000) })
  }
  const get = (k) => fields.find((f) => f.key === k)?.value
  const photo = fd.get('photo')
  const hasPhoto = photo && typeof photo === 'object' && photo.size > 0
  if (hasPhoto && (photo.size > MAX_PHOTO || !/^image\/(jpeg|png|webp)$/.test(photo.type))) {
    return Response.json({ error: 'Photos must be JPG, PNG or WebP and under 4 MB.' }, { status: 400 })
  }

  if (!CAN_SAVE) {
    if (process.env.NODE_ENV === 'production') return Response.json({ error: 'Online submissions open soon. For now, email hello@tamilto.com.' }, { status: 503 })
    console.info('[submission:dev]', kind, Object.fromEntries(fields.map((f) => [f.key, f.value])), hasPhoto ? photo.name : '')
    return Response.json({ ok: true, dev: true })
  }

  const title = String(get('title') || get('event') || get('business') || get('company') || get('headline') || '').slice(0, 200)
  const name = String(get('name') || '').slice(0, 120)
  let photo_path = ''
  try {
    if (hasPhoto) photo_path = await savePhoto(photo, `submissions/${new Date().toISOString().slice(0, 10)}`)
  } catch (e) {
    console.error('[submission]', e.message)
    return Response.json({ error: 'We couldn’t save your photo. Please try a smaller one.' }, { status: 500 })
  }
  const { error } = await admin().from('submissions').insert({
    kind, title, name, email: email.toLowerCase(), payload: { fields: fields.map(({ key, value }) => ({ key, value })) }, photo_path, consent_at: consent ? new Date().toISOString() : null,
  })
  if (error) {
    console.error('[submission] not saved:', error.message)
    return Response.json({ error: 'We couldn’t send that. Please try again, or email hello@tamilto.com.' }, { status: 500 })
  }
  if (CAN_EMAIL) {
    await sendEmail({
      to: TEAM,
      subject: `${LABEL[kind]}: ${title || name || email}`,
      replyTo: email,
      html: layout({
        kicker: LABEL[kind], title: title || 'New submission',
        intro: 'Nothing is published until you approve it in the admin.',
        rows: fields.map(({ key, value }) => [key, esc(value).replace(/\n/g, '<br>')]),
        button: ['Review it in the admin', `${SITE}/admin`],
      }),
    })
  }
  return Response.json({ ok: true })
}
