import { permanentRedirect } from 'next/navigation'

// Old listing URLs from the first build now live at /b/<id>.
export default async function OldListing({ params }) {
  const { slug } = await params
  permanentRedirect(`/b/${slug}`)
}
