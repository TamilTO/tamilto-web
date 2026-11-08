import DirectoryView from '@/components/tto/views/Directory'
import { getSite } from '@/lib/data'
import { indexSite, filterFromQuery } from '@/lib/tto'
import { pageMeta } from '@/lib/seo'

const pick = (sp) => Object.fromEntries(['q', 'cat', 'hood', 'web', 'email', 'addr', 'wa', 'view'].filter((k) => sp[k]).map((k) => [k, String(sp[k]).slice(0, 80)]))

export async function generateMetadata({ searchParams }) {
  const sp = pick(await searchParams)
  const site = indexSite(await getSite())
  const c = site.catByKey[sp.cat], h = site.hoodByKey[sp.hood]
  const what = c ? c.label : 'Tamil-owned businesses'
  const where = h ? ` in ${h.name}` : ' across the GTA'
  const filtered = Object.keys(sp).some((k) => k !== 'cat' && k !== 'hood')
  return pageMeta({
    title: c || h ? `${what}${where}` : 'Tamil business directory',
    description: `Find Tamil-owned ${c ? c.label.toLowerCase() : 'businesses'}${where}. WhatsApp, call or ask for a quote straight from TamilTO.`,
    path: '/directory' + (c || h ? '?' + new URLSearchParams({ ...(c ? { cat: sp.cat } : {}), ...(h ? { hood: sp.hood } : {}) }) : ''),
    noindex: filtered,
  })
}

export default async function Directory({ searchParams }) {
  const sp = pick(await searchParams)
  const raw = await getSite()
  const site = indexSite(raw)
  const initial = { q: sp.q || '', filter: filterFromQuery(sp, site), view: sp.view === 'map' ? 'map' : 'list' }
  return <DirectoryView raw={raw} nowAt={Date.now()} initial={initial} />
}
