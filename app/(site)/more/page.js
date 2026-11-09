import MoreView from '@/components/tto/market/More'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Everything on TamilTO", description: "Every part of TamilTO in one place, plus the Friday newsletter.", path: '/more' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <MoreView raw={packSite(raw, marketKeep('more', raw, market))} market={market} nowAt={Date.now()} />
}
