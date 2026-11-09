import { notFound, redirect } from 'next/navigation'
import VertView from '@/components/tto/market/Vert'
import { getSite, getMarket } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300

export async function generateStaticParams() {
  return (await getMarket()).verticals.filter((v) => v.id !== 'weddings').map((v) => ({ id: v.id }))
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const v = (await getMarket()).verticals.find((x) => x.id === id)
  if (!v) return {}
  return pageMeta({ title: `${v.t}: Tamil businesses in Toronto`, description: v.d, path: `/v/${v.id}` })
}

export default async function Page({ params }) {
  const { id } = await params
  if (id === 'weddings') redirect('/plan/wedding')
  const [raw, market] = await Promise.all([getSite(), getMarket()])
  if (!market.verticals.some((v) => v.id === id)) notFound()
  return <VertView raw={packSite(raw)} market={market} nowAt={Date.now()} id={id} />
}
