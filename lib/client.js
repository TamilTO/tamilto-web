// Client helpers: cookie consent + analytics events.
const KEY = 'tto-consent'

export function getConsent() {
  try { return localStorage.getItem(KEY) || 'unset' } catch { return 'unset' }
}
export function setConsent(value) {
  try { localStorage.setItem(KEY, value) } catch {}
  window.dispatchEvent(new CustomEvent('tto-consent', { detail: value }))
}
export function openConsent() {
  window.dispatchEvent(new CustomEvent('tto-consent-open'))
}

/** Plausible custom event (cookieless; runs regardless of consent). */
export function track(name, props) {
  if (typeof window === 'undefined') return
  try { window.plausible?.(name, props ? { props } : undefined) } catch {}
}
