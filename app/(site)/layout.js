import Script from 'next/script'
import { Frame } from '@/components/tto/App'
import ConsentBanner from '@/components/ConsentBanner'
import JsonLd from '@/components/JsonLd'
import { orgLd } from '@/lib/seo'
import { getSite } from '@/lib/data'

const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export default async function SiteLayout({ children }) {
  const site = await getSite()
  const cat = Object.fromEntries(site.categories.map((c) => [c.key, c.label]))
  // A small index of every business, used by the shortlist drawer and quote requests.
  const index = site.businesses.map((b) => ({ id: b.id, name: b.name, catLabel: cat[b.category] || '', tone: b.tone, phone: b.phone, cell: b.cell, acceptsQuotes: !!b.acceptsQuotes, hours: b.hours || null, byAppointment: !!b.byAppointment }))
  return (
    <>
      <Frame index={index}>{children}</Frame>
      <ConsentBanner />
      <JsonLd data={orgLd()} />
      {PLAUSIBLE ? (
        <>
          <Script id="plausible-queue" strategy="afterInteractive">{`window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}`}</Script>
          <Script src="https://plausible.io/js/script.outbound-links.js" data-domain={PLAUSIBLE} strategy="afterInteractive" />
        </>
      ) : null}
    </>
  )
}
