'use client'
// Canvas drawing for the drifting background, Toronto skyline and the Live GTA map.
// Ported from the TamilTO 3.0 prototype. Pauses when the tab is hidden and shows a
// still frame when the visitor prefers reduced motion.
import { useEffect, useRef } from 'react'
import { proj, hexA, mulberry } from '@/lib/tto'

const TOWER_MAIN = 'M31 -42H33L34.2 -10H29.8Z M29.5 -4H34.5V0H29.5Z M9.5 0H54.5A9.5 9.5 0 0 1 54.5 19H9.5A9.5 9.5 0 0 1 9.5 0Z M15 19H49L46 26H18Z M23 26H41L45 100H19Z'
const TOWER_POD = 'M29 -12H35Q37 -12 37 -10V-6Q37 -4 35 -4H29Q27 -4 27 -6V-10Q27 -12 29 -12Z'

const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light'

function size(cv) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = cv.clientWidth, h = cv.clientHeight
  const W = Math.round(w * dpr), H = Math.round(h * dpr)
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H }
  const ctx = cv.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

/** Runs draw(t) every frame (or every 500ms when motion is reduced) until unmounted. */
function useLoop(draw) {
  const ref = useRef(draw)
  ref.current = draw
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, last = 0, lastStatic = 0
    const loop = (ts) => {
      raf = requestAnimationFrame(loop)
      if (document.hidden) return
      const still = mq.matches
      if (still) { if (ts - lastStatic < 500) return; lastStatic = ts }
      const dt = Math.min(64, ts - (last || ts)); last = ts
      try { ref.current(still ? 0 : ts, still ? 0 : dt) } catch {}
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
}

function buildSky(w, h) {
  const r = mulberry(19), H = Math.min(h * 0.34, 340), back = new Path2D(), front = new Path2D(), win = []
  for (let x = -10; x < w + 10;) { const bw = 14 + r() * 34, bh = H * (0.14 + r() * r() * 0.4); back.rect(x, -bh, bw, bh + 2); x += bw + r() * 4 }
  const tower = (fx, fw, fh, top) => {
    const x = fx * w, bw = Math.max(14, fw * w), bh = fh * H
    if (top === 'step') { front.moveTo(x, 0); front.lineTo(x, -bh * 0.86); front.lineTo(x + bw * 0.12, -bh * 0.86); front.lineTo(x + bw * 0.12, -bh * 0.94); front.lineTo(x + bw * 0.26, -bh * 0.94); front.lineTo(x + bw * 0.26, -bh); front.lineTo(x + bw * 0.74, -bh); front.lineTo(x + bw * 0.74, -bh * 0.94); front.lineTo(x + bw * 0.88, -bh * 0.94); front.lineTo(x + bw * 0.88, -bh * 0.86); front.lineTo(x + bw, -bh * 0.86); front.lineTo(x + bw, 0); front.closePath() }
    else if (top === 'slant') { front.moveTo(x, 0); front.lineTo(x, -bh * 0.88); front.lineTo(x + bw, -bh); front.lineTo(x + bw, 0); front.closePath() }
    else if (top === 'twin') { front.rect(x, -bh, bw * 0.44, bh); front.rect(x + bw * 0.56, -bh * 0.9, bw * 0.44, bh * 0.9) }
    else if (top === 'spire') { front.rect(x, -bh, bw, bh); front.moveTo(x + bw * 0.42, -bh); front.lineTo(x + bw * 0.5, -bh - H * 0.18); front.lineTo(x + bw * 0.58, -bh); front.closePath() }
    else if (top === 'crown') { front.rect(x, -bh, bw, bh); front.rect(x + bw * 0.2, -bh - H * 0.04, bw * 0.6, H * 0.04) }
    else front.rect(x, -bh, bw, bh)
    for (let yy = 10; yy < bh * 0.85; yy += 11) for (let xx = 4; xx < bw - 4; xx += 8) if (r() < 0.16) win.push([x + xx, yy, r() * 6.28])
  }
  ;[[0.02, 0.03, 0.38, 'flat'], [0.06, 0.025, 0.5, 'crown'], [0.095, 0.03, 0.42, 'slant'], [0.135, 0.028, 0.58, 'flat'], [0.17, 0.03, 0.46, 'spire'], [0.21, 0.026, 0.36, 'flat'], [0.245, 0.03, 0.3, 'flat']].forEach((a) => tower(...a))
  const dx = 0.33 * w, dw = Math.max(60, 0.1 * w), dh = H * 0.16
  front.moveTo(dx, 0); front.lineTo(dx, -dh * 0.45); front.quadraticCurveTo(dx + dw / 2, -dh * 1.55, dx + dw, -dh * 0.45); front.lineTo(dx + dw, 0); front.closePath()
  ;[[0.47, 0.032, 0.52, 'flat'], [0.505, 0.03, 0.7, 'step'], [0.54, 0.042, 0.98, 'flat'], [0.587, 0.03, 0.8, 'slant'], [0.622, 0.038, 0.9, 'step'], [0.665, 0.028, 0.68, 'crown'], [0.697, 0.042, 0.6, 'twin'], [0.745, 0.03, 0.82, 'spire'], [0.782, 0.032, 0.52, 'flat'], [0.82, 0.028, 0.64, 'slant'], [0.855, 0.03, 0.44, 'flat'], [0.89, 0.026, 0.56, 'crown'], [0.925, 0.03, 0.4, 'flat'], [0.96, 0.03, 0.5, 'flat']].forEach((a) => tower(...a))
  return { w: Math.round(w), h: Math.round(h), H, back, front, win, tx: 0.44 * w, dome: [dx, dw, dh] }
}

function drawSky(ctx, k, w, h, t, dark, scrollY) {
  const base = h + Math.min(scrollY * 0.08, 120)
  ctx.save(); ctx.translate(0, base)
  ctx.fillStyle = dark ? 'rgba(255,236,210,.055)' : 'rgba(26,20,16,.035)'; ctx.fill(k.back)
  ctx.fillStyle = dark ? 'rgba(255,236,210,.10)' : 'rgba(26,20,16,.065)'; ctx.fill(k.front)
  const [dx, dw, dh] = k.dome
  ctx.strokeStyle = dark ? 'rgba(255,236,210,.08)' : 'rgba(26,20,16,.07)'; ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx + (dw * i) / 4, -dh * 0.45); ctx.lineTo(dx + (dw * i) / 4, -dh * (0.45 + 0.5 * Math.sin((Math.PI * i) / 4))); ctx.stroke() }
  const th = Math.min(k.H * 1.85, h * 0.6), sc = th / 142, sx = sc * 0.6
  ctx.save(); ctx.translate(k.tx - 32 * sx, -100 * sc); ctx.scale(sx, sc)
  ctx.fillStyle = dark ? 'rgba(255,236,210,.13)' : 'rgba(26,20,16,.08)'; ctx.fill(new Path2D(TOWER_MAIN))
  ctx.fillStyle = dark ? 'rgba(245,184,61,.22)' : 'rgba(240,162,2,.3)'; ctx.fill(new Path2D(TOWER_POD))
  ctx.restore()
  const wc = dark ? '245,184,61' : '201,131,0', sp = t ? 1 : 0
  k.win.forEach(([x, yy, ph]) => { ctx.fillStyle = `rgba(${wc},${0.08 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.0006 * sp + ph))})`; ctx.fillRect(x, -yy, 2.5, 3.5) })
  ctx.fillStyle = `rgba(255,90,100,${0.3 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.0025))})`
  ctx.beginPath(); ctx.arc(k.tx, -142 * sc, 2.4, 0, 6.283); ctx.fill()
  ctx.restore()
}

