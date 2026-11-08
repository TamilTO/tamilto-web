import Image from 'next/image'

const urlOf = (media) => (typeof media === 'string' ? media : media?.url) || ''

/** Photo via next/image (AVIF/WebP, lazy), or a tinted placeholder with alt text when there's no photo yet. */
export default function Img({ media, ratio = '3/2', sizes = '(min-width: 1024px) 33vw, 100vw', priority = false, label, badge, className = '' }) {
  const style = { aspectRatio: ratio }
  const badgeEl = badge ? <span className="badge">{badge}</span> : null
  const src = urlOf(media)
  if (src) {
    return (
      <div className={`media ${className}`} style={style}>
        <Image src={src} alt={media?.alt || ''} fill sizes={sizes} priority={priority} style={{ objectFit: 'cover' }} />
        {badgeEl}
      </div>
    )
  }
  return (
    <div className={`media media-ph ${className}`} style={{ ...style, backgroundColor: media?.tone }} role="img" aria-label={media?.alt || ''}>
      {badgeEl}
      {label && media?.tone ? <span className="media-label">{label}</span> : null}
    </div>
  )
}
