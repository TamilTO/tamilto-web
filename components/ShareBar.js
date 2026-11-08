'use client'
import { useState } from 'react'
import { track } from '@/lib/client'

const enc = encodeURIComponent

export default function ShareBar({ url, title, slug, compact = false }) {
  const [toast, setToast] = useState('')
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2600) }
  const t = (network) => () => track('Share', { network, slug })
  const copy = async (network, msg) => {
    try { await navigator.clipboard.writeText(url) } catch {}
    flash(msg)
    track('Share', { network, slug })
  }
  const story = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, url }); track('Share', { network: 'native', slug }); return } catch { return }
    }
    copy('instagram_story', 'Link copied — add it as a Link sticker in your Story')
  }
  const wa = `https://wa.me/?text=${enc(`${title} ${url}`)}`

  return (
    <div className="share" role="group" aria-label="Share this story">
      <a href={wa} target="_blank" rel="noopener noreferrer" className={`btn btn-wa${compact ? ' btn-sm' : ''}`} onClick={t('whatsapp')}>WhatsApp</a>
      {compact ? null : (
        <>
          <button type="button" className="btn btn-ghost" onClick={story}>Instagram Story</button>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" onClick={t('facebook')}>Facebook</a>
          <a href={`https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" onClick={t('x')}>X</a>
        </>
      )}
      <button type="button" className={`btn btn-ghost${compact ? ' btn-sm' : ''}`} onClick={() => copy('copy', 'Link copied — go send it to the cousins')}>Copy link</button>
      {toast ? <div role="status" className="toast">{toast}</div> : null}
    </div>
  )
}
