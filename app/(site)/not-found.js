import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container reading stack-16" style={{ paddingTop: 60 }}>
      <span className="kicker tag-eat">404</span>
      <h1 className="display h1">Aiyo. This page went for tea and never came back.</h1>
      <p className="lede">The link might be old, or we moved things around.</p>
      <div className="row-wrap">
        <Link href="/" className="btn btn-ink">Go home</Link>
        <Link href="/search" className="btn btn-outline">Search</Link>
      </div>
    </div>
  )
}
