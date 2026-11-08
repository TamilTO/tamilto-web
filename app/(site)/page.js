import HomeView from '@/components/tto/views/Home'
import { getSite, getEvents, getArticles } from '@/lib/data'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300

export const metadata = pageMeta({
  title: 'TamilTO — Find anything Tamil in the GTA',
  description: 'The Tamil-owned business directory for the GTA, plus what’s on and where to eat. Ask like you’d ask your cousin.',
  path: '/',
})

export default async function Home() {
  const [raw, events, eat, culture] = await Promise.all([getSite(), getEvents(), getArticles({ category: 'eat', limit: 3 }), getArticles({ categories: ['culture', 'people', 'guides', 'business'], limit: 3 })])
  return <HomeView raw={raw} nowAt={Date.now()} events={events} eat={eat} culture={culture} />
}
