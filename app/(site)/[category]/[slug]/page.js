import { notFound } from 'next/navigation'
import ArticleView from '@/components/ArticleView'
import { getArticle, getArticles } from '@/lib/data'
import { articleMeta } from '@/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const all = await getArticles({ limit: 1000 })
  return all.filter((a) => a.category !== 'events').map((a) => ({ category: a.category, slug: a.slug }))
}

export async function generateMetadata({ params }) {
  const { category, slug } = await params
  const a = await getArticle(slug)
  return a && a.category === category ? articleMeta(a) : {}
}

export default async function ArticlePage({ params }) {
  const { category, slug } = await params
  const a = await getArticle(slug)
  if (!a || a.category !== category) notFound()
  return <ArticleView article={a} />
}
