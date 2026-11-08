import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'

// The admin panel calls this after every save so changes reach visitors within seconds.
// Body: { paths: ['/b/some-business', '/directory'] }   Header: x-revalidate-secret: <REVALIDATE_SECRET>
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y) }

export async function POST(req) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return new Response('REVALIDATE_SECRET is not set', { status: 500 })
  if (!same(req.headers.get('x-revalidate-secret') || '', secret)) return new Response('Unauthorized', { status: 401 })
  const body = await req.json().catch(() => ({}))
  const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string' && p.startsWith('/')).slice(0, 50) : []
  if (!paths.length) revalidatePath('/', 'layout')
  else paths.forEach((p) => revalidatePath(p))
  return Response.json({ revalidated: paths.length ? paths : ['everything'] })
}
