// "Claim or add your business" submissions. Every one goes to the review queue (Inbox → Client submissions);
// nothing publishes itself. Photos are saved to Supabase Storage and reused when the team approves the listing.
import { CAN_SAVE, admin, savePhoto } from '@/lib/server/supa'
import { CAN_EMAIL, TEAM, sendEmail, layout, esc } from '@/lib/server/email'
import { sameSite, allow, tooMany, notOurs } from '@/lib/server/guard'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tamilto.com').replace(/\/$/, '')
const digits = (s) => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1); return d }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_PHOTO = 10 * 1024 * 1024
const KEEP = ['biz', 'cat', 'area', 'addr', 'city', 'postal', 'short', 'tags', 'services', 'hours', 'contact', 'role', 'phone', 'whatsapp', 'email', 'web', 'instagram', 'facebook', 'tiktok', 'gmap', 'quotes', 'hiring', 'delivery', 'deal', 'jobs', 'plan', 'claimOf']

export async function POST(req) {
  if (!sameSite(req)) return notOurs()
  if (!allow(req, 'claim', 5, 60 * 60_000)) return tooMany()
  let fd
  try { fd = await req.formData() } catch { return Response.json({ error: 'Invalid form.' }, { status: 400 }) }
  if (fd.get('company_website')) return Response.json({ ok: true }) // honeypot
  const data = {}
  for (const k of KEEP) { const v = fd.get(k); if (typeof v === 'string' && v.trim()) data[k] = v.trim().slice(0, 2000) }
  data.languages = fd.getAll('lang').filter((x) => typeof x === 'string').join(', ')
  if (!data.biz || !data.cat || !data.area || !data.contact || !data.phone) return Response.json({ error: 'Please fill in the required fields.' }, { status: 400 })
  if (!EMAIL.test(data.email || '')) return Response.json({ error: 'Please add a valid email.' }, { status: 400 })
  if (fd.get('consent') !== 'on' || fd.get('tamilOwnedConfirmed') !== 'yes') return Response.json({ error: 'Please tick the confirmation boxes.' }, { status: 400 })
  if (!['free', 'featured', 'partner'].includes(data.plan)) data.plan = 'free'
  const photos = fd.getAll('photos').filter((f) => f && typeof f === 'object' && f.size > 0)
  if (photos.length > 12) return Response.json({ error: 'Please send 12 photos or fewer.' }, { status: 400 })
  if (photos.some((f) => f.size > MAX_PHOTO || !/^image\/(jpeg|png|webp)$/.test(f.type))) return Response.json({ error: 'Photos must be JPG, PNG or WebP. On an iPhone, choose “Most Compatible” or send them as JPG.' }, { status: 400 })

  if (!CAN_SAVE) {
    if (process.env.NODE_ENV === 'production') return Response.json({ error: 'Online claims open soon. For now, email hello@tamilto.com or WhatsApp us and we’ll set you up.' }, { status: 503 })
    console.info('[claim:dev]', data, photos.map((f) => f.name))
    return Response.json({ ok: true, dev: true })
  }

  const db = admin()
  let business = null
  if (data.claimOf) {
    const { data: rows } = await db.from('businesses').select('id, name').eq('slug', data.claimOf).limit(1)
    business = rows?.[0] || null
  }
  const folder = `claims/${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`
  try {
    data.photos = []
    for (const f of photos) data.photos.push(await savePhoto(f, folder))
  } catch (e) {
    console.error('[claim]', e.message)
    return Response.json({ error: 'We couldn’t save your photos. Please try again with fewer or smaller photos.' }, { status: 500 })
  }
  const { error } = await db.from('claims').insert({
    business_id: business?.id || null, details: data, contact_name: data.contact.slice(0, 120), phone: digits(data.phone) || data.phone.slice(0, 30),
    email: data.email.toLowerCase(), plan: data.plan, tamil_owned_confirmed: true,
  })
  if (error) {
    console.error('[claim] not saved:', error.message)
    return Response.json({ error: 'We couldn’t send that. Please try again, or email hello@tamilto.com.' }, { status: 500 })
  }
  if (CAN_EMAIL) {
    await sendEmail({
      to: TEAM,
      subject: `${business ? 'Claim' : 'New listing'}: ${data.biz} (${data.plan})`,
      replyTo: data.email,
      html: layout({
        kicker: business ? 'Business claim' : 'New business', title: data.biz,
        intro: business ? `Someone says they own <strong>${esc(business.name)}</strong>. Call or WhatsApp them to confirm before approving.` : 'A new business asked to be listed. Check it, then approve it in the admin.',
        rows: [['Contact', esc(`${data.contact}${data.role ? ' (' + data.role + ')' : ''}`)], ['Phone', esc(data.phone)], ['WhatsApp', esc(data.whatsapp || '')], ['Email', esc(data.email)], ['Category', esc(data.cat)], ['Area', esc(data.area)], ['Plan', esc(data.plan)], ['Photos', String(data.photos.length)]],
        button: ['Review it in the admin', `${SITE}/admin`],
      }),
    })
    await sendEmail({
      to: data.email,
      subject: 'We got your TamilTO listing',
      html: layout({
        kicker: 'Nandri!', title: `Thanks, ${data.contact.split(' ')[0]}`,
        intro: `We received <strong>${esc(data.biz)}</strong>. We’ll call or WhatsApp you on ${esc(data.phone)} to confirm, then add the Verified Tamil-owned badge. This usually takes 1–3 days.`,
        foot: 'Questions? Reply to this email or write to hello@tamilto.com.',
      }),
      replyTo: TEAM,
    })
  }
  return Response.json({ ok: true })
}
