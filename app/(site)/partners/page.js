import PartnersView from '@/components/tto/market/Partners'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300
export const metadata = pageMeta({ title: "Trusted partners", description: "Money transfer, travel, insurance and more, from partners TamilTO trusts.", path: '/partners' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <PartnersView raw={raw} market={market} nowAt={Date.now()} />
}
