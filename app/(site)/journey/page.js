import { redirect } from 'next/navigation'
import { getSite } from '@/lib/data'

export default async function Journeys() {
  const j = (await getSite()).journeys[0]
  redirect(j ? `/journey/${j.id}` : '/directory')
}
