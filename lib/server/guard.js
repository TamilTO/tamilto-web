// Light protection for public forms: same-site check and a per-visitor rate limit.
import 'server-only'
import { createHash } from 'node:crypto'

const hits = new Map()

export const ipOf = (req) => (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

/** True when the form was sent from this website (blocks other sites posting into our forms). */
export function sameSite(req) {
  const origin = req.headers.get('origin')
  if (!origin) return true // some browsers omit it for same-origin requests
  try {
    return new URL(origin).host === (req.headers.get('x-forwarded-host') || req.headers.get('host'))
  } catch {
    return false
  }
}

/** Allow `max` requests per visitor per `windowMs`. Counts are per server instance (good enough against floods). */
export function allow(req, bucket, max, windowMs) {
  const key = bucket + ':' + createHash('sha256').update(ipOf(req)).digest('base64').slice(0, 16)
  const now = Date.now()
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (list.length >= max) return false
  list.push(now)
  hits.set(key, list)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
  return true
}

export const tooMany = () => Response.json({ error: 'Too many tries. Please wait a few minutes and try again.' }, { status: 429 })
export const notOurs = () => Response.json({ error: 'Please send this from tamilto.com.' }, { status: 403 })
