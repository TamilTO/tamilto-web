import { notFound } from 'next/navigation'
import PlanView from '@/components/tto/market/Plan'
import { getSite, getMarket } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300

export async function generateStaticParams() {
  return (await getMarket()).eventTypes.map((e) => ({ event: e.id }))
}

export async function generateMetadata({ params }) {
  const { event } = await params
  const e = (await getMarket()).eventTypes.find((x) => x.id === event)
  if (!e) return {}
  return pageMeta({ title: `Plan a Tamil ${e.t.toLowerCase()} in Toronto`, description: `Every vendor for a ${e.t.toLowerCase()}, ranked by cousin approval: ${String(e.needs || '').split('|').join(', ')}.`, path: `/plan/${e.id}` })
}

export default async function Page({ params }) {
  const { event } = await params
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  if (!market.eventTypes.some((e) => e.id === event)) notFound()
  return <PlanView raw={raw} market={market} nowAt={Date.now()} id={event} />
}
