'use client'
import { useEffect, useMemo, useState } from 'react'
import { indexSite, deco, nowTO } from '@/lib/tto'
import { useApp } from './App'

/**
 * Indexes the directory payload and decorates every business for display.
 * The first render uses the server's clock so the HTML matches; after that it
 * follows the visitor's clock, refreshing "open now" every minute.
 */
export function useSite(raw, nowAt) {
  const app = useApp()
  const site = useMemo(() => indexSite(raw), [raw])
  const [now, setNow] = useState(() => nowTO(new Date(nowAt)))
  useEffect(() => {
    setNow(nowTO())
    const t = setInterval(() => setNow(nowTO()), 60000)
    return () => clearInterval(t)
  }, [])
  const base = useMemo(() => site.businesses.map((b) => deco(b, site, now)), [site, now])
  const all = useMemo(
    () =>
      base.map((b) => {
        const saved = app.saved.includes(b.id), inPlan = app.plan.includes(b.id)
        return {
          ...b,
          heart: saved ? '♥' : '♡',
          heartColor: saved ? '#FF6B7D' : '#FFFFFF',
          savedAria: saved ? 'true' : 'false',
          saveLabel: (saved ? 'Remove ' : 'Save ') + b.name,
          toggleSave: () => app.toggleSave(b.id),
          getQuote: () => app.openQuote([b.id]),
          inPlan,
          planLabel: inPlan ? '✓ In your plan' : '+ Add to plan',
          planBg: inPlan ? 'var(--green)' : 'transparent',
          planFg: inPlan ? '#0E0A07' : 'var(--ink)',
          togglePlan: () => app.togglePlan(b.id),
          n: b.name,
        }
      }),
    [base, app]
  )
  const byId = useMemo(() => Object.fromEntries(all.map((b) => [b.id, b])), [all])
  return { site, all, byId, now, app }
}

/** Background props for a card: uploaded photo, or the dotted placeholder. */
export function pic(o, sz) {
  const p = ((o && o.photos) || []).map((x) => (typeof x === 'string' ? x : x?.url)).find(Boolean)
  return p ? { bgImg: `url("${p}")`, bgSize: 'cover' } : { bgImg: 'radial-gradient(rgba(255,255,255,.18) 1.2px,transparent 1.6px)', bgSize: sz || '14px 14px' }
}
