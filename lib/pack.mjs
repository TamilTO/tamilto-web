// Makes the business list small enough to send to phones.
// With ~4,000 businesses the plain list is ~2.5 MB, mostly repeated field names and empty
// values. Packed, each business is one row of values in a fixed column order, and empty
// values at the end of a row are left off. useSite() unpacks it in the browser.

const COLS = [
  ['id', ''], ['name', ''], ['category', ''], ['neighbourhood', ''], ['listedAs', ''], ['short', ''], ['city', ''], ['address', ''],
  ['lat', null], ['lng', null], ['tone', ''], ['phone', ''], ['cell', ''], ['website', ''], ['photos', []], ['hours', null],
  ['featured', false], ['verified', false], ['recommendations', 0], ['acceptsQuotes', false], ['deal', ''], ['jobs', []],
  ['byAppointment', false], ['speaksTamil', false], ['plan', 'free'], ['googleMapsUrl', ''], ['googleReviewsUrl', ''],
  ['social', null], ['email', ''], ['contactName', ''], ['fax', ''], ['geocoded', false], ['seed', 0],
]
const empty = (v, d) => v === undefined || v === null || v === d || v === '' || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)

/** Server: site with its businesses packed. `keep` optionally limits which businesses are sent. */
export function packSite(site, keep) {
  const list = keep ? site.businesses.filter(keep) : site.businesses
  const rows = list.map((b) => {
    const r = COLS.map(([k, d]) => (empty(b[k], d) ? 0 : b[k]))
    while (r.length && r[r.length - 1] === 0) r.pop()
    return r
  })
  const { businesses, ...rest } = site
  void businesses
  return { ...rest, bz: rows }
}

/** Browser or server: undo packSite. Plain sites pass through unchanged. */
export function unpackSite(raw) {
  if (!raw || !raw.bz) return raw
  const { bz, ...rest } = raw
  return {
    ...rest,
    businesses: bz.map((r) => {
      const b = {}
      COLS.forEach(([k, d], i) => { const v = r[i]; b[k] = v === undefined || v === 0 ? (Array.isArray(d) ? [] : d) : v })
      return b
    }),
  }
}

/** The small business index the shortlist drawer and quote form use. */
export const indexOf = (site) => {
  const cat = Object.fromEntries(site.categories.map((c) => [c.key, c.label]))
  return site.businesses.map((b) => [b.id, b.name, cat[b.category] || '', b.tone, b.phone || '', b.cell || '', b.acceptsQuotes ? 1 : 0, b.hours || 0, b.byAppointment ? 1 : 0])
}
export const unpackIndex = (rows) => rows.map(([id, name, catLabel, tone, phone, cell, q, hours, appt]) => ({ id, name, catLabel, tone, phone, cell, acceptsQuotes: !!q, hours: hours || null, byAppointment: !!appt }))
