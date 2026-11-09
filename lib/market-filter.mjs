// Server side: which businesses a marketplace page actually needs, so pages stay small.
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const wb = (kw) => { const p = String(kw || '').split(',').map((x) => x.trim()).filter(Boolean).map(esc); return p.length ? new RegExp('\\b(?:' + p.join('|') + ')\\b', 'i') : null }

/** A filter for packSite(): the businesses each marketplace page uses. null = all of them. */
export function marketKeep(page, site, market) {
  if (['requests', 'creators', 'partners', 'advertise', 'more', 'classifieds'].includes(page)) return () => false
  if (page === 'jobs') { const ids = new Set(market.jobs.map((j) => j.bizId).filter(Boolean)); return (b) => (b.jobs && b.jobs.length) || ids.has(b.id) }
  if (page === 'deals') { const ids = new Set(market.deals.map((d) => d.bizId)); return (b) => !!b.deal || ids.has(b.id) }
  if (page === 'awards') {
    const cat = Object.fromEntries(site.categories.map((c) => [c.key, c.label]))
    const tests = (market.awards.cats || []).map((c) => {
      const re = wb(c.kw), ng = wb(c.neg), ids = Array.isArray(c.ids) && c.ids.length ? new Set(c.ids) : null
      return (b) => {
        if (ids) return ids.has(b.id)
        const h = [b.listedAs, cat[b.category], b.short].filter(Boolean).join(' ')
        return ((c.cat && b.category === c.cat) || (re && (re.test(b.name) || re.test(h)))) && !(ng && ng.test(b.name + ' ' + h))
      }
    })
    return (b) => tests.some((t) => t(b))
  }
  return null
}
