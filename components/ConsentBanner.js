'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getConsent, setConsent } from '@/lib/client'

export default function ConsentBanner() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (getConsent() === 'unset') setOpen(true)
    const h = () => setOpen(true)
    window.addEventListener('tto-consent-open', h)
    return () => window.removeEventListener('tto-consent-open', h)
  }, [])
  if (!open) return null
  const choose = (v) => { setConsent(v); setOpen(false) }
  return (
    <div className="consent" role="dialog" aria-labelledby="consent-h" aria-describedby="consent-d">
      <strong id="consent-h">Cookies, but make it optional</strong>
      <p id="consent-d">
        We use cookie-free analytics to see what people read. With your OK we’ll also load social embeds, maps and ad partners, which may set cookies.
        Decline and the site works the same. <Link href="/editorial-policy#privacy">Privacy details</Link>
      </p>
      <div className="consent-actions">
        <button type="button" className="btn btn-ink" onClick={() => choose('declined')}>Decline</button>
        <button type="button" className="btn btn-ink" onClick={() => choose('accepted')}>Accept</button>
      </div>
    </div>
  )
}

export function CookiePrefsButton() {
  return (
    <button type="button" className="linkish" onClick={() => window.dispatchEvent(new CustomEvent('tto-consent-open'))}>
      Cookie preferences
    </button>
  )
}
