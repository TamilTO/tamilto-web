// One plain-English line for each change-log entry, e.g. “You made live business “Royal Creations””.
const ENTITY = {
  businesses: 'business', business_photos: 'business photo', events: 'event', event_photos: 'event photo', articles: 'article', collections: 'list',
  collection_items: 'list item', journeys: 'life moment', journey_steps: 'life-moment step', journey_step_businesses: 'life-moment business',
  categories: 'category', neighbourhoods: 'area', claims: 'claim', admins: 'team member', site_settings: 'site content', home_stories: 'home story',
}
const FIELD = {
  is_hidden: 'live/hidden', short_description: 'description', category_key: 'category', neighbourhood_key: 'area', listed_as: 'type', contact_name: 'contact',
  is_featured: 'featured', is_verified: 'verified', accepts_quotes: 'quote requests', speaks_tamil: 'speaks Tamil', google_maps_url: 'Google Maps link',
  google_reviews_url: 'reviews link', by_appointment: 'by appointment', starts_at: 'start time', ends_at: 'end time', publish_at: 'publish date', hero_image: 'main photo',
  storage_path: 'photo', sold_out: 'sold out', ticket_url: 'ticket link', featured_until: 'featured until', verified_at: '', verified_by: '', updated_at: '', seed: '', tone: 'colour',
}
const VERB = { insert: 'added', update: 'changed', delete: 'deleted' }

/** One plain-English line for a change-log entry. */
export function describe(r, who = {}, myId) {
  const d = r.diff || {}
  const val = (k) => (r.action === 'update' ? (d[k]?.to ?? null) : d[k])
  const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(r.entity_id || '')
  const name = val('name') || val('title') || val('label') || val('contact_name') || d.details?.biz || d.name?.from || (isId ? '' : r.entity_id)
  const person = !r.user_id ? 'The website' : r.user_id === myId ? 'You' : who[r.user_id] || 'A team member'
  let what = `${ENTITY[r.entity] || r.entity}${name && r.entity !== 'business_photos' ? ` “${name}”` : ''}`
  if (r.action === 'update') {
    if ('is_hidden' in d) return `${person} ${d.is_hidden.to ? 'hid' : 'made live'} ${what}`
    const fields = Object.keys(d).map((k) => (k in FIELD ? FIELD[k] : k.replace(/_/g, ' '))).filter(Boolean)
    return `${person} changed ${what}${fields.length ? ': ' + fields.slice(0, 5).join(', ') + (fields.length > 5 ? '…' : '') : ''}`
  }
  return `${person} ${VERB[r.action] || r.action} ${what}`
}
