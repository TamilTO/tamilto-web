import Link from 'next/link'
import Img from './Img'
import { CATEGORIES, articleHref } from '@/lib/site'
import { fmtDate } from '@/lib/dates.mjs'

export function Tag({ a, withHood = false }) {
  return (
    <span className={`tag tag-${a.category}`}>
      {withHood ? a.neighbourhood : CATEGORIES[a.category]?.label}
      {a.sponsored ? <span className="tag-sponsored"> · Sponsored</span> : null}
    </span>
  )
}

export default function ArticleCard({ a, variant = 'default', dek = false, meta = 'category', priority = false, as: H = 'h3' }) {
  const href = articleHref(a)
  if (variant === 'row') {
    return (
      <Link href={href} className="card-row">
        <Img media={a.hero} ratio="1/1" className="card-row-media" sizes="96px" />
        <span className="card-row-body">
          <Tag a={a} />
          <span className="card-title card-title-sm">{a.title}</span>
        </span>
      </Link>
    )
  }
  const lead = variant === 'lead'
  return (
    <Link href={href} className={`card${lead ? ' card-lead' : ''}`}>
      <Img media={a.hero} ratio={lead ? '16/10' : '3/2'} label={a.hero?.label} priority={priority} sizes={lead ? '(min-width: 1024px) 60vw, 100vw' : undefined} />
      {meta === 'date' ? (
        <span className="meta">{[a.neighbourhood, fmtDate(a.publishDate)].filter(Boolean).join(' · ')}{a.sponsored ? ' · Sponsored' : ''}</span>
      ) : (
        <Tag a={a} withHood={meta === 'hood'} />
      )}
      <H className="card-title">{a.title}</H>
      {dek ? <p className="card-dek">{a.dek}</p> : null}
    </Link>
  )
}
