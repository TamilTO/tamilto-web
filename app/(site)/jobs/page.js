import JobsView from '@/components/tto/market/Jobs'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Jobs at Tamil businesses", description: "Work at a Tamil business in Toronto and the GTA. Full-time, part-time and seasonal jobs.", path: '/jobs' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <JobsView raw={packSite(raw, marketKeep('jobs', raw, market))} market={market} nowAt={Date.now()} />
}
