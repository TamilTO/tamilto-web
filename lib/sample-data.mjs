// Bundled sample articles and events (fictional). Replaced by Supabase content in step 15.
// Every name, address, phone number and person here is fictional.
import { ymd, addDays, weekendRange, torontoISO } from './dates.mjs'

const T = ['#8C2A1C', '#9A5416', '#2F5D50', '#6B3A2E', '#1F4E5F', '#7A5A12', '#4A3B6B', '#8A3B52']
let k = 0
const key = () => `s${(k++).toString(36)}`
const span = (text) => ({ _type: 'span', _key: key(), text, marks: [] })
const p = (text) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [span(text)] })
const h = (text) => ({ ...p(text), style: 'h2' })
const q = (text, attribution) => ({ _type: 'pullQuote', _key: key(), text, attribution })
const ol = (items) => items.map((t) => ({ ...p(t), listItem: 'number', level: 1 }))
const best = (items) => ({ _type: 'bestOfList', _key: key(), items: items.map((i, n) => ({ _key: key(), tone: T[(n * 2) % 8], ...i })) })
const gallery = (caps) => ({ _type: 'gallery', _key: key(), images: caps.map((c, i) => ({ _key: key(), _type: 'image', alt: c, caption: c, tone: T[(i * 3 + 1) % 8] })) })
const embed = (platform, url, caption) => ({ _type: 'embed', _key: key(), platform, url, caption })

const today = ymd()
const daysAgo = (n) => torontoISO(addDays(today, -n), '09:00')

export const AUTHORS = [
  { slug: 'kavya-ratnam', name: 'Kavya Ratnam' },
  { slug: 'mathu-sivakumar', name: 'Mathu Sivakumar' },
  { slug: 'janani-kanthan', name: 'Janani Kanthan' },
  { slug: 'nirosh-thevan', name: 'Nirosh Thevan' },
  { slug: 'partner-studio', name: 'TamilTO Partner Studio' },
]
const by = (slug) => ({ authorSlug: slug, author: AUTHORS.find((a) => a.slug === slug).name })

const A = (o) => ({ tags: [], featured: false, trending: false, sponsored: false, ...o })

