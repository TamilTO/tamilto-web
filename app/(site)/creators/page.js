import CreatorsView from '@/components/tto/market/Creators'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Tamil Toronto creators", description: "Book Tamil Toronto food, comedy, wedding and music creators through TamilTO.", path: '/creators' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <CreatorsView raw={packSite(raw, marketKeep('creators', raw, market))} market={market} nowAt={Date.now()} />
}
