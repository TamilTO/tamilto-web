// Sends email through Resend (resend.com). Without RESEND_API_KEY nothing is sent: the request is
// still saved and shows in the admin, so the team can forward it by WhatsApp.
import 'server-only'

export const FROM = process.env.EMAIL_FROM || 'TamilTO <hello@tamilto.com>'
export const TEAM = process.env.ADMIN_EMAIL || 'hello@tamilto.com'
export const CAN_EMAIL = !!process.env.RESEND_API_KEY

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Returns true when Resend accepted the email. Never throws. */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!CAN_EMAIL || !to) return false
  try {
    const r = await fetch(process.env.RESEND_API_URL || 'https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) console.error('[email] Resend refused', r.status, (await r.text()).slice(0, 300))
    return r.ok
  } catch (e) {
    console.error('[email] failed', e.message)
    return false
  }
}

/** Simple branded email layout. `rows` are [label, value-html] pairs. */
export function layout({ kicker, title, intro, rows = [], button, foot }) {
  const tr = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;color:#5B4F44;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;font-size:15px;color:#1A1410">${v}</td></tr>`)
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#F6F1E8;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="font-size:28px;font-weight:900;color:#1A1410;letter-spacing:.01em">Tamil<span style="color:#B3122E">TO</span></div>
<div style="margin-top:16px;background:#fff;border:1px solid #E6DDD0;border-radius:16px;padding:22px">
<div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#9A5416">${esc(kicker)}</div>
<h1 style="margin:6px 0 10px;font-size:24px;line-height:1.2;color:#1A1410">${esc(title)}</h1>
${intro ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:#1A1410">${intro}</p>` : ''}
<table style="border-collapse:collapse;width:100%">${tr}</table>
${button ? `<p style="margin:18px 0 0"><a href="${esc(button[1])}" style="display:inline-block;background:#B3122E;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">${esc(button[0])}</a></p>` : ''}
</div>
<p style="font-size:12px;line-height:1.5;color:#5B4F44;margin:14px 4px 0">${foot || 'Sent by TamilTO · tamilto.com · The pulse of Tamil Toronto'}</p>
</div></body></html>`
}