export const ARTICLES = [
  A({
    slug: 'best-kothu-roti-markham-road', category: 'eat', featured: true, ...by('kavya-ratnam'), publishDate: daysAgo(0), readTime: 7, neighbourhood: 'Scarborough', tags: ['kothu', 'best-of'],
    title: "We ranked every kothu roti on Markham Road so you don't have to",
    dek: "Three weeks, a lot of clanging, and one very full editor. Here's where to get the best kothu on the strip.",
    hero: { tone: T[0], label: 'Chicken kothu on the flat-top', alt: 'Chicken kothu roti being chopped on a flat-top griddle', caption: 'Chicken kothu, mid-chop.', credit: 'Nirosh Thevan / TamilTO' },
    body: [
      p('Every Tamil kid in Scarborough has a kothu opinion, and every single one of them thinks theirs is correct. So we did the responsible thing: we ate kothu roti at every spot on the Markham Road strip over three weeks, ordered chicken kothu every time to keep it fair, and judged on texture, spice, that clang-clang soundtrack, and whether one order could feed a small family.'),
      p("Ground rules: takeout and dine-in both counted, nobody knew we were coming, and our editor's mom was the tie-breaker. Here's how it shook out."),
      best([
        { name: "Thambi's Grill House", neighbourhood: 'Scarborough', address: '1180 Markham Rd', note: "The benchmark. Soft-but-crisp roti, a salna you'll want to drink, and the egg folded through properly. Get extra gravy on the side." },
        { name: 'Kalai Kothu Corner', neighbourhood: 'Scarborough', address: '1422 Markham Rd', note: "Spiciest on the strip. Ask for 'medium' unless you want to see God." },
        { name: 'Night Shift Kothu', neighbourhood: 'Scarborough', address: '1630 Markham Rd', note: 'Open till 3am, which is honestly the whole review. Also a genuinely excellent cheese kothu.' },
        { name: "Paati's Pantry", neighbourhood: 'Scarborough', address: '2055 Markham Rd', note: "Homestyle, lighter on the oil, tastes like someone's grandmother is watching you eat. Because she is." },
        { name: 'Kumaran Street Eats', neighbourhood: 'Scarborough', address: '2290 Markham Rd', note: 'The portion size is unserious. One order feeds three cousins and half a cricket team.' },
      ]),
      q("If you can't hear the kothu being made from the parking lot, keep driving.", "— Our editor's mom, official tie-breaker"),
      gallery(['Flat-top griddle mid-chop', 'Chicken kothu with salna on the side', 'The late-night takeout line', 'Cheese kothu, no regrets']),
      p("Disagree? Obviously you do. Send us your spot through Submit a Tip and we'll run a readers' pick next month."),
    ],
  }),
  A({
    slug: '11-things-scarborough-tamil-kids', category: 'culture', trending: true, ...by('mathu-sivakumar'), publishDate: daysAgo(1), readTime: 4, neighbourhood: 'Scarborough', tags: ['nostalgia'],
    title: '11 things only Tamil kids who grew up in Scarborough will understand',
    dek: 'Saturday Tamil school, STC as a personality, and the uncle debate that ends at 1am.',
    hero: { tone: T[4], label: 'Friends outside a Scarborough plaza', alt: 'Group of friends laughing outside a Scarborough strip plaza', credit: 'TamilTO archive' },
    body: [
      p("If you grew up Tamil in Scarborough, you already know. For everyone else: welcome, pull up a plastic chair, there's mutton roll in the kitchen."),
      ...ol([
        'Your mall was Scarborough Town Centre, and you said “STC” like it was a person.',
        'Tamil school on Saturday mornings. No negotiations.',
        'Knowing exactly which plaza had the best mutton rolls.',
        'The old Scarborough RT was basically your rollercoaster.',
        'Every party had a sound system worth more than the car outside.',
        'Uncles debating cricket in the driveway until 1am.',
        '“Eat first, then go” was the law for leaving any house.',
        'Your friends called your amma “Aunty” before they knew your last name.',
        'An arangetram was a full-day event with catering and a programme booklet.',
        "Bringing rice and curry for lunch and getting looks. Now it's a trend.",
        'Saying you’re from “Toronto” when you travel, then immediately clarifying: “Scarborough.”',
      ]),
      p("Did we miss one? We definitely missed one. Tell us and we'll make a part two."),
    ],
  }),
  A({
    slug: 'tamil-bakery-markham-short-eats', category: 'business', trending: true, ...by('janani-kanthan'), publishDate: daysAgo(2), readTime: 5, neighbourhood: 'Markham', tags: ['openings', 'bakery'],
    title: 'This new Tamil bakery in Markham is selling out of short eats by noon',
    dek: 'Kuyil Bakery opened six weeks ago. The fish buns are already a problem.',
    hero: { tone: T[1], label: 'Trays of fish buns and rolls', alt: 'Trays of golden fish buns and vegetable rolls behind a bakery counter', credit: 'Janani Kanthan / TamilTO' },
    body: [
      p("Get to Kuyil Bakery after 11:30 on a Saturday and you'll meet the most heartbreaking sign in Markham: “Fish buns sold out. Sorry machan.” The owners, a brother-and-sister team who grew up working weekends at their parents' Scarborough takeout, opened six weeks ago."),
      p('The menu is short and confident — fish buns, vadai, patties, Chinese rolls, and a rotating cake of the week — and everything is made on site starting at 5am.'),
      embed('instagram', 'https://www.instagram.com/p/EXAMPLE/', 'Saturday morning, 9:58am. Line out the door. Fish buns: going fast.'),
      q('We wanted it to taste like the bakery our parents talk about from back home, but open on a Sunday.', '— Co-owner, Kuyil Bakery'),
      p("Pro tip: they take pre-orders for parties of 50+ pieces with 48 hours' notice. Aunties, you're welcome."),
      gallery(['Fish buns fresh from the oven', 'The pastry case at 8am', 'Cake of the week: love cake']),
    ],
  }),
  A({
    slug: 'weekend-tamil-toronto-pongal', category: 'events', ...by('nirosh-thevan'), publishDate: daysAgo(0), readTime: 3, neighbourhood: 'GTA-wide', tags: ['weekend'],
    title: 'Your weekend in Tamil Toronto: Pongal markets, a sold-out concert and more',
    dek: "The weekend is stacked. Here's how to do it all without missing the sakkarai pongal.",
    hero: { tone: T[5], label: 'Pongal pots at a market stall', alt: 'Decorated clay pongal pots lined up at an outdoor market stall', credit: 'TamilTO' },
    body: [
      p("This weekend is doing a lot. Pace yourself, hydrate, and bring a big bag."),
      h('Friday: Heritage night'),
      p('Free, family-friendly, and the closest thing we have to a community reunion. Arrive early for the kolam contest.'),
      h('Saturday: Thai Pongal Market'),
      p("Sixty-plus vendors, live parai, kids' kolam stations and more sugarcane than you can carry. Bring cash."),
      h('Saturday night: Isai Nights (sold out)'),
      p("Didn't get tickets? Same. The organizers say a second date is coming — we'll post it the minute it drops."),
    ],
  }),
  A({
    slug: 'brampton-teen-mridangam-covers', category: 'people', trending: true, ...by('kavya-ratnam'), publishDate: daysAgo(3), readTime: 5, neighbourhood: 'Brampton',
    title: 'Meet the Brampton teen whose mridangam covers are taking over your FYP',
    dek: 'Seventeen, self-taught on YouTube, and turning pop hits into Carnatic rhythm.',
    hero: { tone: T[6], label: 'Teen musician with mridangam', alt: 'A teenage musician playing mridangam in a home studio', credit: 'Courtesy of the artist' },
    body: [
      p('It started with a dare from a cousin: play the mridangam over a Drake song. One video later, the comments were split between Carnatic purists and people asking for a tutorial. Both groups stayed.'),
      q("My teacher told me rhythm is a language. I'm just translating.", '— The artist, on why the covers work'),
      p("Now he's balancing Grade 12, arangetram prep and brand DMs. His parents have one rule: homework before uploads."),
    ],
  }),
  A({
    slug: 'saree-shopping-scarborough-guide', category: 'guides', ...by('mathu-sivakumar'), publishDate: daysAgo(4), readTime: 6, neighbourhood: 'Scarborough',
    title: 'The ultimate guide to saree shopping in Scarborough (without your mom)',
    dek: 'How to budget, what to ask, and the shops worth your Saturday.',
    hero: { tone: T[7], label: 'Silk sarees on shelves', alt: 'Shelves of folded silk sarees in jewel tones', credit: 'TamilTO' },
    body: [
      p("Shopping for a saree on your own for the first time is a rite of passage. It's also a lot. Here's the cheat sheet."),
      p('Go on a weekday morning if you can, bring a blouse that fits you well, and know your budget before anyone pulls out the Kanchipuram silks. Ask about blouse stitching times — wedding season means weeks, not days.'),
      q('Never buy the first one. Never buy the last one. Buy the one you keep coming back to.', '— A Scarborough shop owner, 30 years in'),
    ],
  }),
  A({
    slug: 'best-idiyappam-breakfast-gta', category: 'eat', ...by('janani-kanthan'), publishDate: daysAgo(5), readTime: 6, neighbourhood: 'Markham',
    title: 'The best places for a proper idiyappam breakfast in the GTA',
    dek: 'String hoppers, sothi and pol sambol, the way Sunday mornings should be.',
    hero: { tone: T[2], label: 'Idiyappam with sothi', alt: 'Plate of string hoppers with yellow coconut sothi and pol sambol', credit: 'Janani Kanthan / TamilTO' },
    body: [
      p('There are two kinds of people: those who think idiyappam is a side dish, and those who are correct. We went looking for the GTA’s best string hopper plates — fresh, light, with a sothi that tastes like home.'),
      p('Our method was very scientific: we ranked each plate by how quiet the table went.'),
    ],
  }),
  A({
    slug: 'tamil-wedding-uncle-love-letter', category: 'culture', trending: true, ...by('nirosh-thevan'), publishDate: daysAgo(6), readTime: 4, neighbourhood: 'Mississauga',
    title: 'A love letter to the Tamil wedding uncle who runs the whole reception',
    dek: 'He has a clipboard. He has a microphone. He has never been introduced. He is essential.',
    hero: { tone: T[3], label: 'Wedding hall from the back', alt: 'View of a decorated wedding reception hall from the back of the room', credit: 'Golden Hour Kalyanam Photo' },
    body: [
      p("Every Tamil wedding has him. Nobody knows exactly how he's related. He knows where the DJ parked, which table hasn't been served, and how long the speeches are actually going to run."),
      q('Five more minutes. Everybody sit. SIT.', '— Every wedding uncle, at least once per reception'),
      p('To the uncles keeping 600-person receptions on schedule: we see you. Please take a plate.'),
    ],
  }),
  A({
    slug: 'bay-street-to-podi-founder', category: 'business', trending: true, ...by('kavya-ratnam'), publishDate: daysAgo(7), readTime: 6, neighbourhood: 'Markham',
    title: "She left Bay Street to sell podi. Now it's in 40 stores",
    dek: "How a Markham founder turned her paati's spice blend into a grocery shelf staple.",
    hero: { tone: T[5], label: 'Jars of podi on a shelf', alt: 'Rows of labelled podi jars on a grocery shelf', credit: 'Courtesy of the founder' },
    body: [
      p("For six years she worked in finance downtown, and for six years her coworkers asked what was in her lunch. The answer was always her grandmother's idli podi. Eventually she started bringing extra jars."),
      q("The spreadsheet said it wouldn't work. My paati said it would. I listened to my paati.", '— The founder'),
      p('Today the line has four blends, a co-packer in Scarborough, and placement across GTA grocers — including several Tamil-owned shops that took a chance early.'),
    ],
  }),
  A({
    slug: 'ajax-nurse-tamil-book-club', category: 'people', ...by('mathu-sivakumar'), publishDate: daysAgo(8), readTime: 4, neighbourhood: 'Ajax/Pickering',
    title: "This Ajax nurse runs the city's most wholesome Tamil book club",
    dek: 'Night shifts, tea, and a reading list that switches between Tamil and English.',
    hero: { tone: T[4], label: 'Books and tea on a table', alt: 'Stack of Tamil and English novels next to cups of tea', credit: 'TamilTO' },
    body: [
      p('It started in a hospital break room. Now it meets monthly in a library community room, with members from 19 to 74 and a strict no-spoilers-before-samosas rule.'),
      p("This month's pick is a Tamil classic with an English translation on the side, so nobody gets left out. New members welcome — bring a snack."),
    ],
  }),
  A({
    slug: 'book-wedding-hall-gta-timeline', category: 'guides', ...by('janani-kanthan'), publishDate: daysAgo(9), readTime: 7, neighbourhood: 'GTA-wide',
    title: 'How to book a wedding hall in the GTA: a no-stress timeline',
    dek: 'From 18 months out to the week of. Print it, send it to your mom, save your sanity.',
    hero: { tone: T[6], label: 'Empty banquet hall', alt: 'An empty banquet hall set with round tables and gold chairs', credit: 'TamilTO' },
    body: [
      p("Tamil wedding season is real, and the good halls go fast. Here's the timeline we wish someone had handed us."),
      ...ol([
        '18 months: set a guest range and budget, together. Yes, both families.',
        '15 months: tour three halls max. Ask about outside catering and decor rules.',
        '12 months: sign, pay the deposit, get every inclusion in writing.',
        '6 months: confirm vendors, parking and setup times.',
        '1 month: final headcount and floor plan.',
        '1 week: confirm everything again. Then breathe.',
      ]),
      p('Looking for halls, caterers and photographers? Start with our Tamil-Owned Directory.'),
    ],
  }),
  A({
    slug: 'pongal-at-home-three-recipes', category: 'eat', sponsored: true, sponsorName: 'Vanakkam Catering Co.', ...by('partner-studio'), publishDate: daysAgo(1), readTime: 5, neighbourhood: 'Markham', tags: ['recipes'],
    title: 'Pongal at home: 3 easy recipes from a Markham caterer',
    dek: "Sakkarai pongal, ven pongal and a cheeky roasted-veg twist, from the kitchen that feeds half of Markham's weddings.",
    hero: { tone: T[1], label: 'Sakkarai pongal in a brass pot', alt: 'Sweet sakkarai pongal topped with cashews in a brass pot', credit: 'Vanakkam Catering Co.' },
    body: [
      p("Thai Pongal is about the harvest, gratitude and — let's be honest — the pongal. We asked the head chef at Vanakkam Catering for three recipes you can actually pull off in an apartment kitchen."),
      h('1. Sakkarai pongal'),
      p('Rice and moong dal, cooked soft, then folded with jaggery, ghee, cardamom and fried cashews. The secret: toast the dal first.'),
      h('2. Ven pongal'),
      p('The savoury cousin. Black pepper, cumin, ginger and curry leaves in ghee. Serve with coconut chutney.'),
      h('3. Pongal-spiced roasted veg'),
      p('Not traditional, very delicious. Toss squash and carrots in ghee, cumin and pepper, roast hot, finish with cashews.'),
    ],
  }),
]

