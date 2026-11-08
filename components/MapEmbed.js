'use client'
import { useState } from 'react'
import { useConsent } from '@/lib/useConsent'
import { track } from '@/lib/client'

export default function MapEmbed({ name, address, slug }) {
  const consent = useConsent()
  const [load, setLoad] = useState(false)
  const q = encodeURIComponent(`${name} ${address}`)
  const link = `https://www.google.com/maps/search/?api=1&query=${q}`
  if (consent === 'accepted' || load) {
    return (
      <div className="map">
        <iframe title={`Map of ${name}`} src={`https://www.google.com/maps?q=${q}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <a href={link} target="_blank" rel="noopener noreferrer" className="strong-link" onClick={() => track('Directory Map', { business: slug })}>Open in Google Maps ↗</a>
      </div>
    )
  }
  return (
    <div className="map map-ph">
      <div className="row-wrap">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLoad(true)}>Show map</button>
        <a href={link} target="_blank" rel="noopener noreferrer" className="btn btn-ink btn-sm" onClick={() => track('Directory Map', { business: slug })}>Open in Google Maps ↗</a>
      </div>
      <span className="fine">The embedded map is from Google and may set cookies.</span>
    </div>
  )
}
