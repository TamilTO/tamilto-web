import RequestsView from '@/components/tto/market/Requests'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { packSite } from '@/lib/pack.mjs'
import { marketKeep } from '@/lib/market-filter.mjs'

export const revalidate = 300
export const metadata = pageMeta({ title: "Customer requests", description: "Post one request and get replies from Tamil Toronto businesses: caterers, decorators, tutors, realtors and more.", path: '/requests' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <RequestsView raw={packSite(raw, marketKeep('requests', raw, market))} market={market} nowAt={Date.now()} />
}
