import { PortableText } from '@portabletext/react'
import Img from './Img'
import Embed from './Embed'

const mapsUrl = (it) =>
  it.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([it.name, it.address, it.neighbourhood, 'ON'].filter(Boolean).join(' '))}`
const media = (img, tone) => ({ image: img?.asset ? img : null, alt: img?.alt, tone: img?.tone || tone })

const components = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
  },
  list: {
    number: ({ children }) => <ol className="pt-ol">{children}</ol>,
    bullet: ({ children }) => <ul>{children}</ul>,
  },
  marks: {
    link: ({ value, children }) => {
      const ext = /^https?:/.test(value?.href || '')
      return <a href={value?.href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>
    },
  },
  types: {
    image: ({ value }) => (
      <figure className="pt-figure">
        <Img media={media(value)} ratio="3/2" sizes="(min-width: 760px) 680px, 100vw" />
        {value.caption ? <figcaption>{value.caption}</figcaption> : null}
      </figure>
    ),
    pullQuote: ({ value }) => (
      <blockquote className="pullquote">
        <p>“{value.text}”</p>
        {value.attribution ? <cite>{value.attribution}</cite> : null}
      </blockquote>
    ),
    gallery: ({ value }) => {
      const imgs = value.images || []
      return (
        <figure className="pt-gallery">
          <div className="gallery" tabIndex={0} aria-label="Photo gallery, scroll sideways">
            {imgs.map((im, i) => (
              <figure key={im._key || i}>
                <Img media={media(im)} ratio="4/3" sizes="320px" />
                <figcaption>{i + 1}/{imgs.length} · {im.caption || im.alt}</figcaption>
              </figure>
            ))}
          </div>
        </figure>
      )
    },
    embed: ({ value }) => <Embed platform={value.platform} url={value.url} caption={value.caption} />,
    bestOfList: ({ value }) => (
      <ol className="best-list">
        {(value.items || []).map((it, i) => (
          <li key={it._key || i} className="best-item">
            <div className="best-head"><span className="best-n" aria-hidden="true">{i + 1}</span><h3>{it.name}</h3></div>
            <Img media={{ ...media(it.image, it.tone), alt: it.image?.alt || `${it.name}` }} ratio="16/9" sizes="(min-width: 760px) 680px, 100vw" />
            <p className="meta">{[it.neighbourhood, it.address].filter(Boolean).join(' · ')}</p>
            {it.note ? <p>{it.note}</p> : null}
            <a href={mapsUrl(it)} target="_blank" rel="noopener noreferrer" className="strong-link">Open in Google Maps ↗</a>
          </li>
        ))}
      </ol>
    ),
  },
}

export default function PortableBody({ value }) {
  if (!value?.length) return null
  return <PortableText value={value} components={components} />
}

/** Split body into [beforeNewsletter, middle, last] without breaking lists. */
export function splitBody(body = []) {
  let n = 0
  let cut = -1
  body.forEach((b, i) => {
    if (cut < 0 && b._type === 'block' && !b.listItem && b.style === 'normal' && ++n === 2) cut = i + 1
  })
  if (cut < 0) cut = Math.min(1, body.length)
  const rest = body.slice(cut)
  let ad = Math.max(0, rest.length - 1)
  while (ad > 0 && rest[ad]?.listItem && rest[ad - 1]?.listItem) ad--
  return [body.slice(0, cut), rest.slice(0, ad), rest.slice(ad)]
}
