import { createHash } from 'node:crypto'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function beehiiv(email, placement) {
  const { BEEHIIV_API_KEY: key, BEEHIIV_PUBLICATION_ID: pub } = process.env
  const r = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/subscriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, reactivate_existing: false, send_welcome_email: true, double_opt_override: 'on', utm_source: 'website', utm_medium: placement }),
  })
  return r.ok
}

async function mailchimp(email, placement) {
  const { MAILCHIMP_API_KEY: key, MAILCHIMP_LIST_ID: list } = process.env
  const dc = key.split('-')[1]
  const hash = createHash('md5').update(email.toLowerCase()).digest('hex')
  const r = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${list}/members/${hash}`, {
    method: 'PUT',
    headers: { Authorization: `Basic ${Buffer.from(`any:${key}`).toString('base64')}`, 'Content-Type': 'application/json' },
    // status_if_new 'pending' = Mailchimp sends the double opt-in confirmation
    body: JSON.stringify({ email_address: email, status_if_new: 'pending', tags: [`signup:${placement}`] }),
  })
  return r.ok
}

async function convertkit(email, placement) {
  const { CONVERTKIT_API_KEY: key, CONVERTKIT_FORM_ID: form } = process.env
  // Double opt-in is set on the Kit form ("Send incentive email").
  const r = await fetch(`https://api.convertkit.com/v3/forms/${form}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, email, fields: { signup_placement: placement } }),
  })
  return r.ok
}

const PROVIDERS = { beehiiv, mailchimp, convertkit }

export async function POST(req) {
  const { email = '', placement = 'unknown' } = await req.json().catch(() => ({}))
  const clean = String(email).trim().toLowerCase()
  if (!EMAIL.test(clean)) return Response.json({ error: 'That email doesn’t look right.' }, { status: 400 })

  const provider = PROVIDERS[process.env.NEWSLETTER_PROVIDER || 'beehiiv']
  const configured =
    (process.env.NEWSLETTER_PROVIDER === 'mailchimp' && process.env.MAILCHIMP_API_KEY) ||
    (process.env.NEWSLETTER_PROVIDER === 'convertkit' && process.env.CONVERTKIT_API_KEY) ||
    ((process.env.NEWSLETTER_PROVIDER || 'beehiiv') === 'beehiiv' && process.env.BEEHIIV_API_KEY)

  if (!configured) {
    if (process.env.NODE_ENV === 'production') return Response.json({ error: 'Signups are temporarily unavailable.' }, { status: 503 })
    console.info('[newsletter:dev] would subscribe', clean, placement)
    return Response.json({ ok: true, dev: true })
  }
  try {
    const ok = await provider(clean, String(placement).slice(0, 40))
    if (!ok) throw new Error('provider rejected')
    return Response.json({ ok: true })
  } catch (e) {
    console.error('[newsletter]', e)
    return Response.json({ error: 'We couldn’t sign you up just now — try again in a minute.' }, { status: 502 })
  }
}
