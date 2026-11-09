'use client'
import { useState } from 'react'
import { BUSINESS_CATEGORIES, NEIGHBOURHOODS } from '@/lib/site'
import { track } from '@/lib/client'
import { shrinkForm } from '@/lib/shrink'

const DONE = {
  tip: 'Your tip is in our review queue. A real editor reads every one — if we run it, we’ll let you know.',
  event: 'Your event is in our review queue. We’ll email you if we need anything before it goes on the calendar.',
  listing: 'Your listing is in our review queue. We check every business before it goes live — expect an email within 3 business days.',
  ad: 'We’ll send the media kit within two business days.',
}
const AD_OPTIONS = ['Sponsored article', 'Social posts', 'Newsletter sponsorship', 'Featured directory listing', 'Event partnership', 'Not sure yet']

const Field = ({ label, children, hint }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    {hint ? <span className="fine">{hint}</span> : null}
  </label>
)
const Select = ({ name, options, required }) => (
  <select name={name} required={required} defaultValue="">
    <option value="" disabled>Choose…</option>
    {options.map((o) => <option key={o}>{o}</option>)}
  </select>
)
const Photo = ({ label = 'Photo (optional)' }) => (
  <Field label={label} hint="JPG or PNG, up to 4 MB. Only send photos you took or have permission to share.">
    <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
  </Field>
)
const Consent = ({ children }) => (
  <label className="check"><input type="checkbox" name="consent" required />{children}</label>
)

export default function SubmitForm({ kind }) {
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const [key, setKey] = useState(0)

  async function onSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('kind', kind)
    await shrinkForm(fd, 'photo')
    const photo = fd.get('photo')
    if (photo && photo.size > 4 * 1024 * 1024) { setState('error'); setError('That photo is over 4 MB — try a smaller one.'); return }
    setState('loading'); setError('')
    try {
      const r = await fetch('/api/submit', { method: 'POST', body: fd })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Something went wrong — try again?')
      setState('done')
      track('Submission', { kind })
    } catch (err) { setState('error'); setError(err.message) }
  }

  if (state === 'done') {
    return (
      <div role="status" className="notice stack-10">
        <strong className="display h-card">Nandri! Got it.</strong>
        <span>{DONE[kind]}</span>
        {kind !== 'ad' ? <button type="button" className="btn btn-outline btn-sm self-start" onClick={() => { setState('idle'); setKey(key + 1) }}>Send another</button> : null}
      </div>
    )
  }

  return (
    <form key={key} onSubmit={onSubmit} className="form" encType="multipart/form-data">
      {/* honeypot */}
      <input type="text" name="company_website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />

      {kind === 'tip' && (<>
        <div className="form-grid">
          <Field label="Your name"><input name="name" required autoComplete="name" /></Field>
          <Field label="Email"><input name="email" type="email" required autoComplete="email" /></Field>
        </div>
        <Field label="What’s the tip?"><textarea name="details" rows={5} required placeholder="Who, what, where — links help." /></Field>
        <Field label="Neighbourhood (optional)"><Select name="neighbourhood" options={NEIGHBOURHOODS} /></Field>
        <Photo />
        <Consent>I agree TamilTO may contact me and use what I’ve sent (including photos I own) for reporting. My details won’t be published without my permission.</Consent>
      </>)}

      {kind === 'event' && (<>
        <div className="form-grid">
          <Field label="Your name"><input name="name" required autoComplete="name" /></Field>
          <Field label="Email"><input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Event name"><input name="title" required /></Field>
          <Field label="Date & start time"><input name="when" type="datetime-local" required /></Field>
          <Field label="Venue & address"><input name="venue" required /></Field>
          <Field label="Neighbourhood"><Select name="neighbourhood" options={NEIGHBOURHOODS} required /></Field>
          <Field label="Price"><input name="price" placeholder="Free, $20, $15–40" /></Field>
          <Field label="Ticket / RSVP link"><input name="ticketUrl" type="url" placeholder="https://" /></Field>
        </div>
        <Field label="Details"><textarea name="details" rows={4} required /></Field>
        <Photo label="Poster or photo (optional)" />
        <Consent>I’m the organizer or have permission to share this event, and I have the rights to the image.</Consent>
      </>)}

      {kind === 'listing' && (<>
        <div className="form-grid">
          <Field label="Business name"><input name="title" required /></Field>
          <Field label="Category"><Select name="category" options={BUSINESS_CATEGORIES} required /></Field>
          <Field label="Your name"><input name="name" required autoComplete="name" /></Field>
          <Field label="Email"><input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Phone"><input name="phone" type="tel" autoComplete="tel" /></Field>
          <Field label="Neighbourhood"><Select name="neighbourhood" options={NEIGHBOURHOODS} required /></Field>
          <Field label="Address"><input name="address" autoComplete="street-address" /></Field>
          <Field label="Website or Instagram"><input name="website" /></Field>
        </div>
        <Field label="Tell us about the business"><textarea name="details" rows={3} required /></Field>
        <fieldset className="tiers">
          <legend>Listing tier</legend>
          <label className="tier"><input type="radio" name="tier" value="free" defaultChecked /><span><strong>Free</strong><br /><span className="fine">Standard listing</span></span></label>
          <label className="tier tier-featured"><input type="radio" name="tier" value="featured" /><span><strong>Featured</strong><br /><span className="fine">Top of search + homepage spotlight</span></span></label>
        </fieldset>
        <Photo label="Storefront or product photo (optional)" />
        <Consent>I confirm this business is Tamil-owned and TamilTO may contact me about this listing.</Consent>
      </>)}

      {kind === 'ad' && (<>
        <div className="form-grid">
          <Field label="Your name"><input name="name" required autoComplete="name" /></Field>
          <Field label="Business"><input name="title" required autoComplete="organization" /></Field>
          <Field label="Email"><input name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Interested in"><Select name="interest" options={AD_OPTIONS} /></Field>
        </div>
        <Field label="Anything else? (optional)"><textarea name="details" rows={3} /></Field>
      </>)}

      {state === 'error' ? <p role="alert" className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary self-start" disabled={state === 'loading'}>
        {state === 'loading' ? 'Sending…' : { tip: 'Send tip', event: 'Submit event', listing: 'Send for review', ad: 'Request media kit' }[kind]}
      </button>
    </form>
  )
}
