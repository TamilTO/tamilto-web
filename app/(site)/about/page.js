import Link from 'next/link'
import Img from '@/components/Img'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'About',
  description: 'TamilTO celebrates, connects and grows Tamil Toronto — one story at a time.',
  path: '/about',
})

const BELIEFS = [
  ['Community pride without politics.', 'We celebrate people, food, business and culture, and stay neutral on homeland politics and organizational disputes. Everyone should feel welcome here.'],
  ['Tamil-owned businesses are the backbone.', 'Every feature, listing and spotlight should help local Tamil entrepreneurs get discovered.'],
  ['A second-generation voice.', 'English-first, with Tamil mixed in the way we actually talk at home and with friends.'],
  ['Open doors.', 'Non-Tamil Torontonians who love the food and culture are welcome too. We never gatekeep; we explain with warmth.'],
  ['Social-first, web as home.', 'You probably found us on Instagram or TikTok. This is where the full stories live.'],
]

export default function About() {
  return (
    <div className="container reading stack-28" style={{ paddingTop: 40, maxWidth: 880 }}>
      <div className="stack-16">
        <span className="kicker tag-eat">About TamilTO</span>
        <h1 className="display" style={{ fontSize: 'clamp(44px,8vw,88px)', lineHeight: 0.9 }}>Celebrate, connect, and grow Tamil Toronto — one story at a time.</h1>
        <p className="lede">TamilTO is a lifestyle and culture outlet for the Tamil community of the Greater Toronto Area — and anyone who loves the food, the music and the energy. Where to eat, what’s on this weekend, which Tamil-owned business just opened, and the stories, humour and nostalgia that make us who we are.</p>
      </div>
      <div className="kolam" aria-hidden="true" />
      <section aria-labelledby="bel-h">
        <h2 id="bel-h" className="display h2" style={{ marginBottom: 12 }}>What we believe</h2>
        <ol className="numbered">
          {BELIEFS.map(([t, d], i) => <li key={t}><span className="n" aria-hidden="true">{i + 1}</span><span className="stack-4"><strong style={{ fontSize: 19 }}>{t}</strong><span className="muted" style={{ fontSize: 17 }}>{d}</span></span></li>)}
        </ol>
      </section>
      {/* TODO(founder): replace with the real founder story + portrait */}
      <section className="spotlight split" style={{ borderColor: 'var(--line)' }} aria-labelledby="fnd-h">
        <Img media={{ alt: 'Portrait of the founder', tone: '#6B3A2E' }} ratio="4/5" label="Founder portrait" />
        <div className="stack-10">
          <h2 id="fnd-h" className="display h2">Founder’s story</h2>
          <p className="muted" style={{ fontSize: 17 }}>[Founder story — who started TamilTO, where they grew up in the GTA, and why it needed to exist.]</p>
        </div>
      </section>
      <section className="stack-10" aria-labelledby="ct-h" style={{ fontSize: 17 }}>
        <h2 id="ct-h" className="display h2">Contact</h2>
        <span>Tips &amp; story ideas: <Link href="/submit">Submit a tip</Link> or <a href="mailto:hello@tamilto.com">hello@tamilto.com</a></span>
        <span>Partnerships: <a href="mailto:hello@tamilto.com">hello@tamilto.com</a></span>
        <span>Corrections: <a href="mailto:hello@tamilto.com">hello@tamilto.com</a> · <Link href="/editorial-policy">Editorial policy</Link></span>
      </section>
    </div>
  )
}
