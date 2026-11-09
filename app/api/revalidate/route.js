import { revalidatePath, revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// The admin panel calls this after every save so changes reach visitors within seconds.
// Allowed callers:
//   - a signed-in editor or owner: header  Authorization: Bearer <their login token>  (the admin panel)
//   - a script or tool:            header  x-revalidate-secret: <REVALIDATE_SECRET>
// Body (optional): { paths: ['/b/some-business', '/directory'] }. Without paths, the whole site refreshes.
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y) }

async function isEditor(token) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || !token || token.length > 4096) return false
  try {
    // Supabase checks the token itself; is_editor() is true only for owners and editors.
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data, error } = await db.rpc('is_editor')
    return !error && data === true
  } catch {
    return false
  }
}

export async function POST(req) {
  const secret = process.env.REVALIDATE_SECRET
  const given = req.headers.get('x-revalidate-secret')
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const ok = (secret && given && same(given, secret)) || (bearer && (await isEditor(bearer)))
  if (!ok) return new Response('Unauthorized', { status: 401 })
  const body = await req.json().catch(() => ({}))
  const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string' && p.startsWith('/')).slice(0, 50) : []
  // Saved data is re-read on the next visit (business, list, story and event caches).
  for (const t of ['site', 'articles', 'events']) revalidateTag(t)
  if (!paths.length) revalidatePath('/', 'layout')
  else paths.forEach((p) => revalidatePath(p))
  return Response.json({ revalidated: paths.length ? paths : ['everything'] })
}