// Events are dated relative to today so the "this weekend" module always has content in dev.
const [fri] = weekendRange(today)
const at = (offset, hm) => torontoISO(addDays(fri, offset), hm)

export const EVENTS = [
  { slug: 'tamil-heritage-night', title: 'Tamil Heritage Night', type: 'Culture', start: at(0, '19:00'), end: at(0, '22:00'), venue: 'Markham Civic Pavilion', address: '101 Town Centre Blvd', neighbourhood: 'Markham', price: 0, ticketUrl: 'https://tickets.example.com/heritage-night', image: { tone: T[4], alt: 'Bharatanatyam dancers performing on a lit stage' }, description: 'Dance, music, a kolam contest and every community group under one roof. Free with RSVP.' },
  { slug: 'thai-pongal-market', title: 'Thai Pongal Market', type: 'Festival', start: at(1, '11:00'), end: at(1, '18:00'), venue: 'Kennedy Commons Hall', address: '20 Kennedy Commons Dr', neighbourhood: 'Scarborough', price: 0, ticketUrl: 'https://tickets.example.com/pongal-market', image: { tone: T[5], alt: 'Bundles of sugarcane and pongal pots at a market' }, description: "60+ vendors, live parai, kids' kolam stations and sugarcane by the bundle." },
  { slug: 'isai-nights-live', title: 'Isai Nights: Live in Toronto', type: 'Concert', start: at(1, '20:00'), end: at(1, '23:00'), venue: 'Harbourline Hall', address: '55 Queens Quay W', neighbourhood: 'Toronto', price: 45, soldOut: true, ticketUrl: 'https://tickets.example.com/isai-nights', image: { tone: T[6], alt: 'Concert crowd holding up phone lights' }, description: 'A night of film-song favourites with a full live band. Second date rumoured.' },
  { slug: 'kaadhal-express-opening', title: 'Opening night: “Kaadhal Express”', type: 'Film', start: torontoISO(today, '21:30'), end: torontoISO(today, '23:59'), venue: 'Sheppard Cineplex', address: '3300 Sheppard Ave E', neighbourhood: 'Scarborough', price: 16, ticketUrl: 'https://tickets.example.com/kaadhal-express', image: { tone: T[7], alt: 'Cinema marquee at night' }, description: 'The rom-com everyone will be quoting by Monday. Bring tissues, apparently.' },
  { slug: 'short-eats-fest', title: 'Short Eats Fest', type: 'Food', start: at(9, '12:00'), end: at(9, '19:00'), venue: 'Woodbine Exhibition Centre', address: '8500 Woodbine Ave', neighbourhood: 'Markham', price: 10, ticketUrl: 'https://tickets.example.com/short-eats', image: { tone: T[1], alt: 'Platter of rolls, patties and vadai' }, description: "Twenty Tamil-owned vendors, one mission: crown the GTA's best roll." },
  { slug: 'gta-tamil-indoor-cricket-cup', title: 'GTA Tamil Indoor Cricket Cup', type: 'Sports', start: at(15, '09:00'), end: at(15, '18:00'), venue: 'Chinguacousy Sports Dome', address: '9050 Bramalea Rd', neighbourhood: 'Brampton', price: 5, ticketUrl: 'https://tickets.example.com/cricket-cup', image: { tone: T[2], alt: 'Players during an indoor cricket match' }, description: '32 teams, one trophy and a lot of uncles with opinions. Spectators $5, kids free.' },
]

