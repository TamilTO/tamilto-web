// Starting marketplace content from the TamilTO 3.0 design. The live site reads the database
// (05-marketplace.sql loads the same content there); these are used only when the database has none yet.
// SAMPLE_* lists are fictional and appear only on a local preview without a database.

export const VERTICALS = [
 {
  "id": "weddings",
  "t": "Weddings",
  "ta": "கல்யாணம்",
  "tone": "#8A3B52",
  "d": "Every vendor for the big day, from the hall and the caterer to the nadaswaram.",
  "journey": "wedding",
  "seasonal": {
   "months": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12
   ],
   "on": "Wedding expo, spring 2027: vendor booths are open for enquiries.",
   "off": ""
  },
  "groups": [
   {
    "l": "Catering",
    "kw": "cater"
   },
   {
    "l": "Halls & venues",
    "kw": "hall,banquet,venue,mahal"
   },
   {
    "l": "Decor & stages",
    "kw": "decor,stage,flower,manavarai"
   },
   {
    "l": "Photo & video",
    "kw": "photo,video,film,studio"
   },
   {
    "l": "Sarees & fashion",
    "kw": "saree,silk,textile,fashion,boutique"
   },
   {
    "l": "Jewellery",
    "kw": "jewel,gold,thaali"
   },
   {
    "l": "Makeup & mehndi",
    "kw": "makeup,mehndi,bridal,beauty,salon,hair"
   },
   {
    "l": "DJ & music",
    "kw": "dj,music,band,sound,orchestra"
   },
   {
    "l": "Nadaswaram & thavil",
    "kw": "nadaswaram,nathaswaram,natheswara,nathaswara,nadhaswaram,nadaswara,thavil"
   }
  ]
 },
 {
  "id": "realestate",
  "t": "Real estate",
  "ta": "வீடு",
  "tone": "#1F4E5F",
  "d": "Tamil-speaking realtors and mortgage brokers who can explain it all to your parents too.",
  "journey": "home",
  "notice": "Agents supply their own listings. TamilTO does not republish MLS® listings.",
  "groups": [
   {
    "l": "Realtors",
    "kw": "realtor,realty,real estate"
   },
   {
    "l": "Mortgage brokers",
    "kw": "mortgage"
   },
   {
    "l": "Closing lawyers",
    "kw": "lawyer,law office,legal,notary"
   },
   {
    "l": "Inspection & reno",
    "kw": "inspect,renovat,contractor,reno"
   }
  ]
 },
 {
  "id": "pros",
  "t": "Professional services",
  "ta": "சேவைகள்",
  "tone": "#2F5D50",
  "d": "Accountants, lawyers, immigration consultants, insurance agents, driving schools and tutors.",
  "seasonal": {
   "months": [
    2,
    3,
    4
   ],
   "on": "Tax season is here. Book a Tamil-speaking accountant before April 30.",
   "off": "Tax season starts in February. Get on a Tamil-speaking accountant’s list early."
  },
  "groups": [
   {
    "l": "Accountants & tax",
    "kw": "account,tax,bookkeep,cpa"
   },
   {
    "l": "Lawyers",
    "kw": "lawyer,law office,legal,paralegal,notary"
   },
   {
    "l": "Immigration",
    "kw": "immigra,visa"
   },
   {
    "l": "Insurance",
    "kw": "insur"
   },
   {
    "l": "Driving schools",
    "kw": "driving"
   },
   {
    "l": "Tutors",
    "kw": "tutor,tuition"
   }
  ]
 },
 {
  "id": "classes",
  "t": "Classes & education",
  "ta": "கல்வி",
  "tone": "#4A3B6B",
  "d": "Bharatanatyam, Carnatic music, Tamil school and tuition centres for every age.",
  "seasonal": {
   "months": [
    8,
    9
   ],
   "on": "Back to Class: September enrolment is open at schools across the GTA.",
   "off": "Back to Class returns every September. Find a class now and beat the waitlists."
  },
  "groups": [
   {
    "l": "Dance",
    "kw": "dance,bharat,natya"
   },
   {
    "l": "Carnatic music",
    "kw": "music,veena,mridang,violin,carnatic,vocal"
   },
   {
    "l": "Tamil school",
    "kw": "tamil school,padasalai,language"
   },
   {
    "l": "Tuition centres",
    "kw": "tutor,tuition,learning,academy"
   }
  ]
 }
]
export const VENDOR_TYPES = [
 {
  "l": "Halls & venues",
  "kw": "hall,halls,banquet,banquets,venue,venues,mahal,convention centre,convention center,reception hall"
 },
 {
  "l": "Catering",
  "kw": "cater,caters,catering,caterer,caterers",
  "neg": "grocer,grocery,groceries,cash & carry,cash and carry,supermarket"
 },
 {
  "l": "Decor & stages",
  "kw": "decor,decors,decoration,decorations,decorator,decorators,stage,stages,florist,florists,flowers,manavarai,balloon,balloons",
  "neg": "cake,cakes,bakery,bakers,sweets"
 },
 {
  "l": "Photo & video",
  "kw": "photo,photos,photography,photographer,photographers,video,videos,videography,film,films,studio,studios"
 },
 {
  "l": "Sarees & fashion",
  "kw": "saree,sarees,sari,silk,silks,textile,textiles,fashion,fashions,boutique,veshti"
 },
 {
  "l": "Jewellery",
  "kw": "jewel,jewels,jewellery,jewelry,jeweller,jewellers,jeweler,jewelers,gold,thaali"
 },
 {
  "l": "Makeup & mehndi",
  "kw": "makeup,make-up,mehndi,henna,bridal,beauty,salon,salons,hair"
 },
 {
  "l": "DJ & music",
  "kw": "dj,djs,music,band,bands,sound,sounds,orchestra,singer,singers",
  "neg": "nadaswaram,nathaswaram,natheswara,nathaswara,thavil,school,academy,class,classes"
 },
 {
  "l": "Nadaswaram & thavil",
  "kw": "nadaswaram,nathaswaram,natheswara,nathaswara,nadhaswaram,nadaswara,thavil"
 },
 {
  "l": "Sweets & cakes",
  "kw": "bakery,bakeries,bakers,baker,sweet,sweets,cake,cakes,mysore pak,laddu"
 },
 {
  "l": "Priest & pooja",
  "kw": "priest,priests,kurukkal,pooja,poojai,iyer"
 },
 {
  "l": "Invitations & printing",
  "kw": "invitation,invitations,wedding cards,printing,printers"
 },
 {
  "l": "Rentals & tents",
  "kw": "rental,rentals,tent,tents,party supplies"
 },
 {
  "l": "Entertainment",
  "kw": "magic,magician,clown,clowns,face painting,entertainer,entertainers"
 }
]
export const EVENT_TYPES = [
 {
  "id": "wedding",
  "t": "Wedding",
  "ta": "கல்யாணம்",
  "alias": "wedding,kalyanam,marriage,reception,muhurtham",
  "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|Nadaswaram & thavil|DJ & music|Priest & pooja|Invitations & printing|Sweets & cakes"
 },
 {
  "id": "engagement",
  "t": "Engagement",
  "ta": "நிச்சயதார்த்தம்",
  "alias": "engagement,nichayathartham,ring ceremony",
  "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|Sweets & cakes"
 },
 {
  "id": "saamathiya",
  "t": "Coming-of-age ceremony",
  "ta": "சாமத்திய வீடு",
  "alias": "saamathiya,samathiya,puberty,half saree,ritu",
  "needs": "Halls & venues|Catering|Decor & stages|Photo & video|Sarees & fashion|Jewellery|Makeup & mehndi|DJ & music|Sweets & cakes"
 },
 {
  "id": "naming",
  "t": "Naming ceremony",
  "ta": "பெயர் சூட்டு",
  "alias": "naming,baby,namakaranam,cradle,30th day",
  "needs": "Catering|Priest & pooja|Decor & stages|Photo & video|Sweets & cakes|Jewellery"
 },
 {
  "id": "birthday",
  "t": "Birthday party",
  "ta": "பிறந்தநாள்",
  "alias": "birthday,bday,first birthday,1st birthday,party",
  "needs": "Halls & venues|Catering|Sweets & cakes|Decor & stages|Photo & video|Entertainment|Rentals & tents"
 },
 {
  "id": "housewarming",
  "t": "House-warming",
  "ta": "புதுமனை புகுவிழா",
  "alias": "house warming,housewarming,griha pravesam,new home",
  "needs": "Priest & pooja|Catering|Sweets & cakes|Decor & stages|Rentals & tents|Photo & video"
 },
 {
  "id": "anniversary",
  "t": "Anniversary",
  "ta": "திருமண நாள்",
  "alias": "anniversary,25th,50th,silver,golden",
  "needs": "Halls & venues|Catering|Decor & stages|DJ & music|Photo & video|Sweets & cakes"
 },
 {
  "id": "arangetram",
  "t": "Arangetram",
  "ta": "அரங்கேற்றம்",
  "alias": "arangetram,dance debut,recital,bharatanatyam",
  "needs": "Halls & venues|Makeup & mehndi|Photo & video|Sarees & fashion|Jewellery|Catering|Invitations & printing"
 },
 {
  "id": "corporate",
  "t": "Corporate or community event",
  "ta": "நிகழ்வு",
  "alias": "corporate,office,community,fundraiser,gala,festival,pongal,deepavali",
  "needs": "Halls & venues|Catering|DJ & music|Photo & video|Rentals & tents|Decor & stages"
 }
]
export const REQUEST_CATS = [
 "Weddings",
 "Events",
 "Food & catering",
 "Real estate",
 "Professional services",
 "Classes",
 "Home services",
 "Other"
]
export const PACKAGES = [
 {
  "id": "launch",
  "t": "Restaurant launch",
  "inc": "3 food creators|1 TamilTO article|Newsletter feature|Glowing map pin for a month"
 },
 {
  "id": "wedding",
  "t": "Wedding vendor spotlight",
  "inc": "2 wedding creators|Featured in the Weddings hub|A spot in a wedding Story"
 },
 {
  "id": "event",
  "t": "Event hype",
  "inc": "2 creators|Events page feature|Story countdown|Newsletter mention"
 },
 {
  "id": "opening",
  "t": "Grand opening",
  "inc": "1 creator visit|Openings article|Home page Story|Deals page feature"
 }
]
export const AD_OPTIONS = [
 {
  "id": "featured",
  "t": "Featured & Verified listing",
  "d": "Glowing map pin, top of search, the Verified Tamil-owned badge, photos, menu, WhatsApp button and monthly stats.",
  "best": "Every business"
 },
 {
  "id": "catspon",
  "t": "Category sponsorship",
  "d": "Be “Featured Caterer of the Month” or take the top spot in a category like Wedding Photographers.",
  "best": "Category leaders"
 },
 {
  "id": "leads",
  "t": "Customer requests",
  "d": "See customer requests that match your services and reply first.",
  "best": "Wedding, home and pro services"
 },
 {
  "id": "sponsored",
  "t": "Sponsored articles",
  "d": "A story like “10 best kothu spots”, always labelled Sponsored.",
  "best": "Restaurants and launches"
 },
 {
  "id": "newsletter",
  "t": "Newsletter sponsorship",
  "d": "Own the weekly “What’s on in Tamil Toronto” email.",
  "best": "Events and big launches"
 },
 {
  "id": "display",
  "t": "Display ads",
  "d": "Clearly marked ad spots on the site. No pop-ups, no autoplay.",
  "best": "Brand awareness"
 },
 {
  "id": "social",
  "t": "Social video features",
  "d": "Short Reels and TikToks on @tamilto.",
  "best": "Food, fashion and events"
 },
 {
  "id": "events",
  "t": "Event features & partnerships",
  "d": "Featured event posts, Story countdowns and expo booths.",
  "best": "Promoters and organisers"
 },
 {
  "id": "creators",
  "t": "Creator campaigns",
  "d": "Book Tamil Toronto creators through TamilTO, with proper ad disclosure.",
  "best": "Launches and openings"
 },
 {
  "id": "grow",
  "t": "Get online: setup services",
  "d": "Google Business Profile, a simple website and social accounts set up for you by our partner BICX.",
  "best": "Businesses new to online"
 }
]
export const CLASSIFIED_KINDS = [
 "Rentals",
 "Rooms",
 "For sale",
 "Services",
 "Wanted"
]
export const JOB_TYPES = ['Full-time', 'Part-time', 'Weekend', 'Seasonal']
export const PAGES = {
 "requests": {
  "kick": "Customer requests",
  "title": "Post one request. Get replies.",
  "ta": "கோரிக்கை",
  "lead": "Tell us what you need, like a caterer for 200 in Scarborough in March, and matching Tamil businesses reply to you directly. Free for customers."
 },
 "creators": {
  "kick": "Creator directory",
  "title": "Tamil Toronto creators",
  "ta": "படைப்பாளிகள்",
  "lead": "Food reviewers, comedians, wedding and music creators. Find the right voice for your launch and book through TamilTO."
 },
 "awards": {
  "kick": "TamilTO Best of",
  "title": "Best of Tamil Toronto",
  "ta": "சிறந்தவை",
  "lead": "The community nominates, the community votes. Winners get a plaque, a badge on their listing and bragging rights at every family function."
 },
 "jobs": {
  "kick": "Jobs board",
  "title": "Work at a Tamil business",
  "ta": "வேலை",
  "lead": "Kitchens, clinics, classrooms and offices across the GTA, hiring now. Apply straight on WhatsApp."
 },
 "classifieds": {
  "kick": "Classifieds",
  "title": "Rent it. Sell it. Find it.",
  "ta": "விளம்பரங்கள்",
  "lead": "Basement apartments, rooms, wedding sarees worn once and everything in between. Every post is checked before it goes live."
 },
 "deals": {
  "kick": "Deals & offers",
  "title": "Deals from Tamil businesses",
  "ta": "சலுகைகள்",
  "lead": "Mention TamilTO when you visit. Offers are set by each business and change often."
 },
 "partners": {
  "kick": "Trusted partners",
  "title": "Money transfer, travel and more",
  "ta": "கூட்டாளர்கள்",
  "lead": "Services the community uses every month, from partners we have checked are licensed or registered."
 },
 "advertise": {
  "kick": "Advertise with TamilTO",
  "title": "Reach Tamil Toronto",
  "ta": "விளம்பரம்",
  "lead": "Listings, sponsorships, creator campaigns and the Friday newsletter. Tell us your goal and we will put together a plan."
 },
 "more": {
  "kick": "Everything on TamilTO",
  "title": "More to explore",
  "ta": "மேலும்",
  "lead": "The whole marketplace in one place."
 }
}
export const NOTICES = {
 "creators": "Paid posts must be clearly labelled as ads (#ad or “Paid partnership”), as Canada’s Competition Bureau expects. Every creator booked through TamilTO agrees to this.",
 "partners": "TamilTO may earn a referral fee when you use a partner. It never costs you more and never changes our editorial coverage.",
 "requests": "We review every request before it goes live. Your name, phone and email stay private: businesses reply through TamilTO and we email you their details.",
 "sponsored": "Sponsored placements are always labelled. They never change our editorial rankings."
}
export const NEWSLETTER = {
 "t": "What’s on in Tamil Toronto",
 "d": "The best events, openings and deals in one short email every Friday. Free, no spam, unsubscribe any time.",
 "sponsor": ""
}
export const AWARDS = {
 "year": "2026",
 "stage": "Voting is open",
 "dates": "Nominations: Oct 1–31|Voting: Nov 1–30|Winners night: Dec 12",
 "cats": [
  {
   "id": "kothu",
   "t": "Best kothu roti",
   "kw": "kothu,restaurant,restaurants,take out,takeout",
   "neg": "grocery,catering only"
  },
  {
   "id": "shorteats",
   "t": "Best short eats",
   "kw": "bakery,bakeries,bakers,short eats,cake house,sweets"
  },
  {
   "id": "caterer",
   "t": "Best wedding caterer",
   "kw": "catering,caterer,caterers",
   "neg": "grocery,groceries,cash & carry,supermarket"
  },
  {
   "id": "saree",
   "t": "Best saree shop",
   "kw": "saree,sarees,silks,textiles,boutique"
  },
  {
   "id": "grocery",
   "t": "Best grocery",
   "kw": "grocery,groceries,supermarket,cash & carry,super market"
  },
  {
   "id": "classes",
   "t": "Best class or school",
   "kw": "tuition,tutoring,tutors,dance,academy,music school,tamil school,learning centre",
   "neg": "tailoring,driving"
  }
 ]
}

