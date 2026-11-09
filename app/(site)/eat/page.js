import EatView from '@/components/tto/views/Eat'
import { getSite, getArticles } from '@/lib/data'
import { packSite } from '@/lib/pack.mjs'
import { pageMeta } from '@/lib/seo'
import { CATEGORIES } from '@/lib/site'

export const revalidate = 900

export const metadata = pageMeta({ title: 'Eat — Tamil food in Toronto', description: CATEGORIES.eat.desc, path: '/eat' })

export default async function EatPage() {
  const [raw, articles] = await Promise.all([getSite(), getArticles({ category: 'eat', limit: 12 })])
  return <EatView raw={packSite(raw, (b) => b.category === 'food')} nowAt={Date.now()} articles={articles} />
}
