export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
export const CONTACT_EMAIL = 'hello@tamilto.com'
export const SITE_NAME = 'TamilTO'
export const TAGLINE = 'The pulse of Tamil Toronto'
export const TAGLINE_ALT = 'Tamil Toronto, all in one place'
export const DESCRIPTION =
  "Where to eat, what's on this weekend, Tamil-owned businesses and the stories that make Tamil Toronto."

export const CATEGORIES = {
  eat: { label: 'Eat', ta: 'சாப்பாடு', desc: 'Kothu, dosai, short eats and the spots worth the drive up Markham Road. Saapadu first, always.' },
  events: { label: 'Events', ta: 'நிகழ்வுகள்', desc: 'Festivals, concerts, movie nights and everything worth leaving the house for.' },
  business: { label: 'Business', ta: 'வணிகம்', desc: 'Tamil-owned spots opening, growing and quietly running the GTA. Support local, machan.' },
  people: { label: 'People', ta: 'மக்கள்', desc: 'Artists, athletes, students and creators doing the most — the ones your amma already brags about.' },
  culture: { label: 'Culture', ta: 'கலாச்சாரம்', desc: "Nostalgia, humour, weddings and traditions. The stuff we grew up with, and what we're making of it now." },
  guides: { label: 'Guides', ta: 'வழிகாட்டி', desc: 'Practical how-tos and directories: wedding halls, saree shops, groceries and services, sorted.' },
}
export const CATEGORY_KEYS = Object.keys(CATEGORIES)

export const BUSINESS_CATEGORIES = ["Real estate & homes","Insurance, mortgage & finance","Lawyers & claims","Renovation & interiors","Trades, moving & repairs","Auto & driving schools","Food, catering & groceries","Weddings & events","Beauty, fashion & jewellery","Health & care","Education & classes","Media, print & tech","Travel, shipping & money transfer","Community & other services"]
export const NEIGHBOURHOODS = ['Scarborough', 'Markham', 'Brampton', 'Mississauga', 'Toronto', 'Ajax/Pickering', 'Richmond Hill', 'GTA-wide']
export const EVENT_TYPES = ['Festival', 'Culture', 'Concert', 'Food', 'Film', 'Sports', 'Community']

export const SOCIAL = {
  instagram: 'https://instagram.com/tamilto',
  tiktok: 'https://tiktok.com/@tamilto',
  youtube: 'https://youtube.com/@tamilto',
  facebook: 'https://facebook.com/tamilto',
}

// i18n: English ships at launch. When Tamil launches, add 'ta' to `live`,
// move routes under app/(site)/[lang] and hreflang() in lib/seo.js picks it up.
export const LOCALES = { default: 'en', live: ['en'], planned: ['ta'] }

export const articleHref = (a) => (a.category === 'events' ? `/events/${a.slug}` : `/${a.category}/${a.slug}`)
export const eventHref = (e) => `/events/${e.slug}`
export const businessHref = (b) => `/b/${b.id || b.slug}`
