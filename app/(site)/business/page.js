import ForBizView from '@/components/tto/views/ForBiz'
import { getSite } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'For Tamil-owned businesses: claim your free listing',
  description: 'Put your business on the TamilTO map. Claim your free listing, get the Verified Tamil-owned badge and take WhatsApp messages and quote requests.',
  path: '/business',
})

export default async function ForBusiness({ searchParams }) {
  const sp = await searchParams
  const raw = await getSite()
  return <ForBizView raw={packSite(raw)} nowAt={Date.now()} claimId={typeof sp.claim === 'string' ? sp.claim : null} />
}
