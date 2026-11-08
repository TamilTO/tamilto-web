'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useConsent } from '@/lib/useConsent'

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
const SLOTS = {
  leaderboard: process.env.NEXT_PUBLIC_AD_SLOT_LEADERBOARD,
  rect: process.env.NEXT_PUBLIC_AD_SLOT_RECT,
  infeed: process.env.NEXT_PUBLIC_AD_SLOT_INFEED,
}

function loadAdsense() {
  if (document.getElementById('adsense')) return
  const s = document.createElement('script')
  s.id = 'adsense'
  s.async = true
  s.crossOrigin = 'anonymous'
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
  document.head.appendChild(s)
}

/** Reserved, fixed-size ad slot (no layout shift). Paid ads only after consent; otherwise a house ad. */
export default function AdSlot({ format = 'rect' }) {
  const consent = useConsent()
  const slot = SLOTS[format]
  const live = consent === 'accepted' && CLIENT && slot
  const [pushed, setPushed] = useState(false)
  useEffect(() => {
    if (!live || pushed) return
    loadAdsense()
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); setPushed(true) } catch {}
  }, [live, pushed])

  return (
    <aside className={`ad ad-${format}`} aria-label="Advertisement">
      <span className="ad-label">Advertisement</span>
      {live ? (
        <ins className="adsbygoogle" style={{ display: 'block', width: '100%' }} data-ad-client={CLIENT} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      ) : (
        <Link href="/advertise" className="ad-house">Your Tamil-owned business could be here →</Link>
      )}
    </aside>
  )
}
