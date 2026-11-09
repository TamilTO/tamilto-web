import { notFound } from 'next/navigation'
import CollView from '@/components/tto/views/Coll'
import { getSite } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  return (await getSite()).collections.map((c) => ({ id: c.id }))
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const c = (await getSite()).collections.find((x) => x.id === id)
  if (!c) return {}
  return pageMeta({ title: c.title, description: c.description, path: `/c/${c.id}` })
}

export default async function CollPage({ params }) {
  const { id } = await params
  const raw = await getSite()
  if (!raw.collections.some((c) => c.id === id)) notFound()
  return <CollView raw={packSite(raw, (b) => new Set((raw.collections.find((c) => c.id === id) || { businessIds: [] }).businessIds).has(b.id))} nowAt={Date.now()} collId={id} />
}
