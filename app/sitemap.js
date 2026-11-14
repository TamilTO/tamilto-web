import { getArticles, getEvents, getSite, getMarket } from '@/lib/data'
import { SITE_URL, CATEGORY_KEYS, articleHref, eventHref } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap() {
  const [articles, events, site, market] = await Promise.all([getArticles({ limit: 5000 }), getEvents(), getSite(), getMarket()])
  const u = (p) => SITE_URL + p
  const sections = CATEGORY_KEYS.filter((k) => !['events', 'business'].includes(k))
  return [
    { url: u('/'), changeFrequency: 'daily', priority: 1 },
    { url: u('/directory'), changeFrequency: 'daily', priority: 0.9 },
    { url: u('/events'), changeFrequency: 'daily', priority: 0.8 },
    ...sections.map((k) => ({ url: u(`/${k}`), changeFrequency: 'daily', priority: 0.7 })),
    ...['/plan', '/requests', '/jobs', '/classifieds', '/deals', '/awards'].map((p) => ({ url: u(p), changeFrequency: 'daily', priority: 0.7 })),
    ...['/updates'].map((p) => ({ url: u(p), changeFrequency: 'hourly', priority: 0.6 })),
    ...['/creators', '/partners', '/more'].map((p) => ({ url: u(p), changeFrequency: 'weekly', priority: 0.5 })),
    ...market.eventTypes.map((e) => ({ url: u(`/plan/${e.id}`), changeFrequency: 'weekly', priority: 0.6 })),
    ...market.verticals.filter((v) => v.id !== 'weddings').map((v) => ({ url: u(`/v/${v.id}`), changeFrequency: 'weekly', priority: 0.6 })),
    ...['/business', '/submit', '/advertise', '/about', '/editorial-policy'].map((p) => ({ url: u(p), changeFrequency: 'weekly', priority: 0.5 })),
    ...site.categories.map((c) => ({ url: u(`/directory?cat=${c.key}`), changeFrequency: 'weekly', priority: 0.6 })),
    ...site.neighbourhoods.map((h) => ({ url: u(`/n/${h.key}`), changeFrequency: 'weekly', priority: 0.7 })),
    ...site.journeys.map((j) => ({ url: u(`/journey/${j.id}`), changeFrequency: 'weekly', priority: 0.6 })),
    ...site.collections.map((c) => ({ url: u(`/c/${c.id}`), changeFrequency: 'weekly', priority: 0.6 })),
    ...articles.map((a) => ({ url: u(articleHref(a)), lastModified: a.publishDate, priority: 0.7 })),
    ...events.map((e) => ({ url: u(eventHref(e)), priority: 0.6 })),
    ...site.businesses.map((b) => ({ url: u(`/b/${b.id}`), priority: 0.6 })),
  ]
}
