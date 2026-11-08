import EventsView from '@/components/tto/views/Events'
import JsonLd from '@/components/JsonLd'
import { getSite, getEvents } from '@/lib/data'
import { pageMeta, eventLd } from '@/lib/seo'

export const revalidate = 900

export const metadata = pageMeta({
  title: 'Tamil events in Toronto and the GTA',
  description: 'Festivals, concerts, movie nights and community events across Tamil Toronto. Add any of them to your calendar.',
  path: '/events',
})

export default async function EventsPage() {
  const [raw, events] = await Promise.all([getSite(), getEvents()])
  return (
    <>
      <EventsView raw={{ categories: raw.categories, neighbourhoods: raw.neighbourhoods, askKeywordRules: [] }} events={events} />
      <JsonLd data={events.slice(0, 20).map(eventLd)} />
    </>
  )
}
