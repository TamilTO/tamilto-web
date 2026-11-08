'use client'
import { useState } from 'react'
import { useConsent } from '@/lib/useConsent'

const NAMES = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube' }

function embedSrc(platform, url) {
  try {
    const u = new URL(url)
    if (platform === 'youtube') {
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (platform === 'instagram') {
      const m = u.pathname.match(/\/(p|reel|tv)\/([^/]+)/)
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null
    }
    if (platform === 'tiktok') {
      const m = u.pathname.match(/video\/(\d+)/)
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null
    }
  } catch {}
  return null
}

/** Third-party embeds load only after consent (or an explicit click). */
export default function Embed({ platform = 'instagram', url, caption }) {
  const consent = useConsent()
  const [load, setLoad] = useState(false)
  const src = embedSrc(platform, url)
  const name = NAMES[platform] || platform

  if (src && (consent === 'accepted' || load)) {
    return (
      <figure className={`embed embed-${platform}`}>
        <iframe src={src} title={`${name} post`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        {caption ? <figcaption className="embed-body">{caption}</figcaption> : null}
      </figure>
    )
  }
  return (
    <figure className="embed">
      <div className="embed-ph" aria-hidden="true" />
      <figcaption className="embed-body">
        <strong>{name} post</strong>
        {caption ? <span>{caption}</span> : null}
        <span className="row-wrap">
          {src ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLoad(true)}>Load post</button> : null}
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View on {name} ↗</a>
        </span>
        <span className="fine">Loading it lets {name} set cookies.</span>
      </figcaption>
    </figure>
  )
}
