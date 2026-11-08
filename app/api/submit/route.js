
const KINDS = ['tip', 'event', 'listing', 'ad']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MAX_PHOTO = 4 * 1024 * 1024 // stays under Vercel's 4.5 MB request limit
const SKIP = new Set(['kind', 'consent', 'company_website', 'photo'])

/** Tips, events and ad enquiries. Every one lands in the review queue; nothing is ever auto-published.
 *  Step 15/20 saves these to the submissions table in Supabase. */
export async function POST(req) {
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

  if (process.env.NODE_ENV === 'production') {
    // Not connected yet: refuse rather than pretend we received it.
    return Response.json({ error: 'Online submissions open soon. For now, email hello@tamilto.com.' }, { status: 503 })
  }
  console.info('[submission:dev]', kind, Object.fromEntries(fields.map((f) => [f.key, f.value])), hasPhoto ? photo.name : '')
  return Response.json({ ok: true, dev: true })
}
