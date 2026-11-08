'use client'
import { useEffect, useState } from 'react'
import { getConsent } from './client'

export function useConsent() {
  const [c, setC] = useState('unset')
  useEffect(() => {
    setC(getConsent())
    const h = (e) => setC(e.detail)
    window.addEventListener('tto-consent', h)
    return () => window.removeEventListener('tto-consent', h)
  }, [])
  return c
}
