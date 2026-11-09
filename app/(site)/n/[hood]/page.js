import { notFound } from 'next/navigation'
import HoodView from '@/components/tto/views/Hood'
import { getSite, getEvents } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const site = await getSite()
  return site.neighbourhoods.map((h) => ({ hood: h.key }))
}

export async function generateMetadata({ params }) {
  const { hood } = await params
  const h = (await getSite()).neighbourhoods.find((x) => x.key === hood)
  if (!h) return {}
  return pageMeta({ title: `Tamil businesses in ${h.name}`, description: `${h.tagline} ${h.description}`, path: `/n/${h.key}` })
}

export default async function HoodPage({ params }) {
  const { hood } = await params
  const [raw, events] = await Promise.all([getSite(), getEvents()])
  if (!raw.neighbourhoods.some((h) => h.key === hood)) notFound()
  return <HoodView raw={packSite(raw)} nowAt={Date.now()} hoodKey={hood} events={events} />
}
