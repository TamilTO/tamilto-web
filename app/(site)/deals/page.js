import DealsView from '@/components/tto/market/Deals'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300
export const metadata = pageMeta({ title: "Deals from Tamil businesses", description: "Offers and specials from Tamil businesses across Toronto and the GTA.", path: '/deals' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <DealsView raw={raw} market={market} nowAt={Date.now()} />
}
