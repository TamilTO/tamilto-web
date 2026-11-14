import { getTicker } from '@/lib/server/ticker-cache'

// The Updates strip under the menu reads this every 5 minutes.
export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(await getTicker(), { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=600' } })
}
