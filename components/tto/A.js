import Link from 'next/link'

/** Internal links use client-side navigation; everything else is a normal link. */
export default function A({ href = '#', children, ...rest }) {
  if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//')) return <Link href={href} {...rest}>{children}</Link>
  return <a href={href} {...rest}>{children}</a>
}
