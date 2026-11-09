import { getSite } from '@/lib/data'
import { indexOf } from '@/lib/pack.mjs'

// The small list of every live business (name, category, phone, hours) that the shortlist
// drawer and quote form use. Loaded by the browser once, instead of inside every page.
export const revalidate = 300

export async function GET() {
  return Response.json(indexOf(await getSite()), { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } })
}