/** Full-page background: drifting colour fields, dot grid and the skyline. */
export function Background() {
  const ref = useRef(null)
  const sky = useRef(null)
  const scrollY = useRef(0)
  useEffect(() => {
    const on = () => { scrollY.current = window.scrollY }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useLoop((t, dt) => {
    const cv = ref.current
    if (!cv) return
    const { ctx, w, h } = size(cv)
    if (!w) return
    const dark = isDark(), sp = dt ? 0.35 : 0
    ctx.clearRect(0, 0, w, h)
    const F = dark ? [['255,94,115', 0.13], ['94,194,209', 0.09], ['245,184,61', 0.1]] : [['179,18,46', 0.05], ['11,85,99', 0.045], ['240,162,2', 0.07]]
    F.forEach(([c, a], i) => {
      const x = w * (0.5 + 0.38 * Math.sin(t * 0.00005 * sp * (1 + i * 0.35) + i * 2.1)), y = h * (0.42 + 0.32 * Math.cos(t * 0.00004 * sp * (1 + i * 0.45) + i * 1.3)), r = Math.max(w, h) * 0.6
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${c},${a})`); g.addColorStop(1, `rgba(${c},0)`)
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
    })
    const S = 40, oy = -((scrollY.current * 0.1) % S)
    ctx.fillStyle = dark ? 'rgba(255,236,210,.07)' : 'rgba(26,20,16,.06)'
    for (let y = oy; y < h + S; y += S) for (let x = S / 2; x < w; x += S) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, 6.283); ctx.fill() }
    if (!sky.current || sky.current.w !== Math.round(w) || sky.current.h !== Math.round(h)) sky.current = buildSky(w, h)
    drawSky(ctx, sky.current, w, h, t, dark, scrollY.current)
  })
  return <canvas ref={ref} className="tto-bg" aria-hidden="true" />
}

/**
 * The stylised GTA map. cfg = { bounds, pins:[{id,lng,lat,hood,catColor,feat,seed}], threads, sel, focus }
 * site = { neighbourhoods, hoodLinks, shore, hoodByKey }
 */
export function MapCanvas({ cfg, site, style }) {
  const ref = useRef(null)
  const cfgRef = useRef(cfg)
  cfgRef.current = cfg
  useLoop((t) => {
    const cv = ref.current, cfg = cfgRef.current
    if (!cv || !cfg) return
    const { ctx, w, h } = size(cv)
    if (!w) return
    const dark = isDark(), sp = t ? 1.1 : 0
    ctx.clearRect(0, 0, w, h)
    const bd = cfg.bounds, P = (lng, lat) => { const q = proj(bd, lng, lat); return [q[0] * w, q[1] * h] }
    const SHORE = site.shore, HOODS = site.neighbourhoods, HOOD = site.hoodByKey
    const ink = dark ? '255,236,210' : '26,20,16'
    ctx.fillStyle = `rgba(${ink},.10)`
    for (let y = 9; y < h; y += 18) for (let x = 9; x < w; x += 18) ctx.fillRect(x - 0.8, y - 0.8, 1.6, 1.6)
    const shore = () => { ctx.beginPath(); SHORE.forEach(([a, b], i) => { const [x, y] = P(a, b); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) }) }
    shore()
    const L = P(...SHORE[SHORE.length - 1]), F0 = P(...SHORE[0])
    ctx.lineTo(L[0], h + 40); ctx.lineTo(F0[0], h + 40); ctx.closePath()
    ctx.fillStyle = dark ? 'rgba(25,62,72,.6)' : 'rgba(11,85,99,.10)'; ctx.fill()
    ctx.save(); ctx.setLineDash([3, 5]); ctx.strokeStyle = dark ? 'rgba(94,194,209,.5)' : 'rgba(11,85,99,.35)'; ctx.lineWidth = 1.2; shore(); ctx.stroke(); ctx.restore()
    const lk = P(-79.56, 43.535)
    if (lk[1] > 14 && lk[1] < h - 6 && lk[0] > 0 && lk[0] < w - 80) { ctx.font = 'italic 600 12px system-ui,sans-serif'; ctx.fillStyle = dark ? 'rgba(94,194,209,.75)' : 'rgba(11,85,99,.6)'; ctx.fillText('Lake Ontario', lk[0], lk[1]) }
    if (cfg.threads) {
      ctx.save(); ctx.setLineDash([2, 9]); ctx.lineDashOffset = -t * 0.03 * sp; ctx.lineWidth = 1.6
      ctx.strokeStyle = dark ? 'rgba(245,184,61,.5)' : 'rgba(179,18,46,.35)'
      site.hoodLinks.forEach(([a, b2]) => {
        const A = HOOD[a], Z = HOOD[b2]; if (!A || !Z) return
        const [x1, y1] = P(A.lng, A.lat), [x2, y2] = P(Z.lng, Z.lat)
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18, x2, y2); ctx.stroke()
      })
      ctx.restore()
    }
    HOODS.forEach((hd, i) => {
      if (cfg.focus && cfg.focus !== hd.key) return
      const [x, y] = P(hd.lng, hd.lat), R = (cfg.focus ? 0.4 : 0.11) * w * (1 + 0.07 * Math.sin(t * 0.0015 * sp + i))
      const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, hexA(hd.colour, dark ? 0.32 : 0.24)); g.addColorStop(1, hexA(hd.colour, 0))
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill()
    })
    const pins = cfg.pins || []
    if (cfg.threads) {
      ctx.lineWidth = 1
      pins.forEach((b) => { const hd = HOOD[b.neighbourhood]; if (!hd) return; const [x1, y1] = P(hd.lng, hd.lat), [x2, y2] = P(b.lng, b.lat); ctx.strokeStyle = hexA(b.catColor, 0.25); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke() })
    }
    pins.forEach((b) => {
      const [x, y] = P(b.lng, b.lat)
      if (x < -10 || x > w + 10 || y < -10 || y > h + 10) return
      const ph = (t * 0.0008 * sp + (b.seed % 100) / 100) % 1, sel = cfg.sel === b.id
      if (b.seed % 7 === 0 || b.feat) { ctx.strokeStyle = hexA(b.feat ? '#F5B83D' : b.catColor, (1 - ph) * 0.75); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 5 + ph * (b.feat ? 22 : 13), 0, 6.283); ctx.stroke() }
      const r = sel ? 8 : b.feat ? 6 : 4.6
      ctx.globalAlpha = 0.9; ctx.fillStyle = b.catColor; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1
      ctx.lineWidth = 2; ctx.strokeStyle = dark ? '#0E0A07' : '#FFFFFF'; ctx.stroke()
      if (sel) { ctx.strokeStyle = dark ? '#F7F0E6' : '#1A1410'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 6.283); ctx.stroke() }
    })
  })
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', ...style }} />
}

/** Clickable pin positions (as % of the map box) for links laid over the canvas. */
export function pinsFor(bd, list) {
  return list
    .map((b) => { const [x, y] = proj(bd, b.lng, b.lat); return { b, x: (x * 100).toFixed(2) + '%', y: (y * 100).toFixed(2) + '%', px: x, py: y } })
    .filter((p) => p.px > 0.02 && p.px < 0.98 && p.py > 0.03 && p.py < 0.97)
}
export function hoodLabelsFor(bd, hoods) {
  return hoods.map((h) => { const [x, y] = proj(bd, h.lng, h.lat); return { n: h.name, href: '/n/' + h.key, x: x * 100 + '%', y: y * 100 + '%' } })
}
