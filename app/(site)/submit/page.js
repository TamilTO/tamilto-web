import Link from 'next/link'
import SubmitForm from '@/components/SubmitForm'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta({
  title: 'Submit a tip or an event',
  description: 'New opening, a closing, an event we should know about? Send it to the TamilTO editors.',
  path: '/submit',
})

export default async function SubmitPage({ searchParams }) {
  const sp = await searchParams
  const kind = sp.type === 'event' ? 'event' : 'tip'
  return (
    <div className="container reading stack-20" style={{ paddingTop: 36 }}>
      <h1 className="display" style={{ fontSize: 'clamp(48px,9vw,88px)', lineHeight: 0.88 }}>Spill the tea</h1>
      <p className="lede">New opening, a closing, a wedding hall horror story, an event we should know about? Send it over. A real editor reads every submission — nothing is published automatically.</p>
      <nav className="tabs" aria-label="Submission type">
        <Link href="/submit" aria-current={kind === 'tip' ? 'page' : undefined} scroll={false}>Submit a tip</Link>
        <Link href="/submit?type=event" aria-current={kind === 'event' ? 'page' : undefined} scroll={false}>Submit an event</Link>
      </nav>
      <SubmitForm key={kind} kind={kind} />
      <p className="fine">Own a Tamil business? <Link href="/directory#list">List it in the directory</Link> instead.</p>
    </div>
  )
}
