import AwardsView from '@/components/tto/market/Awards'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Best of Tamil Toronto awards", description: "Nominate and vote for the best Tamil businesses in Toronto.", path: '/awards' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <AwardsView raw={packSite(raw, marketKeep('awards', raw, market))} market={market} nowAt={Date.now()} />
}
