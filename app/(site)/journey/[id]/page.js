import { notFound } from 'next/navigation'
import JourneyView from '@/components/tto/views/Journey'
import { getSite } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  return (await getSite()).journeys.map((j) => ({ id: j.id }))
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const j = (await getSite()).journeys.find((x) => x.id === id)
  if (!j) return {}
  return pageMeta({ title: `${j.title}: Tamil vendors, step by step`, description: j.description, path: `/journey/${j.id}` })
}

export default async function JourneyPage({ params }) {
  const { id } = await params
  const raw = await getSite()
  if (!raw.journeys.some((j) => j.id === id)) notFound()
  return <JourneyView raw={packSite(raw, (b) => new Set((raw.journeys.find((j) => j.id === id) || { steps: [] }).steps.flatMap((x) => x.businessIds)).has(b.id))} nowAt={Date.now()} journeyId={id} />
}
