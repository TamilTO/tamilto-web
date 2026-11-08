'use client'
import { useId, useState } from 'react'
import { track } from '@/lib/client'

export default function NewsletterForm({ placement, button = 'Sign me up', showLabel = true, label = 'Email address', buttonClass = 'btn-primary', note }) {
  const id = useId()
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    const email = new FormData(e.currentTarget).get('email')
    setState('loading')
    setError('')
    try {
      const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, placement }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.error || 'Something went wrong — try again?')
      setState('done')
      track('Newsletter Signup', { placement })
    } catch (err) {
      setState('error')
      setError(err.message)
    }
  }

  if (state === 'done') {
    return <p role="status" className="nl-done"><strong>Almost there.</strong> Check your inbox and tap the link to confirm.</p>
  }
  return (
    <form onSubmit={onSubmit} className="nl-form">
      <label htmlFor={id} className={showLabel ? 'nl-label' : 'sr-only'}>{label}</label>
      <input id={id} name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="input" />
      <button type="submit" className={`btn ${buttonClass}`} disabled={state === 'loading'}>{state === 'loading' ? 'Signing up…' : button}</button>
      {note ? <span className="nl-note">{note}</span> : null}
      {state === 'error' ? <span role="alert" className="form-error">{error}</span> : null}
    </form>
  )
}
