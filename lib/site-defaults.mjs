// Words the TamilTO team can change in the admin (Site content). These are the starting values,
// used until something is saved in the admin, and on the local preview.

export const HERO = { a: 'Find anything Tamil in the', b: 'GTA.', sub: "Kothu at 1 AM, a saree by Sunday, a caterer for 400, a tutor who speaks Tamil. Ask the way you'd ask your cousin." }
export const PERKS = [
  { t: 'A glowing pin on the Live GTA map', d: 'Featured pins pulse, so people spot you while they explore.', c: '#F5B83D' },
  { t: 'One-tap WhatsApp & calls', d: 'Customers message you straight from your listing.', c: '#5FC98A' },
  { t: 'Quote requests', d: 'Wedding and event planners ask several businesses for quotes at once. You’re on the list.', c: '#FF6B7D' },
  { t: 'Stories, deals & jobs', d: 'Post an offer or a job and it shows up across the site.', c: '#9C86F0' },
]
export const HOW = [
  { n: '1', t: 'Claim', d: 'Find your business, or add it if you’re new.' },
  { n: '2', t: 'Verify', d: 'We call or WhatsApp the business number to confirm. Then we add the Verified Tamil-owned badge.' },
  { n: '3', t: 'Grow', d: 'Get WhatsApp messages, calls and quote requests from people who find you.' },
]
export const PLANS = [
 {
  "key": "free",
  "name": "Free",
  "monthly": 0,
  "yearly": 0,
  "description": "Get found. Every Tamil-owned business deserves a listing.",
  "features": [
   "Directory listing & map pin",
   "Hours, photos & one-tap WhatsApp",
   "Verified Tamil-owned badge",
   "Reviews & recommendations"
  ]
 },
 {
  "key": "featured",
  "name": "Featured",
  "monthly": 39,
  "yearly": 390,
  "description": "Stand out where people are already looking.",
  "features": [
   "Everything in Free",
   "Top of search & a glowing map pin",
   "Deals, jobs & Stories",
   "Quote requests & leads inbox",
   "Monthly stats"
  ]
 },
 {
  "key": "partner",
  "name": "Partner",
  "monthly": 119,
  "yearly": 1190,
  "description": "For businesses that want TamilTO in their corner.",
  "features": [
   "Everything in Featured",
   "One sponsored Story or social post a month",
   "Newsletter mention each quarter",
   "Window sticker & QR kit",
   "Priority placement in journeys"
  ]
 }
]
export const EXAMPLES = ["realtor in Markham", "plumber in Scarborough", "wedding caterer", "lawyer in Toronto", "driving school in Brampton", "money transfer"]
const PERK_COLOURS = ['#F5B83D', '#5FC98A', '#FF6B7D', '#9C86F0', '#5EC2D1', '#E2629B']

/** Saved settings (from the admin) laid over the defaults. Anything missing or empty keeps its default. */
export function withDefaults(s = {}) {
  const list = (v, d) => (Array.isArray(v) && v.length ? v : d)
  return {
    hero: s.hero && s.hero.a ? { ...HERO, ...s.hero } : HERO,
    searchExamples: list(s.searchExamples, EXAMPLES),
    plans: list(s.plans, PLANS),
    perks: list(s.perks, PERKS).map((p, i) => ({ ...p, c: p.c || PERK_COLOURS[i % PERK_COLOURS.length] })),
    how: list(s.how, HOW).map((p, i) => ({ ...p, n: String(i + 1) })),
    autoStories: s.autoStories !== false,
  }
}
