import { getTicker } from '@/lib/server/ticker-cache'
import { pageMeta } from '@/lib/seo'

export const revalidate = 300
export const metadata = pageMeta({ title: 'GTA updates today', description: 'Live gold price in Canada (24K and 22K per gram), Toronto gas and diesel prices, GTA news and Toronto police and fire calls, updated through the day.', path: '/updates' })

const wrap = { maxWidth: 1320, margin: '0 auto', padding: '40px clamp(16px,4vw,32px) 80px' }
const kick = { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mari, #F5B83D)' }
const h1 = { margin: '10px 0 0', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'clamp(48px,7vw,96px)', lineHeight: '.9' }
const h2 = { margin: '0 0 14px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 'clamp(28px,3.4vw,40px)', lineHeight: 1 }
const card = { padding: '20px 22px', borderRadius: 22, background: 'var(--glass)', border: '1px solid var(--line)' }
const small = { margin: '10px 0 0', fontSize: 13, color: 'var(--ink2)' }
const row = { display: 'flex', gap: 12, alignItems: 'baseline', padding: '12px 0', borderTop: '1px solid var(--line)' }
const tagS = (c) => ({ flex: '0 0 auto', minWidth: 54, fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: c })
const when = (iso) => (iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) : '')
const COL = { police: '#6FB7FF', fire: '#FF8A5C', news: '#F5B83D' }

export default async function Updates() {
  const { items, more, updatedAt } = await getTicker()
  const gold = items.find((x) => x.kind === 'gold')
  const gas = items.find((x) => x.kind === 'gas')
  const List = ({ list, empty }) =>
    list.length ? (
      <div>
        {list.map((x, i) => (
          <div key={i} style={row}>
            <span style={tagS(COL[x.kind])}>{x.label}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              {x.href ? <a href={x.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink)', fontWeight: 700, textDecoration: 'none' }}>{x.text}</a> : <strong>{x.text}</strong>}
              <span style={{ display: 'block', fontSize: 13, color: 'var(--ink2)', marginTop: 3 }}>{[x.source, x.time || when(x.at)].filter(Boolean).join(' · ')}</span>
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p style={{ ...small, marginTop: 0 }}>{empty}</p>
    )

  return (
    <main style={wrap}>
      <p style={kick}>Live updates · புதுப்பிப்புகள்</p>
      <h1 style={h1}>Today in the GTA.</h1>
      <p style={{ margin: '14px 0 0', maxWidth: 680, fontSize: 18, color: 'var(--ink2)', lineHeight: 1.5 }}>Gold and gas prices, GTA news and Toronto police and fire calls in one place. Refreshed every few minutes. Last checked {when(updatedAt)}</p>

      <section aria-labelledby="pr" style={{ marginTop: 40 }}>
        <h2 id="pr" style={h2}>Prices</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 16 }}>
          <div style={card}>
            <p style={kick}>Gold in Canada (CAD)</p>
            <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{gold ? gold.text : 'Gold price is updating. Check back in a few minutes.'}</p>
            <p style={small}>Spot price, before jeweller making charges and tax, so shop prices are higher. 22K is worked out from 24K (22 ÷ 24). Source: {gold ? gold.source : 'xaus.com'}.</p>
          </div>
          <div style={card}>
            <p style={kick}>Gas & diesel in Toronto</p>
            <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{gas ? gas.text.replace('Toronto avg · ', '') : 'Fuel prices are updating. Check back later.'}</p>
            <p style={small}>Average of Toronto East and West, cents per litre including tax, from the Government of Ontario’s weekly survey (published Mondays). <a href="https://www.ontario.ca/page/motor-fuel-prices" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>All Ontario cities</a>.</p>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 32, marginTop: 44 }}>
        <section aria-labelledby="nw">
          <h2 id="nw" style={h2}>GTA news</h2>
          <List list={more.news} empty="News headlines are updating. Check back in a few minutes." />
        </section>
        <section aria-labelledby="pf">
          <h2 id="pf" style={h2}>Police & fire calls</h2>
          <List list={more.calls} empty="No police or fire calls to show right now." />
          <p style={small}>From the public dispatch feeds of the Toronto Police Service and Toronto Fire Services (last 4 hours). A call is not a confirmed crime or fire. Medical calls and private matters are never shown. In an emergency, call 911.</p>
        </section>
      </div>
    </main>
  )
}
