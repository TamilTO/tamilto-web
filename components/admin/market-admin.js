// Marketplace sections of the admin: what each kind of marketplace item holds and how it is edited.
// Every item is one row in market_items; its words live in the `data` column.
import { PAGES, NOTICES, NEWSLETTER, AWARDS, CLASSIFIED_KINDS, JOB_TYPES } from '@/lib/market-defaults.mjs'

// [key, label, field kind, options]. Field kinds: text, textarea, check, number, color, select:<list>,
// 'lines' (a list, one per line, saved as a|b|c), 'pairs' (Title | keywords lines, saved as [{l, kw}]).
export const MK = {
  request: {
    label: 'Customer requests', one: 'request', dot: '#FF6B7D', expires: true, view: '/requests',
    hint: 'Requests from customers. Approve new ones in Inbox → Client submissions. The customer’s phone and email stay private: businesses reply through the website.',
    fields: [['t', 'What they need', 'text', { req: true, full: true }], ['cat', 'Category', 'select:reqcats', { req: true }], ['sub', 'Vendor type', 'text', { ph: 'e.g. Catering' }], ['area', 'Area', 'select:hoods0'], ['when', 'When', 'text', { ph: 'e.g. March 2027' }], ['size', 'Size', 'text', { ph: 'e.g. 200 guests' }], ['budget', 'Budget', 'text'], ['d', 'Details', 'textarea', { full: true }]],
    title: (d) => d.t, sub: (d, hn) => [d.cat, d.sub, hn(d.area), d.when].filter(Boolean).join(' · '),
  },
  job: {
    label: 'Jobs', one: 'job', dot: '#A5C25A', expires: true, view: '/jobs',
    hint: 'Job posts. Businesses with “Hiring” on their profile also show on the Jobs page automatically.',
    fields: [['t', 'Job title', 'text', { req: true, full: true }], ['biz', 'Business name', 'text', { req: true }], ['bizId', 'Link to a listed business', 'select:biz0'], ['type', 'Job type', 'select:jobtypes'], ['area', 'Area', 'select:hoods0'], ['pay', 'Pay', 'text', { ph: 'e.g. $18–21/hr' }], ['phone', 'Phone / WhatsApp to apply', 'tel', { req: true }], ['d', 'Details', 'textarea', { full: true }]],
    title: (d) => d.t, sub: (d, hn) => [d.biz, d.type, hn(d.area), d.pay].filter(Boolean).join(' · '),
  },
  classified: {
    label: 'Classifieds', one: 'classified ad', dot: '#4FB6DE', expires: true, view: '/classifieds',
    hint: 'Rentals, rooms, items for sale and services from readers.',
    fields: [['t', 'Title', 'text', { req: true, full: true }], ['kind', 'Type', 'select:clkinds', { req: true }], ['price', 'Price', 'text'], ['area', 'Area', 'select:hoods0'], ['phone', 'Phone / WhatsApp', 'tel', { req: true }], ['boost', 'Boosted (paid, shown first with a gold border)', 'check'], ['d', 'Details', 'textarea', { full: true }]],
    title: (d) => d.t, sub: (d, hn) => [d.kind, d.price, hn(d.area)].filter(Boolean).join(' · '),
  },
  creator: {
    label: 'Creators', one: 'creator', dot: '#F59A3D', view: '/creators',
    hint: 'Creators businesses can book. Only add people who signed up and agreed to label paid posts.',
    fields: [['n', 'Name', 'text', { req: true }], ['h', 'Handle', 'text', { ph: '@handle' }], ['niche', 'Niche', 'text', { ph: 'Food, Comedy, Weddings…' }], ['plats', 'Platforms', 'text', { ph: 'Instagram, TikTok' }], ['aud', 'Audience', 'text', { ph: 'e.g. 48K followers' }], ['area', 'Area', 'select:hoods0'], ['rate', 'Rate', 'text', { ph: 'e.g. $250–600 per post' }], ['tone', 'Card colour', 'select:tones'], ['bio', 'Short bio', 'textarea', { full: true }]],
    title: (d) => d.n, sub: (d) => [d.h, d.niche, d.aud].filter(Boolean).join(' · '),
  },
  deal: {
    label: 'Deals', one: 'deal', dot: '#FF9A66', expires: true, view: '/deals',
    hint: 'Offers shown on the Deals page. A deal typed on a business profile also shows there automatically.',
    fields: [['bizId', 'Business', 'select:biz', { req: true }], ['t', 'The offer', 'text', { req: true, full: true, ph: 'e.g. 15% off wedding catering booked this month' }], ['until', 'Shown as “until”', 'text', { ph: 'e.g. Dec 31' }]],
    title: (d) => d.t, sub: (d, hn, bn) => bn(d.bizId),
  },
  partner: {
    label: 'Trusted partners', one: 'partner', dot: '#C6A3F0', view: '/partners',
    hint: 'Money transfer, travel and insurance partners. Only list licensed companies, and say so if TamilTO earns a fee.',
    fields: [['n', 'Name', 'text', { req: true }], ['kind', 'Type', 'text', { ph: 'e.g. Money transfer' }], ['href', 'Website', 'url', { req: true, ph: 'https://' }], ['lic', 'Licence / registration', 'text', { full: true }], ['d', 'Description', 'textarea', { full: true }]],
    title: (d) => d.n, sub: (d) => [d.kind, d.lic].filter(Boolean).join(' · '),
  },
  sponsor: {
    label: 'Sponsored spots', one: 'sponsored spot', dot: '#F5B83D', expires: true,
    hint: 'Paid “Featured … of the month” spots. Where: cat:<category key> for the directory (e.g. cat:restaurants), or <hub>:<group> for a hub page (e.g. realestate:All, pros:Lawyers).',
    fields: [['slot', 'Where it shows', 'text', { req: true, ph: 'cat:restaurants' }], ['bizId', 'Business', 'select:biz', { req: true }], ['title', 'Label', 'text', { ph: 'Featured caterer of the month', full: true }]],
    title: (d, hn, bn) => bn(d.bizId), sub: (d) => [d.slot, d.title].filter(Boolean).join(' · '),
  },
  vertical: {
    label: 'Hub pages', one: 'hub page', dot: '#5EC2D1', slugFrom: 't', view: (d) => (d.id === 'weddings' ? '/plan' : '/v/' + d.id),
    hint: 'Weddings, Real estate, Professional services and Classes. Each group finds businesses whose name or type contains one of its keywords.',
    fields: [['t', 'Name', 'text', { req: true }], ['ta', 'Tamil name', 'text'], ['tone', 'Colour', 'color'], ['journey', 'Life moment link', 'select:journeys'], ['d', 'Intro', 'textarea', { full: true }], ['notice', 'Notice (e.g. licensing reminder)', 'textarea', { full: true }], ['groups', 'Groups (one per line: Name | keywords, comma separated)', 'pairs', { full: true, req: true, ph: 'Realtors | realtor,real estate,realty' }], ['months', 'Busy season months (numbers 1–12, comma separated)', 'text', { ph: '4,5,6,7,8,9' }], ['seasonOn', 'Message in busy season', 'text', { full: true }], ['seasonOff', 'Message the rest of the year', 'text', { full: true }]],
    title: (d) => d.t, sub: (d) => (d.groups || []).map((g) => g.l).join(' · '),
  },
  eventType: {
    label: 'Event types', one: 'event type', dot: '#E2629B', slugFrom: 't', view: (d) => '/plan/' + d.id,
    hint: 'The event buttons on Plan an event. “Vendors needed” must match the vendor type names exactly.',
    fields: [['t', 'Name', 'text', { req: true }], ['ta', 'Tamil name', 'text'], ['alias', 'Other words people search for (comma separated)', 'text', { full: true }], ['needs', 'Vendors needed (one per line)', 'lines', { full: true, req: true }]],
    title: (d) => d.t, sub: (d) => String(d.needs || '').split('|').filter(Boolean).length + ' vendor types',
  },
  vendorType: {
    label: 'Vendor types', one: 'vendor type', dot: '#9C86F0', view: '/plan',
    hint: 'How Plan an event sorts businesses into vendor groups, by keywords in their name and type.',
    fields: [['l', 'Name', 'text', { req: true }], ['kw', 'Keywords (comma separated)', 'textarea', { full: true, req: true }], ['neg', 'Leave out businesses with these words', 'text', { full: true }]],
    title: (d) => d.l, sub: (d) => d.kw,
  },
  requestCat: {
    label: 'Request categories', one: 'request category', dot: '#FF6B7D', view: '/requests',
    fields: [['l', 'Name', 'text', { req: true }]],
    title: (d) => d.l, sub: () => 'Shown as a filter on Customer requests',
  },
  package: {
    label: 'Creator packages', one: 'creator package', dot: '#F59A3D', slugFrom: 't', view: '/creators',
    fields: [['t', 'Name', 'text', { req: true }], ['inc', 'What is included (one per line)', 'lines', { full: true, req: true }]],
    title: (d) => d.t, sub: (d) => String(d.inc || '').split('|').join(' · '),
  },
  adOption: {
    label: 'Advertising options', one: 'advertising option', dot: '#F7F0E6', slugFrom: 't', view: '/advertise',
    fields: [['t', 'Name', 'text', { req: true }], ['best', 'Best for', 'text'], ['d', 'Description', 'textarea', { full: true }]],
    title: (d) => d.t, sub: (d) => d.best,
  },
}
export const MK_ORDER = ['request', 'job', 'classified', 'deal', 'creator', 'partner', 'sponsor', 'vertical', 'eventType', 'vendorType', 'requestCat', 'package', 'adOption']

