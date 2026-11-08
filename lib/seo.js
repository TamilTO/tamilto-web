import { SITE_URL, SITE_NAME, DESCRIPTION, CATEGORIES, articleHref, eventHref, businessHref } from './site'

// When Tamil launches: return {'en-CA': path, 'ta-CA': `/ta${path}`, 'x-default': path}
export const hreflang = (path) => ({ 'en-CA': path, 'x-default': path })

export function pageMeta({ title, description = DESCRIPTION, path = '/', image, type = 'website', publishedTime, authors, noindex }) {
  const images = image ? [{ url: image, width: 1200, height: 630 }] : undefined
  return {
    title,
    description,
    alternates: { canonical: path, languages: hreflang(path) },
    openGraph: { title, description, url: path, type, siteName: SITE_NAME, locale: 'en_CA', images, publishedTime, authors },
    twitter: { card: 'summary_large_image', site: '@tamilto', title, description, images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

// Photos are stored as public URLs (Supabase Storage from step 15 on).
const imgUrl = (media) => (typeof media === 'string' ? media : media?.url) || undefined

export function articleMeta(a) {
  return pageMeta({
    title: a.seo?.title || a.title,
    description: a.seo?.description || a.dek,
    path: articleHref(a),
    type: 'article',
    publishedTime: a.publishDate,
    authors: [a.author],
    image: imgUrl(a.seo?.ogImage), // otherwise the generated opengraph-image is used
  })
}

const publisher = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` } }

export const orgLd = () => [
  { '@context': 'https://schema.org', ...publisher, sameAs: ['https://instagram.com/tamilto', 'https://tiktok.com/@tamilto'] },
  {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL,
    potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/directory?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
  },
]

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: SITE_URL + it.path })),
})

export const articleLd = (a) => ({
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: a.title,
  description: a.dek,
  datePublished: a.publishDate,
  author: { '@type': 'Person', name: a.author },
  publisher,
  mainEntityOfPage: SITE_URL + articleHref(a),
  articleSection: CATEGORIES[a.category]?.label,
  inLanguage: 'en-CA',
  ...(imgUrl(a.hero) ? { image: [imgUrl(a.hero)] } : {}),
  ...(a.sponsored ? { sponsor: { '@type': 'Organization', name: a.sponsorName } } : {}),
})

export const eventLd = (e) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: e.title,
  description: e.description,
  startDate: e.start,
  ...(e.end ? { endDate: e.end } : {}),
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place', name: e.venue,
    address: { '@type': 'PostalAddress', streetAddress: e.address, addressLocality: e.neighbourhood, addressRegion: 'ON', addressCountry: 'CA' },
  },
  offers: {
    '@type': 'Offer', price: e.price ?? 0, priceCurrency: 'CAD', url: e.ticketUrl || SITE_URL + eventHref(e),
    availability: e.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
  },
  ...(imgUrl(e.image) ? { image: [imgUrl(e.image)] } : {}),
})

const BIZ_TYPE = { food: 'FoodEstablishment', realestate: 'RealEstateAgent', finance: 'FinancialService', legal: 'LegalService', health: 'MedicalBusiness', beauty: 'HealthAndBeautyBusiness', auto: 'AutomotiveBusiness', home: 'HomeAndConstructionBusiness', trades: 'HomeAndConstructionBusiness', learn: 'EducationalOrganization', travel: 'TravelAgency' }
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const businessLd = (b, { categoryLabel, areaName } = {}) => ({
  '@context': 'https://schema.org',
  '@type': BIZ_TYPE[b.category] || 'LocalBusiness',
  name: b.name,
  description: b.short || categoryLabel,
  url: SITE_URL + businessHref(b),
  ...(b.phone || b.cell ? { telephone: '+1' + (b.phone || b.cell) } : {}),
  ...(b.email ? { email: b.email } : {}),
  address: { '@type': 'PostalAddress', ...(b.address ? { streetAddress: b.address } : {}), addressLocality: b.city || areaName, addressRegion: 'ON', addressCountry: 'CA' },
  ...(b.lat && b.geocoded ? { geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng } } : {}),
  ...(Array.isArray(b.hours) ? { openingHoursSpecification: b.hours.map((d, i) => (d && d.open && d.close ? { '@type': 'OpeningHoursSpecification', dayOfWeek: DAY[i], opens: d.open, closes: d.close } : null)).filter(Boolean) } : {}),
  ...(b.website || b.social ? { sameAs: [b.website, ...Object.values(b.social || {})].filter((u) => /^https?:/.test(u || '')) } : {}),
  ...(imgUrl(b.photos?.[0]) ? { image: [imgUrl(b.photos[0])] } : {}),
})
