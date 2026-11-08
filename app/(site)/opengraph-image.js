import { ImageResponse } from 'next/og'
import { ogLogos, LOGO_RATIO } from '@/lib/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'TamilTO — The pulse of Tamil Toronto'

export default async function OG() {
  const { white } = await ogLogos()
  const h = 210
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 72, background: '#B3122E', color: '#fff' }}>
        <img src={white} width={Math.round(h * LOGO_RATIO)} height={h} alt="" />
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, marginTop: 28 }}>The pulse of Tamil Toronto</div>
        <div style={{ display: 'flex', fontSize: 30, marginTop: 16, opacity: 0.9 }}>Where to eat · What’s on · Tamil-owned businesses</div>
      </div>
    ),
    size
  )
}
