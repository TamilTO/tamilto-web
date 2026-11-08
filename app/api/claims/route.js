// "Claim or add your business" submissions. Every one goes to the review queue; nothing publishes itself.
// Step 15/20 saves these to the claims table and photos to Supabase Storage. Until then production refuses
// politely instead of pretending the claim was received.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_PHOTO = 10 * 1024 * 1024
const KEEP = ['biz', 'cat', 'area', 'addr', 'city', 'postal', 'short', 'tags', 'services', 'hours', 'contact', 'role', 'phone', 'whatsapp', 'email', 'web', 'instagram', 'facebook', 'tiktok', 'gmap', 'quotes', 'hiring', 'delivery', 'deal', 'jobs', 'plan', 'claimOf']

export async function POST(req) {
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
  if (photos.some((f) => f.size > MAX_PHOTO || !/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type))) return Response.json({ error: 'Photos must be JPG, PNG, WebP or HEIC and under 10 MB each.' }, { status: 400 })

  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Online claims open soon. For now, email hello@tamilto.com or WhatsApp us and we’ll set you up.' }, { status: 503 })
  }
  console.info('[claim:dev]', data, photos.map((f) => f.name))
  return Response.json({ ok: true, dev: true })
}