export const SAMPLE_REQUESTS = [
 {
  "id": "r1",
  "cat": "Weddings",
  "sub": "Catering",
  "area": "scarborough",
  "when": "March 2027",
  "size": "200 guests",
  "budget": "$30–40 a plate",
  "t": "Caterer for 200, Jaffna-style menu",
  "d": "Reception in Scarborough. A live dosa station would be amazing, plus banana-leaf service for the elders.",
  "days": 1,
  "resp": 4
 },
 {
  "id": "r2",
  "cat": "Weddings",
  "sub": "Photo & video",
  "area": "markham",
  "when": "June 2027",
  "size": "Two days",
  "budget": "Flexible",
  "t": "Photographer and videographer for a two-day wedding",
  "d": "Engagement shoot too. Candid style, not too many posed group photos please.",
  "days": 2,
  "resp": 6
 },
 {
  "id": "r3",
  "cat": "Professional services",
  "sub": "Accountants & tax",
  "area": "brampton",
  "when": "Before April",
  "size": "Family of four",
  "budget": "",
  "t": "Tamil-speaking accountant for family taxes",
  "d": "Two T4s, one small side business and the first-time home buyer credit. Appa prefers Tamil.",
  "days": 3,
  "resp": 3
 },
 {
  "id": "r4",
  "cat": "Classes",
  "sub": "Dance",
  "area": "mississauga",
  "when": "September",
  "size": "Age 7",
  "budget": "",
  "t": "Beginner Bharatanatyam for my daughter",
  "d": "Weekend classes preferred, near Square One.",
  "days": 5,
  "resp": 2
 },
 {
  "id": "r5",
  "cat": "Real estate",
  "sub": "Realtors",
  "area": "durham",
  "when": "Spring 2027",
  "size": "3-bedroom",
  "budget": "Under $900K",
  "t": "First-time buyers looking in Ajax or Pickering",
  "d": "We need a realtor who can explain everything to our parents too.",
  "days": 6,
  "resp": 5
 },
 {
  "id": "r6",
  "cat": "Events",
  "sub": "DJ & music",
  "area": "toronto",
  "when": "December 2026",
  "size": "150 guests",
  "budget": "",
  "t": "DJ for a 25th anniversary party",
  "d": "Mix of old Ilaiyaraaja songs and new Anirudh. Need sound and lights.",
  "days": 8,
  "resp": 1
 }
]
export const SAMPLE_CREATORS = [
 {
  "id": "kavya",
  "n": "Kavya Eats TO",
  "h": "@kavyaeats.to",
  "niche": "Food",
  "plats": "Instagram, TikTok",
  "aud": "48K followers",
  "area": "scarborough",
  "rate": "$250–600 per post",
  "bio": "Ranks kothu so you don’t have to. Short, funny food reels.",
  "tone": "#8C2A1C"
 },
 {
  "id": "mathu",
  "n": "Mathu Makes",
  "h": "@mathumakes",
  "niche": "Weddings & beauty",
  "plats": "Instagram, YouTube",
  "aud": "31K followers",
  "area": "markham",
  "rate": "$300–800 per campaign",
  "bio": "Bridal looks, saree draping and wedding-season vlogs.",
  "tone": "#8A3B52"
 },
 {
  "id": "uncle",
  "n": "Scarbro Uncle",
  "h": "@scarbro.uncle",
  "niche": "Comedy",
  "plats": "TikTok, Instagram",
  "aud": "112K followers",
  "area": "scarborough",
  "rate": "Ask for rates",
  "bio": "Skits every Tamil household will recognise. Great for launches.",
  "tone": "#1F4E5F"
 },
 {
  "id": "nila",
  "n": "Nila on the Move",
  "h": "@nilaonthemove",
  "niche": "Travel & lifestyle",
  "plats": "Instagram",
  "aud": "22K followers",
  "area": "toronto",
  "rate": "$200–450 per post",
  "bio": "Weekend guides, hidden gems and trips home to Jaffna.",
  "tone": "#2F5D50"
 },
 {
  "id": "beats",
  "n": "Thavil Beats",
  "h": "@thavilbeats",
  "niche": "Music",
  "plats": "YouTube, TikTok",
  "aud": "64K followers",
  "area": "brampton",
  "rate": "$400–1,000 per feature",
  "bio": "Mridangam and thavil covers of film songs. Event appearances too.",
  "tone": "#4A3B6B"
 },
 {
  "id": "amma",
  "n": "Fit Amma",
  "h": "@fit.amma",
  "niche": "Health & family",
  "plats": "Instagram, Facebook",
  "aud": "18K followers",
  "area": "mississauga",
  "rate": "$150–350 per post",
  "bio": "Healthy Tamil recipes and family workouts. Big with parents.",
  "tone": "#7A5A12"
 }
]
export const SAMPLE_JOBS = [
 {
  "id": "j1",
  "t": "Accounting assistant (tax season)",
  "biz": "Kanakku & Co. Tax",
  "type": "Seasonal",
  "area": "markham",
  "pay": "$20–24/hr",
  "d": "February to April. Tamil and English a must.",
  "days": 2,
  "phone": "9055550155"
 },
 {
  "id": "j2",
  "t": "Event servers, weekends",
  "biz": "Vanakkam Events Catering",
  "type": "Weekend",
  "area": "scarborough",
  "pay": "$18/hr + tips",
  "d": "Weddings and parties. No experience needed.",
  "days": 4,
  "phone": "4165550199"
 },
 {
  "id": "j3",
  "t": "Assistant dance teacher",
  "biz": "Natyalaya Dance School",
  "type": "Part-time",
  "area": "mississauga",
  "pay": "",
  "d": "Evenings and Saturdays. Arangetram completed.",
  "days": 6,
  "phone": "9055550134"
 }
]
export const SAMPLE_CLASSIFIEDS = [
 {
  "id": "c1",
  "kind": "Rentals",
  "t": "Bright 2-bed basement, separate entrance",
  "price": "$1,650 / month",
  "area": "scarborough",
  "d": "Near Markham & Sheppard. Utilities included. Working professionals or a small family.",
  "days": 1,
  "boost": true,
  "phone": "4165550111"
 },
 {
  "id": "c2",
  "kind": "Rooms",
  "t": "Room for rent, female student preferred",
  "price": "$750 / month",
  "area": "brampton",
  "d": "Shared kitchen, close to Sheridan College.",
  "days": 3,
  "phone": "9055550112"
 },
 {
  "id": "c3",
  "kind": "For sale",
  "t": "Kanchipuram silk saree, worn once",
  "price": "$280",
  "area": "markham",
  "d": "Maroon with a gold border. Blouse included.",
  "days": 4,
  "boost": true,
  "phone": "9055550113"
 },
 {
  "id": "c4",
  "kind": "For sale",
  "t": "Kids’ veena, 3/4 size",
  "price": "$450",
  "area": "mississauga",
  "d": "Great for beginners. Comes with a case.",
  "days": 6,
  "phone": "9055550114"
 },
 {
  "id": "c5",
  "kind": "Services",
  "t": "Tamil tutoring for kids, online or in person",
  "price": "$25 / hour",
  "area": "toronto",
  "d": "Reading, writing and speaking. JK to Grade 8.",
  "days": 2,
  "phone": "4165550115"
 },
 {
  "id": "c6",
  "kind": "Wanted",
  "t": "Looking for a used stroller and car seat",
  "price": "",
  "area": "durham",
  "d": "Newborn coming in January!",
  "days": 5,
  "phone": "9055550116"
 }
]
export const SAMPLE_PARTNERS = [
 {
  "id": "p1",
  "kind": "Money transfer",
  "n": "Kalam Remit",
  "d": "Send money to Sri Lanka and India, with a real person on the phone.",
  "lic": "Registered money services business (FINTRAC)",
  "href": "https://example.com/kalam"
 },
 {
  "id": "p2",
  "kind": "Travel",
  "n": "Vaanam Travels",
  "d": "Flights to Colombo, Chennai and Jaffna, plus group tours.",
  "lic": "TICO-registered travel agency",
  "href": "https://example.com/vaanam"
 },
 {
  "id": "p3",
  "kind": "Insurance",
  "n": "Kaval Insurance Brokers",
  "d": "Home, auto and life insurance, explained in Tamil.",
  "lic": "Licensed insurance brokerage (RIBO)",
  "href": "https://example.com/kaval"
 },
 {
  "id": "p4",
  "kind": "Mortgages",
  "n": "Veedu Mortgage Group",
  "d": "First-time buyer mortgages and renewals.",
  "lic": "Licensed mortgage brokerage (FSRA)",
  "href": "https://example.com/veedu"
 }
]