/** Item row → form draft. */
export function toDraft(kind, item) {
  const spec = MK[kind], data = { ...((item && item.data) || {}) }
  const d = { _kind: kind, is_hidden: !!(item && item.is_hidden), expires_on: (item && item.expires_on) || '', _id: data.id || '' }
  for (const [k, , type] of spec.fields) {
    if (type === 'lines') d[k] = String(data[k] || '').split('|').filter(Boolean).join('\n')
    else if (type === 'pairs') d[k] = (data[k] || []).map((g) => g.l + ' | ' + (g.kw || '')).join('\n')
    else if (type === 'check') d[k] = !!data[k]
    else d[k] = data[k] ?? ''
  }
  if (kind === 'vertical') {
    const se = data.seasonal || {}
    Object.assign(d, { months: (se.months || []).join(','), seasonOn: se.on || '', seasonOff: se.off || '' })
  }
  return d
}

/** Form draft → data column. Throws a form message when something required is missing. */
export function fromDraft(kind, d, keep = {}) {
  const spec = MK[kind], out = { ...keep }
  for (const [k, label, type, o = {}] of spec.fields) {
    if (['months', 'seasonOn', 'seasonOff'].includes(k)) continue
    let v = d[k]
    if (type === 'lines') v = String(v || '').split('\n').map((x) => x.trim()).filter(Boolean).join('|')
    else if (type === 'pairs') v = String(v || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf('|'); return i < 0 ? { l: x, kw: x.toLowerCase() } : { l: x.slice(0, i).trim(), kw: x.slice(i + 1).trim() } }).filter((g) => g.l)
    else if (type === 'check') v = !!v
    else v = String(v ?? '').trim()
    if (o.req && (Array.isArray(v) ? !v.length : !v)) throw Object.assign(new Error(`Fill in “${label.replace(/ \(.*/, '')}”.`), { form: true })
    if (type === 'url' && v && !/^https:\/\//.test(v)) throw Object.assign(new Error('Website must start with https://'), { form: true })
    if (v === '' || v === false) delete out[k]
    else out[k] = v
  }
  if (kind === 'vertical') {
    const months = String(d.months || '').split(/[\s,]+/).map(Number).filter((m) => m >= 1 && m <= 12)
    out.seasonal = months.length || d.seasonOn || d.seasonOff ? { months, on: String(d.seasonOn || '').trim(), off: String(d.seasonOff || '').trim() } : undefined
    if (!out.seasonal) delete out.seasonal
  }
  return out
}

/** Reader posts in the inbox that become marketplace items. */
export const FROM_SUB = {
  request: (f) => ({ t: f.t, cat: f.cat, area: f.area, when: f.when, size: f.size, budget: f.budget, d: f.d }),
  job: (f) => ({ t: f.t, biz: f.biz, type: f.type, area: f.area, pay: f.pay, phone: f.phone, d: f.d }),
  classified: (f) => ({ t: f.t, kind: f.kind, price: f.price, area: f.area, phone: f.phone, d: f.d }),
  creator: (f) => ({ n: f.name, h: f.handle, niche: f.niche, plats: f.plats }),
}

export const MK_SETTINGS = { PAGES, NOTICES, NEWSLETTER, AWARDS, CLASSIFIED_KINDS, JOB_TYPES }
export const PAGE_NAMES = { requests: 'Customer requests', creators: 'Creators', awards: 'Best of awards', jobs: 'Jobs', classifieds: 'Classifieds', deals: 'Deals', partners: 'Trusted partners', advertise: 'Advertise', more: 'More' }
