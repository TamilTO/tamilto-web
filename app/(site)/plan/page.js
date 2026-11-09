import PlanView from '@/components/tto/market/Plan'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300
export const metadata = pageMeta({ title: 'Plan a Tamil event in Toronto', description: 'Weddings, puberty ceremonies, birthdays and poojas. Every vendor you need, ranked by cousin approval.', path: '/plan' })

export default async function Page() {
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  return <PlanView raw={raw} market={market} nowAt={Date.now()} />
}
