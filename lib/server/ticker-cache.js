import 'server-only'
import { unstable_cache } from 'next/cache'
import { readTicker, fuel } from './ticker.mjs'

// News, police & fire calls and gold refresh every 5 minutes; the Ontario fuel survey is weekly (6 hours).
const fuelCached = unstable_cache(fuel, ['ticker-fuel-v1'], { revalidate: 6 * 3600 })
const tickerCached = unstable_cache(() => readTicker({ getFuel: fuelCached }), ['ticker-v1'], { revalidate: 300 })

export const getTicker = () => tickerCached().catch(() => ({ updatedAt: new Date().toISOString(), items: [], more: { news: [], calls: [] } }))
