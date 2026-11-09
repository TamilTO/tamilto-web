import AdvertiseView from '@/components/tto/market/Advertise'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Advertise with TamilTO", description: "Featured listings, sponsored stories, creators and newsletter spots. Reach Tamil Toronto.", path: '/advertise' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <AdvertiseView raw={packSite(raw, marketKeep('advertise', raw, market))} market={market} nowAt={Date.now()} />
}
