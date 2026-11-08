import { ImageResponse } from 'next/og'
import { getArticle } from '@/lib/data'
import { CATEGORIES } from '@/lib/site'
import { ogLogos, LOGO_RATIO } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'TamilTO story'

/** Branded share card — what shows up in WhatsApp, Instagram DMs, X and Facebook previews. */
export default async function OG({ params }) {
  const { slug } = await params
  const [a, logos] = await Promise.all([getArticle(slug), ogLogos()])
  const title = a?.title || 'TamilTO'
  const label = `${CATEGORIES[a?.category]?.label || ''}${a?.sponsored ? ' · Sponsored' : ''}`
  const h = 76
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 64px', background: '#FAF5EC', color: '#1A1410', borderTop: '24px solid #B3122E' }}>
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: '#B3122E' }}>{label}</div>
        <div style={{ display: 'flex', fontSize: title.length > 80 ? 60 : 76, fontWeight: 900, lineHeight: 1.02, letterSpacing: -1 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%' }}>
          <img src={logos.dark} width={Math.round(h * LOGO_RATIO)} height={h} alt="" />
          <div style={{ display: 'flex', fontSize: 26, color: '#5B4F44' }}>The pulse of Tamil Toronto</div>
        </div>
      </div>
    ),
    size
  )
}
