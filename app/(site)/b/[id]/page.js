import { notFound } from 'next/navigation'
import BizView from '@/components/tto/views/Biz'
import JsonLd from '@/components/JsonLd'
import { getSite, getBusiness } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta, businessLd, breadcrumbLd } from '@/lib/seo'

export const revalidate = 3600

// Pages are built the first time someone visits, then cached and refreshed hourly (or instantly when the admin saves).
export async function generateStaticParams() {
  return []
}

async function load(id) {
  const b = await getBusiness(id)
  if (!b) return null
  const site = await getSite()
  const cat = site.categories.find((c) => c.key === b.category)
  const hood = site.neighbourhoods.find((h) => h.key === b.neighbourhood)
  // Only send what this page draws: same area (for the map) and same category (for "Also nearby").
  const raw = { ...site, businesses: site.businesses.filter((x) => x.neighbourhood === b.neighbourhood || x.category === b.category) }
  return { b, raw, cat, hood }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const d = await load(id)
  if (!d) return {}
  const { b, cat, hood } = d
  return pageMeta({
    title: `${b.name} · ${cat?.label || 'Tamil business'} in ${hood?.name || b.city}`,
    description: `${b.name}: ${b.short} ${cat?.label || ''} in ${hood?.name || b.city}. WhatsApp, call or get directions on TamilTO.`.slice(0, 300),
    path: `/b/${b.id}`,
    image: typeof b.photos?.[0] === 'string' ? b.photos[0] : b.photos?.[0]?.url,
  })
}

export default async function BusinessPage({ params }) {
  const { id } = await params
  const d = await load(id)
  if (!d) notFound()
  const { b, raw, cat, hood } = d
  return (
    <>
      <BizView raw={packSite(raw, (x) => x.neighbourhood === b.neighbourhood || x.category === b.category)} nowAt={Date.now()} id={b.id} />
      <JsonLd data={[businessLd(b, { categoryLabel: cat?.label, areaName: hood?.name }), breadcrumbLd([{ name: 'Directory', path: '/directory' }, { name: cat?.label || 'Business', path: `/directory?cat=${b.category}` }, { name: b.name, path: `/b/${b.id}` }])]} />
    </>
  )
}
