import HomeView from '@/components/tto/views/Home'
import { getSite, getEvents, getArticles, getMarket } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300

export const metadata = pageMeta({
  title: 'TamilTO — Find anything Tamil in the GTA',
  description: 'The Tamil-owned business directory for the GTA, plus what’s on and where to eat. Ask like you’d ask your cousin.',
  path: '/',
})

export default async function Home() {
  const [raw, events, eat, culture, market] = await Promise.all([getSite(), getEvents(), getArticles({ category: 'eat', limit: 3 }), getArticles({ categories: ['culture', 'people', 'guides', 'business'], limit: 3 }), getMarket()])
  return <HomeView raw={packSite(raw)} nowAt={Date.now()} events={events} eat={eat} culture={culture} market={market} />
}
