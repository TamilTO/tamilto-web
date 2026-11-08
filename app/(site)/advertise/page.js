import SubmitForm from '@/components/SubmitForm'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Advertise with TamilTO',
  description: 'Sponsored stories, social, newsletter and featured directory listings — reach Tamil Toronto where it already is.',
  path: '/advertise',
})

const AUDIENCE = [
  ['Second-gen Tamil Canadians, 18–40', 'Mobile-first, social-native, and the ones making the plans — dinners, weddings, weekends.'],
  ['Tamil families', 'Parents looking for events, classes, services and culture for their kids.'],
  ['Food-loving Torontonians', 'Non-Tamil readers who follow us for the restaurants and stay for the culture.'],
  ['GTA-wide, east-end strong', 'Scarborough, Markham, Brampton, Mississauga, Ajax/Pickering and downtown.'],
]
const OPTIONS = [
  ['Sponsored articles', 'A story produced with our team in the TamilTO voice, clearly labelled and promoted on social.'],
  ['Social posts', 'Reels, TikToks and carousels on @tamilto — where most of our readers find us.'],
  ['Newsletter sponsorship', 'Presenting partner of the Friday newsletter, with a short native message.'],
  ['Featured directory listing', 'Top placement in search, a highlighted card and the homepage spotlight rotation.'],
  ['Event partnerships', 'Promotion, listings and on-site coverage for festivals, concerts and launches.'],
]

export default function Advertise() {
  return (
    <>
      <section className="hero-ink">
        <div className="container hero-ink-in">
          <span className="kicker">Advertise with TamilTO</span>
          <h1 className="display" style={{ fontSize: 'clamp(48px,8vw,96px)', lineHeight: 0.88, maxWidth: 900 }}>Get your business in front of Tamil Toronto</h1>
          <p className="lede">Our readers are the ones planning the wedding, picking the restaurant and sending the link to 40 cousins. Reach them where they already are.</p>
          <a href="#contact" className="btn btn-marigold self-start">Talk to us</a>
        </div>
      </section>
      <div className="container stack-28">
        <section className="section" aria-labelledby="aud-h">
          <h2 id="aud-h" className="display h2 section-rule" style={{ marginBottom: 18 }}>Who reads TamilTO</h2>
          <div className="grid-fit" style={{ gap: 20 }}>
            {AUDIENCE.map(([t, d]) => <div key={t} className="stack-4"><strong style={{ fontSize: 19 }}>{t}</strong><span className="muted">{d}</span></div>)}
          </div>
          <p className="fine" style={{ marginTop: 18 }}>Current reach and audience numbers are in our media kit — request it below.</p>
        </section>
        <section aria-labelledby="opt-h">
          <h2 id="opt-h" className="display h2 section-rule" style={{ marginBottom: 18 }}>Ways to partner</h2>
          <div className="grid-fit" style={{ gap: 16 }}>
            {OPTIONS.map(([t, d], i) => <div key={t} className="option"><span className="n">{String(i + 1).padStart(2, '0')}</span><strong style={{ fontSize: 19 }}>{t}</strong><span className="muted">{d}</span></div>)}
          </div>
        </section>
        <p className="notice"><strong>Our promise to readers (and you):</strong> every paid piece is clearly labelled “Sponsored”. No pop-ups, no autoplay audio, no fake reviews. That trust is why your ad works here.</p>
        <section id="contact" className="split" style={{ alignItems: 'start' }} aria-labelledby="contact-h">
          <div className="stack-10">
            <h2 id="contact-h" className="display h2">Let’s talk</h2>
            <p style={{ fontSize: 17 }}>Tell us about your business and we’ll send the media kit within two business days. Or email <a href="mailto:hello@tamilto.com">hello@tamilto.com</a>.</p>
          </div>
          <SubmitForm kind="ad" />
        </section>
      </div>
    </>
  )
}
