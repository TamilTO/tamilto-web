'use client'
import Link from 'next/link'
import { track } from '@/lib/client'

export default function TrackedLink({ href, event, props, newTab, children, ...rest }) {
  const onClick = () => event && track(event, props)
  if (href.startsWith('/')) return <Link href={href} onClick={onClick} {...rest}>{children}</Link>
  const tab = newTab ?? /^https?:/.test(href)
  return (
    <a href={href} onClick={onClick} {...(tab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>
      {children}
    </a>
  )
}
