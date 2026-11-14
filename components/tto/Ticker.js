'use client'
// The "Updates" strip under the menu (like the news line at the bottom of a TV screen).
// Reads /api/ticker when the page opens and every 5 minutes after. Pauses when hovered or focused.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const FALLBACK = [{ kind: 'site', label: 'TamilTO', text: 'Find anything Tamil in the GTA · Plan an event · Post a request and get replies', href: '/plan' }]
const SPEED = 70 // pixels per second

function Item({ it, hidden }) {
  const ext = /^https?:/.test(it.href || '')
  const body = (
    <>
      <b className={'tk-k tk-' + it.kind}>{it.label}</b>
      <span>{it.text}</span>
      {it.time && <span className="tk-t">{it.time}</span>}
    </>
  )
  const props = { className: 'tk-it', tabIndex: hidden ? -1 : undefined }
  return (
    <span className="tk-cell">
      {it.href ? (ext ? <a {...props} href={it.href} target="_blank" rel="noopener noreferrer">{body}</a> : <Link {...props} href={it.href}>{body}</Link>) : <span {...props}>{body}</span>}
      <span className="tk-sep" aria-hidden="true">◆</span>
    </span>
  )
}

export default function Ticker() {
  const [items, setItems] = useState(null)
  const [dur, setDur] = useState(60)
  const [one, setOne] = useState(0)
  const track = useRef(null)

  useEffect(() => {
    let on = true
    const load = () => fetch('/api/ticker').then((r) => (r.ok ? r.json() : null)).then((d) => on && setItems(d && d.items && d.items.length ? d.items : FALLBACK)).catch(() => on && setItems((x) => x || FALLBACK))
    load()
    const t = setInterval(load, 5 * 60e3)
    return () => { on = false; clearInterval(t) }
  }, [])

  // Scroll speed stays the same however many updates there are.
  useEffect(() => {
    if (track.current) setDur(Math.max(20, track.current.scrollWidth / 2 / SPEED))
  }, [items])

  // People who turn off animations get one update at a time instead.
  useEffect(() => {
    const t = setInterval(() => setOne((n) => n + 1), 6000)
    return () => clearInterval(t)
  }, [])

  const list = items || []
  return (
    <div className="tk" role="region" aria-label="TamilTO live updates">
      <span className="tk-lab"><span className="tk-dot" aria-hidden="true" />Updates</span>
      <div className="tk-run">
        {list.length > 0 ? (
          <>
            <div ref={track} className="tk-track" style={{ animationDuration: dur + 's' }}>
              <span className="tk-copy">{list.map((it, i) => <Item key={'a' + i} it={it} />)}</span>
              <span className="tk-copy" aria-hidden="true">{list.map((it, i) => <Item key={'b' + i} it={it} hidden />)}</span>
            </div>
            <div className="tk-still" aria-live="off"><Item it={list[one % list.length]} /></div>
          </>
        ) : (
          <span className="tk-wait">Loading today’s updates…</span>
        )}
      </div>
      <Link href="/updates" className="tk-all">All updates →</Link>
    </div>
  )
}
