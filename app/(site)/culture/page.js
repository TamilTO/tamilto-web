import CultureView from '@/components/tto/views/Culture'
import { getSite, getArticles, getEvents } from '@/lib/data'
import { pageMeta } from '@/lib/seo'
import { CATEGORIES } from '@/lib/site'

export const revalidate = 900

export const metadata = pageMeta({ title: 'Culture — Tamil Toronto', description: CATEGORIES.culture.desc, path: '/culture' })

export default async function CulturePage() {
  const [raw, articles, events] = await Promise.all([getSite(), getArticles({ categories: ['culture', 'people', 'guides', 'business'], limit: 13 }), getEvents()])
  // Only the "Learn it yourself" list needs businesses here.
  const slim = { ...raw, businesses: raw.businesses.filter((b) => b.category === 'learn') }
  return <CultureView raw={slim} nowAt={Date.now()} articles={articles} events={events} />
}
