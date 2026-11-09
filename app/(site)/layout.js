import Script from 'next/script'
import { Frame } from '@/components/tto/App'
import ConsentBanner from '@/components/ConsentBanner'
import JsonLd from '@/components/JsonLd'
import { orgLd } from '@/lib/seo'

const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN

export default function SiteLayout({ children }) {
  return (
    <>
      <Frame>{children}</Frame>
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
