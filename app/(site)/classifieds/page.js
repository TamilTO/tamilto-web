import ClassifiedsView from '@/components/tto/market/Classifieds'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Tamil Toronto classifieds", description: "Rentals, rooms, items for sale and services from the Tamil Toronto community.", path: '/classifieds' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <ClassifiedsView raw={packSite(raw, marketKeep('classifieds', raw, market))} market={market} nowAt={Date.now()} />
}
