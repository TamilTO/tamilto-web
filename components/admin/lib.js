'use client'
// Shared helpers for the admin panel: the logged-in database connection, photo uploads,
// Toronto dates, friendly error messages and the "refresh the live site" call.
import { createClient } from '@supabase/supabase-js'

export const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const CONFIGURED = !!(SUPA_URL && SUPA_KEY)

let client
/** The admin's own connection. The database's security rules decide what each role may do. */
export const sb = () =>
  (client ||= createClient(SUPA_URL, SUPA_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'tto-admin-auth' },
  }))

/** Turn database errors into plain English. */
export function friendly(e) {
  const m = String(e?.message || e || 'Something went wrong')
  if (/duplicate key.*slug/i.test(m)) return 'That web address (slug) is already used. Pick another.'
  if (/duplicate key/i.test(m)) return 'That already exists.'
  if (/row-level security|permission denied|42501/i.test(m)) return 'Your role is not allowed to do that. Ask the owner.'
  if (/violates check constraint.*phone|cell|fax/i.test(m) && /phone|cell|fax/.test(m)) return 'Phone numbers must be 10 digits, like 4165551234.'
  if (/violates check constraint ".*_slug_check"/i.test(m)) return 'Web address can only use small letters, numbers and dashes, like "best-kothu".'
  if (/sponsor/i.test(m) && /check constraint/i.test(m)) return 'A sponsored story must name its sponsor.'
  if (/ends_at/i.test(m)) return 'The end time must be after the start time.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'No connection to the database. Check your internet and try again.'
  if (/JWT expired|invalid JWT/i.test(m)) return 'Your login expired. Refresh the page and sign in again.'
  return m
}

/** Run a Supabase query; throw a friendly error if it fails. */
export async function run(q) {
  const { data, error, count } = await q
  if (error) throw new Error(friendly(error))
  return count !== undefined && count !== null ? { data, count } : data
}

export const mediaUrl = (path) =>
  !path ? '' : /^https?:\/\//.test(path) ? path : `${SUPA_URL}/storage/v1/object/public/media/${String(path).split('/').map(encodeURIComponent).join('/')}`

export const slugify = (s) =>
  String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export const digits = (s) => {
  let d = String(s || '').replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') d = d.slice(1)
  return d
}
export const fmtPhone = (d) => (d && d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d || '')

// ---------- Toronto time ----------
const TZ = 'America/Toronto'
function offsetMinutes(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date).map((x) => [x.type, x.value]))
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
  return (asUTC - date.getTime()) / 60000
}
/** "2026-11-14T19:30" (Toronto wall clock) -> ISO time. */
export function torontoToISO(wall) {
  if (!wall) return null
  const [d, t = '00:00'] = wall.split('T')
  const [y, mo, da] = d.split('-').map(Number)
  const [h, mi] = t.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, da, h, mi)
  const off = offsetMinutes(new Date(guess - offsetMinutes(new Date(guess)) * 60000))
  return new Date(guess - off * 60000).toISOString()
}
/** ISO time -> "2026-11-14T19:30" Toronto wall clock (for date-time boxes). */
export function isoToToronto(iso) {
  if (!iso) return ''
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
export const when = (iso) =>
  iso ? new Date(iso).toLocaleString('en-CA', { timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
export const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`
  return when(iso)
}

// ---------- Photos ----------
const MAX_SIDE = 2000
/**
 * Shrink a photo in the browser (max 2000px, JPEG) and upload it to the "media" bucket.
 * Returns the storage path. Photos that browsers can't read (like iPhone HEIC) are refused with a clear message.
 */
export async function uploadPhoto(file, folder) {
  if (!file || !/^image\//.test(file.type || '') && !/\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name || '')) throw new Error(`"${file?.name}" is not a photo.`)
  let blob = file
  let ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    if (bmp.width < 400 || bmp.height < 300) throw Object.assign(new Error(`"${file.name}" is too small (${bmp.width}×${bmp.height}). Use a photo at least 800 pixels wide.`), { small: true })
    if (scale < 1 || file.size > 1.5e6 || !/jpe?g|webp/.test(file.type)) {
      const c = document.createElement('canvas')
      c.width = Math.round(bmp.width * scale)
      c.height = Math.round(bmp.height * scale)
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
      blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
      ext = 'jpg'
    }
  } catch (e) {
    if (e.small) throw e
    throw new Error(`"${file.name}" can't be shown on websites (iPhone HEIC photos often can't). Open it, save or share it as JPG, then upload again.`)
  }
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext === 'jpeg' ? 'jpg' : ext}`
  const { error } = await sb().storage.from('media').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false, cacheControl: '31536000' })
  if (error) throw new Error(friendly(error))
  return path
}
export async function removeFiles(paths) {
  const list = paths.filter((p) => p && !/^https?:/.test(p))
  if (list.length) await sb().storage.from('media').remove(list)
}

// ---------- Live site ----------
/** Ask the website to show the latest saved data now (otherwise it catches up within 5 minutes). */
export async function refreshSite() {
  try {
    const { data } = await sb().auth.getSession()
    const t = data?.session?.access_token
    if (!t) return false
    const r = await fetch('/api/revalidate', { method: 'POST', headers: { authorization: `Bearer ${t}`, 'content-type': 'application/json' }, body: '{}' })
    return r.ok
  } catch {
    return false
  }
}

export const TONES = ['#8C2A1C', '#9A5416', '#2F5D50', '#6B3A2E', '#1F4E5F', '#7A5A12', '#4A3B6B', '#8A3B52']
export const randomTone = () => TONES[Math.floor(Math.random() * TONES.length)]
