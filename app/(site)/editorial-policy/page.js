import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Editorial policy',
  description: 'TamilTO is an independent lifestyle and culture publication. Sponsored content is always labelled and we do not take sides on political or organizational disputes.',
  path: '/editorial-policy',
})

const SECTIONS = [
  ['independent', 'We are independent', 'TamilTO is an independent lifestyle and culture publication. We are not affiliated with any political party, movement, religious body or community organization.'],
  ['neutral', 'We do not take sides', 'We do not take positions on political or organizational disputes, in Canada or abroad. We cover people, food, business and culture — and we work to make every reader feel welcome.'],
  ['sponsored', 'Sponsored content is always labelled', 'Paid content carries a clear “Sponsored by [Partner]” label at the top of the page and on every card that links to it. Advertisers never review or approve our independent editorial coverage.'],
  ['reviews', 'Reviews and rankings', 'We pay for our own meals and visits, and businesses do not know in advance that we are reviewing them. Featured directory listings are paid and marked “Featured”; they never affect our editorial rankings.'],
  ['corrections', 'Corrections', 'If we get something wrong, we fix it and note the correction at the bottom of the story. Email hello@tamilto.com.'],
  ['submissions', 'Reader submissions', 'Tips, events and listings go to an editor review queue and are never published automatically. We may edit submissions for length and clarity.'],
  ['privacy', 'Privacy & cookies', 'We follow Canada’s PIPEDA. We collect only what we need (your email for the newsletter, your contact details when you submit something), never sell it, and you can ask us to delete it at hello@tamilto.com. Our analytics are cookie-free. Social embeds, maps and ad partners load only if you accept cookies — declining is as easy as accepting, and you can change your mind any time via “Cookie preferences” in the footer.'],
]

export default function Policy() {
  return (
    <div className="container reading stack-20 policy" style={{ paddingTop: 40 }}>
      <h1 className="display" style={{ fontSize: 'clamp(48px,8vw,84px)', lineHeight: 0.9 }}>Editorial policy</h1>
      <p className="lede muted">The short version: we’re independent, we label every paid thing, and we don’t take sides.</p>
      {SECTIONS.map(([id, t, d]) => <section key={id} id={id}><h2>{t}</h2><p>{d}</p></section>)}
      <p className="fine">Questions: <a href="mailto:hello@tamilto.com">hello@tamilto.com</a></p>
    </div>
  )
}
